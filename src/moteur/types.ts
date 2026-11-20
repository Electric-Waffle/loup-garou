import type { Partie } from "./partie";

export type Camp = "village" | "loups" | "solo" | "fou" | "aberration" | "skinwalker";

export type Phase = "nuit" | "aube" | "evenement" | "election" | "debat" | "vote" | "resultat_vote" | "fin";

/** Métadonnées qui voyagent avec un tag : qui l'a donné, pourquoi, quand il expire… */
export interface Meta {
  source?: string;
  cause?: string;
  expire?: "aube" | "aube_suivante"; // aube_suivante : survit à la PROCHAINE aube, disparaît à celle d'après
  [cle: string]: unknown;
}

export interface Tag extends Meta {
  type: string;
  tour: number;
}

export interface Joueur {
  id: string;
  nom: string;
  image: string;
  role: string;            // alias du rôle
  vivant: boolean;
  tags: Tag[];
  memoire: Record<string, any>; // état propre au rôle (potions de la sorcière…)
}

/* ---------- Décision (étapes 1-2) ---------- */

export type TypeCible =
  | "aucune"
  | "un_joueur"     // n'importe quel joueur vivant
  | "un_autre"      // un joueur vivant autre que soi
  | "un_mordu"      // un joueur vivant portant le tag "mordu"
  | "deux_joueurs"   // deux joueurs vivants distincts
  | "n_importe_qui"; // n'importe quel joueur, MORTS COMPRIS (Conciliabule)

export interface OptionChoix {
  id: string;
  label: string;
  cible?: TypeCible;
  /** Cibles imposées (Clair de lune) : l'oracle ne clique rien, partie.jouer() les met dans choix.cibles. */
  cibles?: string[];
}

export interface Decision {
  message?: string;
  choix: OptionChoix[];
  minuteur?: number; // en secondes : l'interface affiche un compte à rebours (Réunion des amoureux)
}

export interface ChoixFait {
  id: string;
  cibles: string[]; // ids des joueurs choisis
}

/* ---------- Donner (étape 3) ---------- */

export interface Don {
  tag: string;
  a: string;   // id du joueur qui reçoit
  meta?: Meta;
}

export interface Info {
  pour: string | "tous"; // id d'un joueur, ou "tous" pour une info publique
  texte: string;
}

export interface ResultatAction {
  donner?: Don[];
  infos?: Info[];
}

/* ---------- Recevoir (étape 4) ---------- */

export type Issue = "accepte" | "bloque" | "consomme" | "transforme" | "redirige";

export interface Reponses {
  accepter(opts?: Meta): Issue;
  bloquer(raison: string): Issue;
  consommer(raison: string): Issue;
  transformer(nouveauTag: string, meta?: Meta): Issue;
  rediriger(autre: Joueur): Issue;
}

/* ---------- Rôle ---------- */

export interface Tours {
  de?: number;     // à partir de la nuit n
  a?: number;      // jusqu'à la nuit n incluse
  chaque?: number; // une nuit sur n à partir de "de"
}

export interface Role {
  alias: string;
  titre: string;        // titre par défaut (modifiable côté front)
  image: string;        // image par défaut : emoji, URL ou data-URL
  camp: Camp;
  description: string;
  /** Explication détaillée, une ligne par paragraphe : affichée dans la fiche de la page Explications. */
  explication?: string[];
  /**
   * Conseil pour bien jouer la carte, une ligne par paragraphe : affiché sous l'explication, dans la
   * fiche. La partie « Fin du jeu » de la page Explications reprend aussi celui du Fou, de
   * l'Aberration, du Skinwalker et du Bâtisseur (voir src/ui/finsDuJeu.ts) : un seul texte à tenir à jour.
   * POURQUOI ici, dans le moteur, alors que le moteur ne le lit jamais : comme `description` et
   * `explication`, c'est la carte qui sait comment on la joue. Tout ce qui la concerne reste dans son fichier.
   */
  conseil?: string[];
  /**
   * Carte « partagée » : à la mort du joueur, le village apprend seulement « un villageois est mort ».
   * Aujourd'hui : Pleureuse, Fêtard, Marchand, Bâtisseur. Lu par l'Œil du Chilam, une relique qui
   * révèle justement laquelle des quatre c'était.
   */
  partagee?: boolean;

