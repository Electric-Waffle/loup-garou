import { aube } from "./aube";
import { melanger, type Aleatoire } from "./distribution";
import { appliquerResultat, tourDeCarte } from "./donner";
import { EVENEMENTS, LISTE_EVENEMENTS } from "./evenements";
import { donnerTag } from "./recevoir";
import { ROLES } from "./roles";
import { peutAgir } from "./tours";
import type {
  ChoixFait, Decision, Entree, Evenement, Info, Joueur, Phase, Role, TypeCible
} from "./types";
import { verifierVictoire } from "./victoire";

export interface JoueurInitial {
  id: string;
  nom: string;
  image: string;
  role: string;
}

export type Apparence = Record<string, { titre?: string; image?: string }>;

export interface OptionsPartie {
  apparence?: Apparence;
  aleatoire?: Aleatoire;
  cartesActives?: string[];  // cartes activées dans Options, distribuées ou non
  cartesFantomes?: boolean;  // appeler la nuit les cartes activées que personne n'a reçues
}

export interface DecisionCourante {
  alias: string;
  moi?: Joueur;             // absent pour une carte fantôme : personne ne la porte
  porteurs: Joueur[];
  decision: Decision;
  urgente: boolean; // décision en attente (ex. le Chasseur qui meurt)
}

/**
 * Tags qui empêchent un joueur de faire son rôle, avec le libellé affiché au meneur.
 * RÉUTILISABLE : une nouvelle cause de blocage = une ligne ici, rien dans les rôles.
 */
const TAGS_BLOQUANTS: Record<string, string> = {
  enchante: "enchanté, il garde les yeux fermés",
  maudit: "maudit par la pleureuse, il ne fait pas son rôle"
};

export function nbCibles(type: TypeCible = "aucune"): number {
  if (type === "aucune") return 0;
  if (type === "deux_joueurs") return 2;
  return 1;
}

/**
 * État d'une partie + déroulé des phases.
 * Ne contient AUCUNE règle de rôle : celles-ci vivent dans roles/*.ts et recevoir.ts.
 */
export class Partie {
  joueurs: Joueur[];
  tour = 1;
  phase: Phase = "nuit";
  journal: Entree[] = [];
  infos: (Info & { tour: number; phase: Phase })[] = [];
  file: string[] = [];                               // cartes restant à appeler cette nuit
  attente: { alias: string; joueur: string }[] = []; // décisions urgentes (Chasseur…)
  evenement?: Evenement;
  vainqueur?: string;
  plaidoirie?: string;                               // id du joueur qui a racheté son vote : il parle seul
  debutPhase = 0;                                    // index du journal au début de la phase
  aleatoire: Aleatoire;
  private apparence: Apparence;

  cartesHorsJeu: string[];    // cartes activées que personne n'a reçues
  cartesDuSavant: string[];   // 3 cartes hors jeu, tirées seulement si le Loup savant est actif
  private cartesFantomes: boolean;

  constructor(joueurs: JoueurInitial[], options: OptionsPartie = {}) {
    this.apparence = options.apparence ?? {};
    this.aleatoire = options.aleatoire ?? Math.random;
    this.cartesFantomes = options.cartesFantomes ?? false;
    this.joueurs = joueurs.map(j => ({
      ...j,
      vivant: true,
      tags: [],
      memoire: this.role(j.role).init?.() ?? {}
    }));

    const cartesActives = options.cartesActives ?? [];
    const distribuees = new Set(joueurs.map(j => j.role));
    this.cartesHorsJeu = cartesActives.filter(alias => !distribuees.has(alias));

    // ATTENTION : exception à « aucune règle de rôle ici ». Les 3 cartes doivent exister dès que
    // le Loup savant est ACTIF, même s'il n'est pas distribué (la Voyante peut les sonder) :
    // aucun joueur ne peut donc les tirer, c'est la partie qui le fait au lancement.
    const loupSavantActif = cartesActives.includes("loup-savant");
    this.cartesDuSavant = loupSavantActif ? melanger(this.cartesHorsJeu, this.aleatoire).slice(0, 3) : [];

    // Crochet debut() : ce que chaque rôle possède avant la nuit 1 (l'or du Marchand).
    // POURQUOI par appliquerResultat et pas init() : init() remplit la memoire du rôle, invisible
    // des autres ; un TAG passe par donnerTag, apparaît au journal et peut changer de main.
    for (const joueur of this.joueurs) {
      appliquerResultat(this, this.roleDe(joueur).debut?.(this, joueur), joueur.role);
    }

    // ATTENTION : en dernier, car la file de la nuit 1 lit cartesHorsJeu et cartesFantomes.
    this.commencerNuit();
  }

