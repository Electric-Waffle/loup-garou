import { aube } from "./aube";
import type { Aleatoire } from "./distribution";
import { appliquerResultat, tourDeCarte } from "./donner";
import { EVENEMENTS, LISTE_EVENEMENTS } from "./evenements";
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

export interface DecisionCourante {
  alias: string;
  moi: Joueur;
  porteurs: Joueur[];
  decision: Decision;
  urgente: boolean; // décision en attente (ex. le Chasseur qui meurt)
}

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
  infos: (Info & { tour: number })[] = [];
  file: string[] = [];                               // cartes restant à appeler cette nuit
  attente: { alias: string; joueur: string }[] = []; // décisions urgentes (Chasseur…)
  evenement?: Evenement;
  vainqueur?: string;
  debutPhase = 0;                                    // index du journal au début de la phase
  aleatoire: Aleatoire;
  private apparence: Apparence;

  constructor(joueurs: JoueurInitial[], options: { apparence?: Apparence; aleatoire?: Aleatoire } = {}) {
    this.apparence = options.apparence ?? {};
    this.aleatoire = options.aleatoire ?? Math.random;
    this.joueurs = joueurs.map(j => ({
      ...j,
      vivant: true,
      tags: [],
      memoire: this.role(j.role).init?.() ?? {}
    }));
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
    return this.vivants().filter(j => {
      const aCeRole = j.role === alias;
      const rejointCetteCarte = this.roleDe(j).rejoint?.includes(alias) ?? false;
      return aCeRole || rejointCetteCarte;
    });
  }
  joueursAvecTag(tag: string): Joueur[] { return this.vivants().filter(j => this.aTag(j, tag)); }
  aTag(j: Joueur, tag: string): boolean { return j.tags.some(t => t.type === tag); }

  /** Retire un tag. Avec une profondeur, l'opération est tracée dans le journal. */
  retirerTag(j: Joueur, tag: string, profondeur?: number): void {
    if (!this.aTag(j, tag)) return;
    j.tags = j.tags.filter(t => t.type !== tag);
    if (profondeur !== undefined) this.log({ type: "retire", joueur: j.id, tag, profondeur });
  }

  partenaireDe(j: Joueur): Joueur | undefined {
    const id = j.tags.find(t => t.type === "amoureux")?.partenaire;
    return typeof id === "string" ? this.joueur(id) : undefined;
  }

  auHasard<T>(liste: T[]): T | undefined {
    return liste.length ? liste[Math.floor(this.aleatoire() * liste.length)] : undefined;
  }

  log(e: Omit<Entree, "tour" | "phase">): void {
    this.journal.push({ tour: this.tour, phase: this.phase, ...e });
  }

  ajouterInfo(info: Info): void {
    this.infos.push({ ...info, tour: this.tour });
    this.log({ type: "info", joueur: info.pour === "tous" ? undefined : info.pour, texte: info.texte });
  }

  mettreEnAttente(alias: string, moi: Joueur): void {
    this.attente.push({ alias, joueur: moi.id });
  }

  ciblesPossibles(type: TypeCible = "aucune", moi?: Joueur): Joueur[] {
    switch (type) {
      case "aucune": return [];
      case "un_autre": return this.vivants().filter(j => j.id !== moi?.id);
      case "un_mordu": return this.joueursAvecTag("mordu");
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
    if (!moi) {                // plus personne pour jouer cette carte : on la saute
      this.file.shift();
      return this.decisionCourante();
    }
    return { alias, moi, porteurs, decision: this.role(alias).decision!(this, moi), urgente: false };
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
    const presents = [...aliasPresents].map(alias => this.role(alias));
    this.file = presents
      .filter(r => r.appelNuit && r.decision && peutAgir(r, this.tour))
      .sort((a, b) => (a.priorite ?? 99) - (b.priorite ?? 99))
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

  ouvrirDebat(): void { this.changerPhase("debat"); }
  ouvrirVote(): void { this.changerPhase("vote"); }

  /** Élimine un joueur (ou personne). Le "mort" passe par donnerTag, comme le reste. */
  voter(id: string | null): void {
    this.changerPhase("resultat_vote");
    if (id) {
      appliquerResultat(this, { donner: [{ tag: "mort", a: id, meta: { cause: "vote" } }] }, "vote");
    } else {
      this.log({ type: "info", texte: "Le village n'élimine personne." });
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

  infosPubliques(): string[] {
    return this.infos.filter(i => i.pour === "tous" && i.tour === this.tour).map(i => i.texte);
  }
}