  priorite?: number;    // ordre d'appel la nuit (petit = d'abord)
  appelNuit?: boolean;  // l'oracle appelle-t-il cette carte la nuit ?
  tours?: Tours;        // absent = toutes les nuits
  rejoint?: string[];   // cartes de groupe que ce rôle joue aussi (ex. ["loup"] : il vote avec les loups)
  /**
   * Affichage seulement : rangée dans le groupe « Hybride » des options. Ce sont les paires d'une
   * carte du village qui peut DEVENIR une carte des loups (Rat → Rat-garou, Prêtre pur → Prêtre
   * impur, Beau Parleur → Faux Parleur), et ces cartes des loups. Chacune est une carte à part
   * entière, distribuable seule.
   */
  hybride?: boolean;

  /**
   * Carte sans porteur fixe : renvoie les joueurs qui se réveillent pour elle (vide = sautée).
   * Lu par porteursDe() ; une telle carte entre dans la file de CHAQUE nuit (commencerNuit).
   */
  porteurs?(partie: Partie): Joueur[];

  /** État initial du rôle, stocké dans joueur.memoire */
  init?(): Record<string, any>;

  /** Au lancement de la partie, avant la nuit 1 : ce que le rôle DONNE (ex. le Marchand reçoit son or). */
  debut?(partie: Partie, moi: Joueur): ResultatAction | void;

  /** Étapes 1-2 : ce que l'oracle voit et les choix proposés */
  decision?(partie: Partie, moi: Joueur): Decision;

  /** Étape 3 : DONNER des tags et/ou produire des infos */
  agir?(choix: ChoixFait, partie: Partie, moi: Joueur): ResultatAction | void;

  /** Étape 4a : le joueur qui a CE rôle reçoit un tag. Renvoyer une Issue court-circuite les règles générales. */
  recevoir?(tag: string, meta: Meta, r: Reponses, partie: Partie, moi: Joueur): Issue | void;

  /** Après coup : le tag a été accepté par le joueur qui a ce rôle (ex. le Chasseur meurt → il tire). */
  reagir?(tag: string, meta: Meta, partie: Partie, moi: Joueur): void;
  /** Une carte vient de le désigner (avant son agir), avec ou sans tag : le Hurleur. */
  estVise?(partie: Partie, moi: Joueur, alias: string, choix: ChoixFait, acteur: Joueur): void;

  /** À l'aube, après les conséquences des tags : appelé pour chaque joueur vivant qui a ce rôle (ex. le rat-garou seul meurt). */
  aube?(partie: Partie, moi: Joueur): ResultatAction | void;

  /**
   * Après un vote qui a ÉLIMINÉ quelqu'un : appelé pour chaque joueur vivant qui a ce rôle
   * (ex. le Fêtard qui a voté contre un loup). Comme reagir(), il agit via mettreEnAttente / appliquerResultat.
   */
  apresVote?(partie: Partie, moi: Joueur, elimine?: Joueur): void;
  /** Ligne affichée à l'écran du vote (le Stratège : « regardez pour qui il vote »). */
  rappelVote?(partie: Partie, moi: Joueur): string | undefined;

  /**
   * Le village vient de désigner `accuse`, AVANT sa mort : appelé pour chaque joueur vivant qui a ce rôle.
   * Un rôle qui met une décision en attente (mettreEnAttente) SUSPEND le vote ; cette décision le
   * tranche ensuite avec partie.trancherLeVote() (ex. le Beau Parleur maire regarde la carte).
   */
  avantVote?(partie: Partie, moi: Joueur, accuse: Joueur): void;
}

/* ---------- Événements ---------- */