  /* ================= Accès ================= */

  role(alias: string): Role {
    const r = ROLES[alias];
    if (!r) throw new Error(`Rôle inconnu : ${alias}`);
    return r;
  }
  roleDe(j: Joueur): Role { return this.role(j.role); }
  titre(alias: string): string { return this.apparence[alias]?.titre || this.role(alias).titre; }
  image(alias: string): string { return this.apparence[alias]?.image || this.role(alias).image; }

  joueur(id: string): Joueur {
    const j = this.joueurs.find(j => j.id === id);
    if (!j) throw new Error(`Joueur inconnu : ${id}`);
    return j;
  }
  vivants(): Joueur[] { return this.joueurs.filter(j => j.vivant); }
  joueursAvecRole(alias: string): Joueur[] { return this.vivants().filter(j => j.role === alias); }

  /**
   * Joueurs vivants appelés quand la carte `alias` joue : ceux qui ont ce rôle,
   * plus ceux dont le rôle la « rejoint » (le Loup succube se réveille avec les loups).
   * POURQUOI pas joueursAvecRole : un Loup succube seul survivant doit encore pouvoir dévorer.
   */
  porteursDe(alias: string): Joueur[] {
    // Carte sans porteur fixe (Réunion des amoureux) : elle calcule elle-même qui se réveille.
    // ATTENTION : ROLES[alias] et pas this.role(alias), car alias peut être une source qui
    // n'est pas une carte ("vote", l'id d'un joueur…), voir transmettreLOr dans recevoir.ts.
    const calculerLesPorteurs = ROLES[alias]?.porteurs;
    if (calculerLesPorteurs) return calculerLesPorteurs(this);

    return this.vivants().filter(j => {
      const aCeRole = j.role === alias;
      const rejointCetteCarte = this.roleDe(j).rejoint?.includes(alias) ?? false;
      return aCeRole || rejointCetteCarte;
    });
  }
  joueursAvecTag(tag: string): Joueur[] { return this.vivants().filter(j => this.aTag(j, tag)); }
  aTag(j: Joueur, tag: string): boolean { return j.tags.some(t => t.type === tag); }
  /**
   * j porte-t-il ce tag, posé par cette carte ? Ex. aTagDe(j, "protege", "salvateur") :
   * seule la protection du Salvateur bloque les loups qui lient ou regardent (pas celle d'un événement).
   */
  aTagDe(j: Joueur, tag: string, source: string): boolean {
    return j.tags.some(t => t.type === tag && t.source === source);
  }

  /** Retire un tag. Avec une profondeur, l'opération est tracée dans le journal. */
  retirerTag(j: Joueur, tag: string, profondeur?: number): void {
    if (!this.aTag(j, tag)) return;
    j.tags = j.tags.filter(t => t.type !== tag);
    if (profondeur !== undefined) this.log({ type: "retire", joueur: j.id, tag, profondeur });
  }

  /**
   * Les joueurs (morts ou vivants) que la mort de j entraîne par chagrin : meta.partenaires de son tag "amoureux".
   * Réseau : Cupidon, le Loup amoureux et le Loup succube peuvent tous lier le même joueur,
   * la liste s'allonge (voir recevoir.ts, case "amoureux"). Liste vide = lien à sens unique.
   */
  partenairesDe(j: Joueur): Joueur[] {
    const ids = j.tags.find(t => t.type === "amoureux")?.partenaires;
    if (!Array.isArray(ids)) return [];
    return ids.map(id => this.joueur(id));
  }

  /** Le joueur auquel l'Arlequin l'a lié cette nuit (tag "lie"), mort ou vivant. */
  partenaireLie(j: Joueur): Joueur | undefined {
    const id = j.tags.find(t => t.type === "lie")?.partenaire;
    return typeof id === "string" ? this.joueur(id) : undefined;
  }

  auHasard<T>(liste: T[]): T | undefined {
    return liste.length ? liste[Math.floor(this.aleatoire() * liste.length)] : undefined;
  }

  log(e: Omit<Entree, "tour" | "phase">): void {
    this.journal.push({ tour: this.tour, phase: this.phase, ...e });
  }

  ajouterInfo(info: Info): void {
    this.infos.push({ ...info, tour: this.tour, phase: this.phase });
    this.log({ type: "info", joueur: info.pour === "tous" ? undefined : info.pour, texte: info.texte });
  }

