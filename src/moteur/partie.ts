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
  titre: string;            // POURQUOI ici : un événement n'est pas dans le registre des rôles,
  image: string;            // l'interface ne peut donc pas les retrouver avec partie.titre(alias)
  moi?: Joueur;             // absent pour une carte fantôme : personne ne la porte ; le maire pour un événement
  porteurs: Joueur[];
  decision: Decision;
  urgente: boolean;         // décision en attente (ex. le Chasseur qui meurt)
  evenement?: boolean;      // décision d'un événement du jour (le maire désigne)
}

/**
 * Tags qui empêchent un joueur de faire son rôle, avec le libellé affiché au meneur.
 * RÉUTILISABLE : une nouvelle cause de blocage = une ligne ici, rien dans les rôles.
 */
const TAGS_BLOQUANTS: Record<string, string> = {
  enchante: "enchanté, il garde les yeux fermés",
  maudit: "maudit par la pleureuse, il ne fait pas son rôle",
  impuissant: "privé de pouvoir depuis que le village a éliminé l'Ancien",
  catatonique: "catatonique depuis qu'il a vu l'aberration"
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
  evenementApplique = false;                         // l'effet de l'événement du jour a eu lieu
  peutRevoter = false;                               // l'événement propose un second vote (Coup double)
  private aRevote = false;                           // le second vote du jour a déjà eu lieu
  reportDuSablier?: number;                          // secondes restantes, pour le débat du lendemain
  private dureeImposee?: number;                     // minutes, imposées par la suite du Sablier
  vainqueur?: string;
  plaidoirie?: string;                               // id du joueur qui a racheté son vote : il parle seul
  voteEnSuspens?: string;                            // id de l'accusé, tant qu'un rôle doit trancher (avantVote)
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
      return aCeRole || rejointCetteCarte || this.carteImitee(j) === alias;
    });
  }
  /** Carte volée que ce joueur joue en plus de la sienne (tag "imite" du Skinwalker). */
  carteImitee(j: Joueur): string | undefined {
    const role = j.tags.find(t => t.type === "imite")?.role;
    return typeof role === "string" ? role : undefined;
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
      return { ...this.carte(urgente.alias), moi, porteurs: [moi], decision: role.decision!(this, moi), urgente: true };
    }
    if (this.phase === "evenement") return this.decisionDeLEvenement();
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
        return { ...this.carte(alias), porteurs, decision: this.decisionSansAction(alias, "carte fantôme : personne ne l'a reçue, faites semblant"), urgente: false };
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
    return { ...this.carte(alias), moi, porteurs, decision, urgente: false };
  }

  /** Alias, titre et image d'une carte de rôle, tels que l'interface les affiche. */
  private carte(alias: string): { alias: string; titre: string; image: string } {
    return { alias, titre: this.titre(alias), image: this.image(alias) };
  }

  /**
   * Pendant la phase d'événement : la décision du maire, si l'événement en demande une
   * et n'a pas encore été appliqué. Sinon undefined, et l'interface affiche l'écran d'événement.
   */
  private decisionDeLEvenement(): DecisionCourante | undefined {
    const evenement = this.evenement;
    const maire = this.joueursAvecTag("maire")[0];
    if (!evenement?.decision || this.evenementApplique || !maire) return undefined;
    return {
      alias: evenement.alias,
      titre: evenement.titre,
      image: evenement.image,
      moi: maire,
      porteurs: [maire],
      decision: evenement.decision(this, maire),
      urgente: false,
      evenement: true
    };
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
    // POURQUOI recopier les cibles imposées : le moteur (journal, estVise du Hurleur) ne voit que
    // choix.cibles. Une cible connue de la seule carte lui échapperait.
    if (option.cibles) choix = { ...choix, cibles: option.cibles };
    else if (choix.cibles.length !== nbCibles(option.cible)) {
      throw new Error(`« ${option.label} » demande ${nbCibles(option.cible)} cible(s).`);
    }

    // Une carte fantôme n'a aucun choix : l'option a déjà été refusée plus haut. Ce test rassure TypeScript.
    if (!courante.moi) throw new Error("Carte fantôme : seul « Passer » est possible.");

    // Un événement n'est pas un rôle : pas de file, pas de tourDeCarte. Son agir() reçoit le maire.
    if (courante.evenement) {
      const evenement = this.evenement!;
      this.log({ type: "action", source: evenement.alias, texte: `${evenement.titre} : ${choix.id}` });
      appliquerResultat(this, evenement.agir?.(choix, this, courante.moi), `evenement:${evenement.alias}`);
      this.evenementApplique = true;
      return;
    }

    if (courante.urgente) this.attente.shift();
    else this.file.shift();

    tourDeCarte(this, courante.alias, choix, courante.moi);
  }

  /** Le meneur passe le tour de la carte courante sans action. */
  passer(): void {
    const courante = this.decisionCourante();
    if (!courante) return;
    // « Passer » sur la décision d'un événement = Soleil, comme le bouton de l'écran d'événement.
    if (courante.evenement) {
      this.passerEvenement();
      return;
    }
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
      const imitee = this.carteImitee(joueur);
      if (imitee) aliasPresents.add(imitee);
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

  /**
   * Après le rapport de l'aube : victoire ? sinon élection du maire s'il n'y en a pas, puis l'événement.
   * POURQUOI l'élection AVANT l'événement : les événements où « le maire désigne » ont toujours un maire.
   */
  suiteDeLAube(): void {
    if (this.attente.length) throw new Error("Une décision est en attente.");
    if (this.verifier()) return;
    if (this.aBesoinDUnMaire()) this.changerPhase("election");
    else this.ouvrirEvenement();
  }

  /** Vrai si aucun joueur VIVANT n'a le tag "maire" : il faut en élire un. */
  aBesoinDUnMaire(): boolean { return this.joueursAvecTag("maire").length === 0; }

  /** Le meneur désigne le maire. Le tag passe par donnerTag, comme le reste, puis l'événement est tiré. */
  elire(id: string): void {
    appliquerResultat(this, { donner: [{ tag: "maire", a: id }] }, "election");
    this.ouvrirEvenement();
  }

  /* ---------- Événement du jour : tiré, éventuellement remplacé, puis appliqué ---------- */

  /**
   * Ouvre la phase d'événement. Le lendemain d'un Sablier, la suite est imposée.
   * ATTENTION : aucun effet ici. L'événement n'agit qu'à la validation (appliquerEvenement ou
   * jouer), sinon « Un autre » laisserait derrière lui l'effet de l'événement remplacé.
   * @param alias pour imposer un événement (tests) ; absent = tiré au hasard
   */
  ouvrirEvenement(alias?: string): void {
    this.changerPhase("evenement");
    this.evenementApplique = false;
    this.dureeImposee = undefined;
    this.peutRevoter = false;
    this.aRevote = false;

    if (this.reportDuSablier !== undefined) {
      this.dureeImposee = this.reportDuSablier / 60;
      this.reportDuSablier = undefined;
      this.choisirEvenement(EVENEMENTS["sablier-suite"]);
      return;
    }
    this.choisirEvenement(alias ? EVENEMENTS[alias] : this.tirerEvenement());
  }

  /** « Un autre » : un nouveau tirage, différent de l'événement actuel. */
  autreEvenement(): void {
    this.verifierRemplacable();
    this.choisirEvenement(this.tirerEvenement(this.evenement?.alias));
  }

  /** « Passer » : Soleil, il ne se passe rien. */
  passerEvenement(): void {
    this.verifierRemplacable();
    this.choisirEvenement(EVENEMENTS.soleil);
  }

  /** Valide un événement SANS choix (Rumeur, Sablier, animations) : son effet a lieu maintenant. */
  appliquerEvenement(): void {
    const evenement = this.evenement;
    if (!evenement || this.evenementApplique) return;
    if (evenement.decision) throw new Error("Cet événement attend que le maire désigne quelqu'un.");
    appliquerResultat(this, evenement.appliquer?.(this), `evenement:${evenement.alias}`);
    this.evenementApplique = true;
  }

  private tirerEvenement(exclure?: string): Evenement | undefined {
    return this.auHasard(LISTE_EVENEMENTS.filter(e => e.alias !== exclure));
  }

  private choisirEvenement(evenement: Evenement | undefined): void {
    this.evenement = evenement;
    if (evenement) this.log({ type: "evenement", source: evenement.alias, texte: evenement.titre });
  }

  private verifierRemplacable(): void {
    if (this.evenementApplique) throw new Error("L'événement a déjà eu lieu.");
    if (this.evenement?.force) throw new Error(`${this.evenement.titre} ne peut être ni remplacé ni passé.`);
  }

  /* ---------- Débat et vote ---------- */

  /**
   * Durée du débat en minutes (null = pas de minuteur), dans l'ordre :
   * la suite du Sablier, puis le minuteur de l'événement du jour, puis le réglage du meneur.
   */
  dureeDuDebat(parDefaut: number): number | null {
    if (this.dureeImposee !== undefined) return this.dureeImposee;
    if (this.evenement?.minuteur !== undefined) return this.evenement.minuteur;
    return parDefaut;
  }

  /** Ouvre le débat. Refusé tant que l'événement du jour n'a pas eu lieu. */
  ouvrirDebat(): void {
    if (this.phase === "evenement" && !this.evenementApplique) {
      throw new Error("Validez d'abord l'événement du jour.");
    }
    this.changerPhase("debat");
  }

  /**
   * @param secondesRestantes le temps affiché par le minuteur au moment du clic.
   * Un jour de Sablier, le PREMIER passage au vote garde ce temps pour le lendemain ; le second
   * débat d'une plaidoirie (or du Marchand) ne le change pas.
   */
  ouvrirVote(secondesRestantes?: number): void {
    const doitReporter = this.evenement?.reporteLeTempsRestant && this.reportDuSablier === undefined;
    if (doitReporter && secondesRestantes !== undefined) this.reportDuSablier = secondesRestantes;
    this.changerPhase("vote");
  }

  /**
   * Élimine un joueur (ou personne). Le "mort" passe par donnerTag, comme le reste.
   * Si la mort est CONSOMMÉE (le joueur paie avec son or, voir recevoir.ts), le vote est annulé :
   * nouveau débat où l'accusé parle seul, puis nouveau vote.
   */
  voter(id: string | null): void {
    // Sauf-conduit : garde-fou du moteur, même si l'interface rend déjà le siège non cliquable.
    // ATTENTION : vérifié AVANT tout changement d'état, pour que le meneur puisse recliquer.
    if (id && this.aTag(this.joueur(id), "sauf_conduit")) {
      throw new Error(`${this.joueur(id).nom} a un sauf-conduit : il ne peut pas être éliminé aujourd'hui.`);
    }
    const interdiction = this.voteImpossible();
    if (id && interdiction) throw new Error(interdiction);
    this.plaidoirie = undefined;
    this.peutRevoter = false;
    // ATTENTION : la phase change AVANT la mort, car morts() liste les morts depuis le début de la phase.
    this.changerPhase("resultat_vote");
    if (!id) {
      this.log({ type: "info", texte: "Le village n'élimine personne." });
      this.finDuVote(undefined);
      return;
    }

    // Crochet avantVote() : un rôle peut suspendre la mort (le Beau Parleur maire regarde la carte).
    // FLUX : il met une décision URGENTE en attente ; l'interface l'affiche à la place du résultat,
    // puis cette décision appelle trancherLeVote(). Un joueur bloqué (impuissant…) n'est pas mis en
    // attente par mettreEnAttente : la file ne grandit pas, et le vote continue tout de suite.
    // POURQUOI comparer la longueur de la file : le moteur ne connaît aucun rôle ; il regarde
    // seulement SI quelqu'un a demandé la parole, pas QUI.
    const attenteAvant = this.attente.length;
    for (const joueur of this.vivants()) {
      this.roleDe(joueur).avantVote?.(this, joueur, this.joueur(id));
    }
    if (this.attente.length > attenteAvant) {
      this.voteEnSuspens = id;
      return;
    }
    this.executerLeVote(id);
  }

  /**
   * Fin d'un vote suspendu par avantVote().
   * @param relancer true : personne ne meurt, le village revote ; false : la mort a lieu normalement
   *                 (l'or, l'ignifuge, le chagrin… s'appliquent comme pour tout vote).
   */
  trancherLeVote(relancer: boolean): void {
    const id = this.voteEnSuspens;
    if (!id) throw new Error("Aucun vote en suspens.");
    this.voteEnSuspens = undefined;
    if (relancer) {
      this.log({ type: "info", texte: `Le vote contre ${this.joueur(id).nom} est relancé.` });
      this.changerPhase("vote");
      return;
    }
    this.executerLeVote(id);
  }

  /** La mort par vote elle-même, et tout ce qui en découle (plaidoirie, flammes, crochets). */
  private executerLeVote(id: string): void {
    // POURQUOI donnerTag ici et pas appliquerResultat : on a besoin de l'Issue renvoyée.
    const issue = donnerTag(this, this.joueur(id), "mort", { source: "vote", cause: "vote" });
    if (issue === "consomme") {
      this.plaidoirie = id;
      this.changerPhase("debat");
      return;
    }

    // Vote BLOQUÉ (ignifuge, Loup salamandre) : le village l'apprend, et le jour compte comme
    // « personne n'est éliminé » pour l'événement (l'Ultimatum tue alors le maire).
    if (issue === "bloque") {
      this.ajouterInfo({ pour: "tous", texte: `${this.joueur(id).nom} entre dans les flammes et en ressort indemne : un loup l'a protégé.` });
      this.finDuVote(undefined);
      return;
    }

    if (issue !== "accepte") return;
    this.finDuVote(this.joueur(id));
  }

  /**
   * Crochets apresVote() des rôles (Fêtard, Stratège…) puis de l'événement du jour (Ultimatum,
   * Coup double), une fois le vote définitif.
   * FLUX : appelé par voter() quand personne n'est éliminé, quand le vote est bloqué, ou quand la
   * mort a été acceptée ; jamais pendant une plaidoirie (la mort consommée par l'or n'est pas un résultat).
   * POURQUOI pas reagir() : reagir() n'est appelé que sur celui qui reçoit le tag (l'éliminé),
   * jamais sur les autres joueurs.
   */
  private finDuVote(elimine?: Joueur): void {
    for (const joueur of this.vivants()) {
      this.roleDe(joueur).apresVote?.(this, joueur, elimine);
    }
    const evenement = this.evenement;
    const resultat = evenement?.apresVote?.(this, elimine);
    if (!evenement || !resultat) return;
    appliquerResultat(this, resultat, `evenement:${evenement.alias}`);
    // ATTENTION : un seul second vote par jour, même si le second éliminé est encore un loup.
    if (resultat.revoter && !this.aRevote) this.peutRevoter = true;
  }

  /** Coup double : le meneur rouvre le vote (le débat se fait de tête, sans minuteur). */
  revoter(): void {
    if (!this.peutRevoter) throw new Error("Aucun second vote n'est proposé.");
    this.peutRevoter = false;
    this.aRevote = true;
    this.changerPhase("vote");
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
  /**
   * Pourquoi le village ne peut pas voter aujourd'hui, ou undefined s'il le peut.
   * Règle de l'Aberration : tous les villageois VIVANTS sont horrifiés (au moins un).
   * ATTENTION : [].every(...) vaut true ; sans le test de longueur, un village vide « ne voterait pas ».
   */
  voteImpossible(): string | undefined {
    const villageois = this.vivants().filter(j => this.roleDe(j).camp === "village");
    const tousHorrifies = villageois.length > 0 && villageois.every(j => this.aTag(j, "horrifie"));
    return tousHorrifies ? "Tous les villageois sont horrifiés : le village ne peut pas voter." : undefined;
  }

  rappelsDuVote(): string[] {
    const rappels: string[] = [];
    const interdiction = this.voteImpossible();
    if (interdiction) rappels.push(interdiction);
    if (this.evenement?.rappelVote) rappels.push(this.evenement.rappelVote);
    for (const joueur of this.vivants()) {
      const rappel = this.roleDe(joueur).rappelVote?.(this, joueur);
      if (rappel) rappels.push(rappel);
    }
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
    for (const joueur of this.joueursAvecTag("sauf_conduit")) {
      rappels.push(`${joueur.nom} a un sauf-conduit : il ne peut pas être éliminé aujourd'hui.`);
    }
    for (const joueur of this.joueursAvecTag("soupcon")) {
      const maire = this.joueursAvecTag("maire")[0];
      const leMaire = maire ? `le maire (${maire.nom})` : "le maire";
      rappels.push(`${joueur.nom} part avec 2 voix contre lui ; ${leMaire} ne vote pas.`);
    }
    return rappels;
  }
}