/**
 * Un événement du jour, tiré après l'élection du maire et avant le débat.
 * Deux genres, qui se déduisent des champs présents :
 *   - ANIMATION : ni appliquer, ni decision. L'oracle lit le texte, le moteur ne fait rien.
 *   - GAMEPLAY  : appliquer (sans choix), ou decision + agir (le maire désigne quelqu'un),
 *                 et/ou minuteur (durée du débat).
 * FLUX : tiré (sans effet) → l'oracle peut demander « Un autre » ou « Passer » (Soleil)
 *        → appliqué à la validation (appliquer, ou agir via partie.jouer) → débat.
 */
export interface Evenement {
  alias: string;
  titre: string;
  image: string;
  description: string;
  /** Explication détaillée, une ligne par paragraphe : affichée dans la fiche de la page Explications. */
  explication?: string[];

  /** Effet sans choix, à la validation (ex. la Caravane de lamas). Comme agir() : renvoie ce qu'il donne. */
  appliquer?(partie: Partie): ResultatAction | void;

  /** Le maire désigne : mêmes contrats que pour un rôle, avec le maire à la place de moi. */
  decision?(partie: Partie, maire: Joueur): Decision;
  agir?(choix: ChoixFait, partie: Partie, maire: Joueur): ResultatAction | void;

  /** Durée du débat en minutes ; null = pas de minuteur ; absent = le réglage de l'oracle. */
  minuteur?: number | null;
  /** Le temps restant au « Passer au vote » devient la durée du débat du lendemain (Sablier). */
  reporteLeTempsRestant?: boolean;
  /** Ne peut être ni remplacé ni passé (la suite du Sablier). */
  force?: boolean;

  /** Rappel affiché à l'oracle à l'écran du vote (ex. « si le village n'élimine pas un loup… »). */
  rappelVote?: string;

  /**
   * Après le vote DÉFINITIF du jour (après une éventuelle plaidoirie), avec l'éliminé, ou undefined
   * si personne ne l'a été. Comme agir() : renvoie ce qu'il donne, plus revoter pour proposer un
   * second vote (une seule fois par jour, le moteur y veille).
   */
  apresVote?(partie: Partie, elimine?: Joueur): (ResultatAction & { revoter?: boolean }) | void;
}

/* ---------- Reliques ---------- */

/**
 * Une relique : un modificateur de partie, choisi par l'oracle à la préparation (une seule par partie).
 * Lore : quand un camp gagne, l'oracle offre une relique à l'AUTRE camp à la partie suivante, pour
 * l'aider. `camp` dit donc qui la relique avantage (pas qui la joue).
 *
 * PATTERN : même principe que Role et Evenement. Le moteur ne connaît aucune relique : il appelle des
 * crochets facultatifs aux bons moments, et chaque relique n'implémente que ceux dont elle a besoin.
 * Les crochets reprennent les contrats des rôles (recevoir, reagir, apresVote…), avec la partie à la
 * place de « moi » : une relique agit sur toute la table.
 * ÉTAT : une relique est partagée par toutes les parties ; son état va dans `partie.etatRelique`,
 * jamais dans l'objet relique (comme joueur.memoire pour un rôle).
 */
export type CampDeRelique = "village" | "loups";

export interface Relique {
  alias: string;
  titre: string;
  image: string;
  camp: CampDeRelique;
  description: string;
  /** Explication détaillée, une ligne par paragraphe : fiche de la page Explications. */
  explication?: string[];

  /** Au lancement, avant la nuit 1, après le crochet debut() des rôles. Même contrat que Role.debut. */
  debut?(partie: Partie): ResultatAction | void;

  /**
   * Un joueur QUELCONQUE reçoit un tag. Appelé APRÈS le recevoir() de son rôle et AVANT les règles
   * générales de recevoir.ts : une Issue renvoyée (bloquer, consommer, transformer…) court-circuite la suite.
   */
  recevoir?(tag: string, meta: Meta, r: Reponses, partie: Partie, joueur: Joueur): Issue | void;