  mettreEnAttente(alias: string, moi: Joueur): void {
    // Un joueur enchanté ou maudit ne fait pas son rôle : aucune décision, aucune réaction
    // (le Chasseur tué ne tire pas, le Rat mordu ne choisit pas). Valable pour tous les rôles.
    const raison = this.raisonDuBlocage(moi, TAGS_BLOQUANTS);
    if (raison) {
      this.log({ type: "info", joueur: moi.id, texte: `${moi.nom} est ${raison} : ${this.titre(alias)} ne se réveille pas.` });
      return;
    }
    this.attente.push({ alias, joueur: moi.id });
  }

  /**
   * Pourquoi j ne peut pas jouer : le libellé du premier tag bloquant qu'il porte, ou undefined.
   * @param tags les tags qui comptent ici (une étape n'est bloquée que par l'enchantement).
   */
  private raisonDuBlocage(j: Joueur, tags: Record<string, string>): string | undefined {
    const tagBloquant = Object.keys(tags).find(tag => this.aTag(j, tag));
    return tagBloquant ? tags[tagBloquant] : undefined;
  }

  /**
   * Les joueurs sélectionnables pour une option.
   * @param porteurs les joueurs qui jouent la carte ; par défaut, moi seul.
   *
   * Règle de l'Arlequin : un joueur lié qui joue SEUL sa carte ne peut viser que lui-même
   * et son partenaire (même mort : le Chasseur lié dont le partenaire est mort ne peut plus tirer).
   * POURQUOI pas pour une carte de groupe : un seul loup lié ne doit pas restreindre toute la
   * meute ; le meneur applique la règle de tête.
   */
  ciblesPossibles(type: TypeCible = "aucune", moi?: Joueur, porteurs: Joueur[] = moi ? [moi] : []): Joueur[] {
    const cibles = this.ciblesDuType(type, moi);

    const joueSeul = porteurs.length === 1;
    const partenaire = moi && joueSeul ? this.partenaireLie(moi) : undefined;
    if (!moi || !partenaire) return cibles;

    return cibles.filter(j => j.id === moi.id || j.id === partenaire.id);
  }

  private ciblesDuType(type: TypeCible, moi?: Joueur): Joueur[] {
    switch (type) {
      case "aucune": return [];
      case "un_autre": return this.vivants().filter(j => j.id !== moi?.id);
      case "un_mordu": return this.joueursAvecTag("mordu");
      case "n_importe_qui": return this.joueurs; // morts compris (Conciliabule)
      default: return this.vivants();
    }
  }

  /* ================= Décisions ================= */

  decisionCourante(): DecisionCourante | undefined {
    const urgente = this.attente[0];
    if (urgente) {
      const moi = this.joueur(urgente.joueur);
      const role = this.role(urgente.alias);
      return { alias: urgente.alias, moi, porteurs: [moi], decision: role.decision!(this, moi), urgente: true };
    }
    if (this.phase !== "nuit") return undefined;

    const alias = this.file[0];
    if (!alias) return undefined;
    const porteurs = this.porteursDe(alias);
    // ATTENTION : pour une carte de groupe, `moi` peut être un joueur qui la « rejoint »
    // (un Loup succube pendant le tour des loups). Ne pas lire sa memoire en croyant tenir un loup.
    const moi = porteurs[0];
    if (!moi) {
      // Carte fantôme : activée mais jamais distribuée, on l'appelle pour faire semblant.
      if (this.estFantome(alias)) {
        return { alias, porteurs, decision: this.decisionSansAction(alias, "carte fantôme : personne ne l'a reçue, faites semblant"), urgente: false };
      }
      // Plus personne pour jouer cette carte (porteur mort) : on la saute.
      this.file.shift();
      return this.decisionCourante();
    }

    // POURQUOI ici et pas dans chaque rôle : tous les rôles, présents et futurs, se comportent
    // pareil sous l'enchantement de la Fée ou la malédiction de la Pleureuse, sans une ligne de
    // code de leur côté. Une carte de groupe n'est bloquée que si TOUS ses porteurs le sont.
    // ATTENTION : une étape (Conciliabule, Réunion) n'est pas un rôle, la malédiction ne la bloque
    // pas ; sinon le Conciliabule, dont tous les porteurs sont maudits, ne se jouerait jamais.
    const estUneEtape = this.role(alias).porteurs !== undefined;
    const tags = estUneEtape ? { enchante: TAGS_BLOQUANTS.enchante } : TAGS_BLOQUANTS;
    const raisons = porteurs.map(j => this.raisonDuBlocage(j, tags));
    const tousBloques = raisons.every(raison => raison !== undefined);
    const decision = tousBloques
      ? this.decisionSansAction(alias, raisons[0]!)
      : this.role(alias).decision!(this, moi);
    return { alias, moi, porteurs, decision, urgente: false };
  }

