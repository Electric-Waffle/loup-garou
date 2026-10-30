import type { Partie } from "./partie";

export type Camp = "village" | "loups" | "solo" | "fou";

export type Phase = "nuit" | "aube" | "evenement" | "election" | "debat" | "vote" | "resultat_vote" | "fin";

/** Métadonnées qui voyagent avec un tag : qui l'a donné, pourquoi, quand il expire… */
export interface Meta {
  source?: string;
  cause?: string;
  expire?: "aube" | "aube_suivante"; // aube_suivante : survit à l'aube en cours (tag posé PENDANT une aube)
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
  | "deux_joueurs"; // deux joueurs vivants distincts

export interface OptionChoix {
  id: string;
  label: string;
  cible?: TypeCible;
}

export interface Decision {
  message?: string;
  choix: OptionChoix[];
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

  priorite?: number;    // ordre d'appel la nuit (petit = d'abord)
  appelNuit?: boolean;  // le meneur appelle-t-il cette carte la nuit ?
  tours?: Tours;        // absent = toutes les nuits
  rejoint?: string[];   // cartes de groupe que ce rôle joue aussi (ex. ["loup"] : il vote avec les loups)

  /** État initial du rôle, stocké dans joueur.memoire */
  init?(): Record<string, any>;

  /** Au lancement de la partie, avant la nuit 1 : ce que le rôle DONNE (ex. le Marchand reçoit son or). */
  debut?(partie: Partie, moi: Joueur): ResultatAction | void;

  /** Étapes 1-2 : ce que le meneur voit et les choix proposés */
  decision?(partie: Partie, moi: Joueur): Decision;

  /** Étape 3 : DONNER des tags et/ou produire des infos */
  agir?(choix: ChoixFait, partie: Partie, moi: Joueur): ResultatAction | void;

  /** Étape 4a : le joueur qui a CE rôle reçoit un tag. Renvoyer une Issue court-circuite les règles générales. */
  recevoir?(tag: string, meta: Meta, r: Reponses, partie: Partie, moi: Joueur): Issue | void;

  /** Après coup : le tag a été accepté par le joueur qui a ce rôle (ex. le Chasseur meurt → il tire). */
  reagir?(tag: string, meta: Meta, partie: Partie, moi: Joueur): void;

  /** À l'aube, après les conséquences des tags : appelé pour chaque joueur vivant qui a ce rôle (ex. le rat-garou seul meurt). */
  aube?(partie: Partie, moi: Joueur): ResultatAction | void;
}

/* ---------- Événements ---------- */

export interface Evenement {
  alias: string;
  titre: string;
  image: string;
  description: string;
  appliquer(partie: Partie): ResultatAction | void;
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