  /** Après qu'un joueur QUELCONQUE a accepté un tag (même moment que Role.reagir, pour toute la table). */
  reagir?(tag: string, meta: Meta, partie: Partie, joueur: Joueur): void;

  /**
   * Une carte de la nuit vient d'être jouée (`alias`, avec le choix de l'oracle). Renvoie true pour
   * ouvrir sur-le-champ une décision URGENTE de la relique (comme celle du Chasseur ou du Rat), jouée
   * avant la carte suivante. La Larme d'Ixchel la pose juste après la morsure des loups.
   */
  apresCarte?(partie: Partie, alias: string, choix: ChoixFait): boolean;

  /**
   * Une nuit commence. Renvoie le joueur « moi » d'une décision urgente de la relique pour l'ouvrir
   * tout de suite (la Boussole de Xibalba, une nuit sur deux), ou undefined. Appelé aussi à la nuit 1.
   */
  debutDeNuit?(partie: Partie): Joueur | undefined;

  /** La décision urgente ouverte par apresCarte() ou debutDeNuit() (« Passer » n'existe pas : une option « non »). */
  decision?(partie: Partie): Decision;

  /** Les joueurs mis en avant sur la table pendant cette décision (par défaut : seulement « moi »). */
  porteurs?(partie: Partie): Joueur[];

  /**
   * L'oracle a validé un choix de cette décision. Même contrat que Role.agir().
   * Une relique à plusieurs temps rouvre sa décision avec partie.ouvrirDecisionDeRelique(moi).
   */
  agir?(choix: ChoixFait, partie: Partie): ResultatAction | void;

  /** Après le vote DÉFINITIF du jour. Même contrat que Evenement.apresVote : `revoter` propose un autre vote. */
  apresVote?(partie: Partie, elimine?: Joueur): (ResultatAction & { revoter?: boolean }) | void;

  /** Après la validation de l'événement du jour (l'Œil du Chilam en révèle le nom). */
  apresEvenement?(partie: Partie, evenement: Evenement): ResultatAction | void;

  /**
   * La table est-elle coupée en deux par un trait vertical ? Renvoie le côté de chaque joueur (par id),
   * ou undefined. L'interface dessine le trait et le moteur n'en fait rien d'autre : il ne compte pas
   * les voix, c'est l'oracle qui fait respecter la règle (Domaine des ombres).
   * CONTRAT avec Table.tsx : les joueurs sont assis dans l'ordre de partie.joueurs, le premier en haut,
   * puis dans le sens des aiguilles d'une montre. La table se décale d'un demi-siège quand leur nombre
   * est pair, pour qu'aucun siège ne soit sur le trait : voir la prop `separation` de <Table>.
   */
  separation?(partie: Partie): Record<string, CoteDeTable> | undefined;

  /** Ce que ce joueur a le droit de faire aujourd'hui (parler, voter). undefined = aucune restriction. */
  droitsDuJour?(partie: Partie, joueur: Joueur): DroitsDuJour | undefined;

  /** Lignes de rappel pour l'oracle pendant le débat. */
  rappelsDuDebat?(partie: Partie): string[];
  /** Lignes de rappel pour l'oracle à l'écran du vote (en plus de celles du moteur). */
  rappelsDuVote?(partie: Partie): string[];
}

/** Le côté de la table d'un joueur : à gauche du trait, à droite, ou sur le trait (« scindé »). */
export type CoteDeTable = "gauche" | "droite" | "scinde";

/** Ce qu'un joueur peut faire aujourd'hui. */
export interface DroitsDuJour {
  parole: boolean;
  vote: boolean;
}

/* ---------- Journal ---------- */

export type TypeEntree =
  | "phase" | "action" | "passe" | "info" | "evenement"
  | "recu" | "bloque" | "consomme" | "transforme" | "redirige" | "retire";

export interface Entree {
  tour: number;
  phase: Phase;
  type: TypeEntree;
  joueur?: string;
  tag?: string;
  source?: string;
  cause?: string;
  raison?: string;
  en?: string;
  vers?: string;
  texte?: string;
  profondeur?: number;
}