  private estFantome(alias: string): boolean {
    return this.cartesFantomes && this.cartesHorsJeu.includes(alias);
  }

  /** Une décision sans aucun choix : l'interface n'affiche que « Passer ». */
  private decisionSansAction(alias: string, raison: string): Decision {
    return { message: `${this.titre(alias)} se réveille… (${raison}).`, choix: [] };
  }

  /** Le meneur valide un choix pour la décision courante (étapes 2 → 3 → 4). */
  jouer(choix: ChoixFait): void {
    const courante = this.decisionCourante();
    if (!courante) throw new Error("Aucune décision en cours.");
    const option = courante.decision.choix.find(c => c.id === choix.id);
    if (!option) throw new Error(`Choix invalide : ${choix.id}`);
    if (choix.cibles.length !== nbCibles(option.cible)) {
      throw new Error(`« ${option.label} » demande ${nbCibles(option.cible)} cible(s).`);
    }

    // Une carte fantôme n'a aucun choix : l'option a déjà été refusée plus haut. Ce test rassure TypeScript.
    if (!courante.moi) throw new Error("Carte fantôme : seul « Passer » est possible.");

    if (courante.urgente) this.attente.shift();
    else this.file.shift();

    tourDeCarte(this, courante.alias, choix, courante.moi);
  }

  /** Le meneur passe le tour de la carte courante sans action. */
  passer(): void {
    const courante = this.decisionCourante();
    if (!courante) return;
    if (courante.urgente) this.attente.shift();
    else this.file.shift();
    this.log({ type: "passe", source: courante.alias, texte: `${this.titre(courante.alias)} : passe` });
  }

  /* ================= Déroulé ================= */

  private changerPhase(phase: Phase): void {
    this.phase = phase;
    this.debutPhase = this.journal.length;
    this.log({ type: "phase", texte: phase });
  }

  /** Renvoie true si la partie est terminée. */
  private verifier(): boolean {
    const v = verifierVictoire(this);
    if (v) {
      this.vainqueur = v;
      this.changerPhase("fin");
    }
    return !!v;
  }

  commencerNuit(): void {
    this.changerPhase("nuit");
    // Cartes à appeler : le rôle de chaque vivant, plus les cartes que ce rôle rejoint.
    // POURQUOI : sans ça, s'il ne reste que le Loup succube, la carte "loup" disparaît de la file.
    // CONCEPT : un Set ignore les doublons, comme array_unique en PHP, mais au fil de l'ajout.
    const aliasPresents = new Set<string>();
    for (const joueur of this.vivants()) {
      aliasPresents.add(joueur.role);
      for (const carteRejointe of this.roleDe(joueur).rejoint ?? []) aliasPresents.add(carteRejointe);
    }
    // Cartes fantômes : appelées comme les autres (priorité, tours), sans porteur.
    if (this.cartesFantomes) {
      for (const alias of this.cartesHorsJeu) aliasPresents.add(alias);
    }
    // Cartes à porteurs calculés (Réunion des amoureux) : toujours dans la file.
    // POURQUOI pas seulement si elles ont des porteurs maintenant : la nuit 1, personne n'est
    // encore amoureux au début de la nuit. Leurs porteurs sont relus à leur tour de jouer,
    // et decisionCourante() saute la carte si la liste est vide.
    for (const role of Object.values(ROLES)) {
      if (role.porteurs) aliasPresents.add(role.alias);
    }
    const presents = [...aliasPresents].map(alias => this.role(alias));
    this.file = presents
      .filter(r => r.appelNuit && r.decision && peutAgir(r, this.tour))
      // Sans priorité : en fin de nuit, après toutes les cartes numérotées.
      .sort((a, b) => (a.priorite ?? 999) - (b.priorite ?? 999))
      .map(r => r.alias);
  }

  leverLeJour(): void {
    if (this.file.length || this.attente.length) throw new Error("Des cartes doivent encore jouer.");
    this.changerPhase("aube");
    aube(this);
  }

  ouvrirEvenement(alias?: string): void {
    if (this.attente.length) throw new Error("Une décision est en attente.");
    if (this.verifier()) return;
    this.changerPhase("evenement");
    this.evenement = alias ? EVENEMENTS[alias] : this.auHasard(LISTE_EVENEMENTS);
    if (this.evenement) {
      this.log({ type: "evenement", source: this.evenement.alias, texte: this.evenement.titre });
      appliquerResultat(this, this.evenement.appliquer(this), `evenement:${this.evenement.alias}`);
    }
  }

  /** Vrai si aucun joueur VIVANT n'a le tag "maire" : il faut en élire un. */
  aBesoinDUnMaire(): boolean { return this.joueursAvecTag("maire").length === 0; }

  /** Après l'événement : élection du maire s'il n'y en a pas, sinon directement le débat. */
  suiteDeLEvenement(): void {
    if (this.aBesoinDUnMaire()) this.changerPhase("election");
    else this.ouvrirDebat();
  }

  /** Le meneur désigne le maire. Le tag passe par donnerTag, comme le reste, puis le débat s'ouvre. */
  elire(id: string): void {
    appliquerResultat(this, { donner: [{ tag: "maire", a: id }] }, "election");
    this.ouvrirDebat();
  }

  ouvrirDebat(): void { this.changerPhase("debat"); }
  ouvrirVote(): void { this.changerPhase("vote"); }

  /**
   * Élimine un joueur (ou personne). Le "mort" passe par donnerTag, comme le reste.
   * Si la mort est CONSOMMÉE (le joueur paie avec son or, voir recevoir.ts), le vote est annulé :
   * nouveau débat où l'accusé parle seul, puis nouveau vote.
   */
  voter(id: string | null): void {
    this.plaidoirie = undefined;
    // ATTENTION : la phase change AVANT la mort, car morts() liste les morts depuis le début de la phase.
    this.changerPhase("resultat_vote");
    if (!id) {
      this.log({ type: "info", texte: "Le village n'élimine personne." });
      return;
    }

    // POURQUOI donnerTag ici et pas appliquerResultat : on a besoin de l'Issue renvoyée.
    const issue = donnerTag(this, this.joueur(id), "mort", { source: "vote", cause: "vote" });
    if (issue === "consomme") {
      this.plaidoirie = id;
      this.changerPhase("debat");
    }
  }

  nuitSuivante(): void {
    if (this.attente.length) throw new Error("Une décision est en attente.");
    if (this.verifier()) return;
    this.tour++;
    this.commencerNuit();
  }

  /** Morts survenues depuis le début de la phase, avec la carte révélée. */
  morts(depuis = this.debutPhase): { joueur: Joueur; cause?: string }[] {
    return this.journal
      .slice(depuis)
      .filter(e => e.type === "recu" && e.tag === "mort")
      .map(e => ({ joueur: this.joueur(e.joueur!), cause: e.cause }));
  }

  /**
   * Infos publiques du tour, limitées aux phases demandées (par défaut : toutes).
   * POURQUOI le filtre de phase : une annonce de la NUIT (échec du Loup hypnotiseur) va au rapport
   * de l'aube ; celles de l'événement (la rumeur) restent à l'événement, sans doublon.
   */
  infosPubliques(phases?: Phase[]): string[] {
    return this.infos
      .filter(i => i.pour === "tous" && i.tour === this.tour)
      .filter(i => !phases || phases.includes(i.phase))
      .map(i => i.texte);
  }

  /**
   * Ce que le meneur doit appliquer au vote, d'après les tags "silence" et "dirige"
   * (Loup hypnotiseur). Lu seulement pendant la phase de vote : rien n'est révélé au débat.
   * POURQUOI ici et pas dans loup-hypnotiseur.ts : ce sont des règles de TAGS, valables pour tout
   * futur rôle qui les donnerait (comme "enchante" dans decisionCourante).
   * ATTENTION : un dirigé dont l'hypnotiseur est mort vote librement (il n'y a plus de vote à copier).
   */
  rappelsDuVote(): string[] {
    const rappels: string[] = [];
    for (const joueur of this.joueursAvecTag("silence")) {
      rappels.push(`Ne pas compter le vote de ${joueur.nom} : il est réduit au silence.`);
    }
    for (const joueur of this.joueursAvecTag("dirige")) {
      const idHypnotiseur = joueur.tags.find(t => t.type === "dirige")?.par;
      const hypnotiseur = typeof idHypnotiseur === "string" ? this.joueur(idHypnotiseur) : undefined;
      if (hypnotiseur?.vivant) {
        rappels.push(`Faire pointer ${joueur.nom} vers le même joueur que ${hypnotiseur.nom} : il est dirigé.`);
      }
    }
    return rappels;
  }
}
