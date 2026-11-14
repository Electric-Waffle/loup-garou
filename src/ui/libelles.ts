/* =====================================================================================
 *  libelles.ts — les textes affichés pour les camps, les groupes de cartes, les nuits et les tags
 * =====================================================================================
 *
 *  RÉUTILISABLE : partagés par Options (réglages), PartieVue (la table) et Explications (les fiches).
 *  POURQUOI un module à part : une page ne doit pas importer une autre page pour un libellé.
 * ===================================================================================== */

import type { Camp, Role, Tours } from "../moteur/types";

/**
 * Libellé affiché pour chaque camp (badge de la carte).
 * POURQUOI typé Record<Camp, string> : si un nouveau camp est ajouté dans types.ts,
 * TypeScript signalera ici qu'il manque son libellé.
 */
export const LIBELLES_CAMPS: Record<Camp, string> = {
  village: "Village",
  loups: "Loups",
  fou: "Fou",
  aberration: "Aberration",
  skinwalker: "Skinwalker",
  solo: "Solo"
};

/**
 * Groupes de cartes de la page : les camps, plus « Hybride » (les cartes marquées Role.hybride :
 * Rat, Rat-garou, Prêtre pur, Prêtre impur, Beau Parleur, Faux Parleur). Ce n'est PAS un camp du
 * moteur : leur badge garde leur vrai camp.
 * ATTENTION : l'ORDRE des clés compte. C'est l'ordre d'affichage des groupes
 * (un objet garde ses clés texte dans l'ordre où elles ont été écrites).
 * CONCEPT : Camp | "hybride" = un type union, « un camp, OU le mot hybride ».
 */
export type Groupe = Camp | "hybride";
export const LIBELLES_GROUPES: Record<Groupe, string> = {
  village: "Village",
  loups: "Loups",
  hybride: "Hybride",
  fou: "Fou",
  aberration: "Aberration",
  skinwalker: "Skinwalker",
  solo: "Solo"
};

/**
 * Les groupes, dans l'ordre d'affichage.
 * POURQUOI les tirer de LIBELLES_GROUPES plutôt qu'écrire une liste à part : le Record oblige à
 * avoir TOUS les groupes, donc aucun ne peut être oublié. Une liste à part pourrait l'être.
 * CONCEPT : Object.keys renvoie des string ; "as Groupe[]" dit à TypeScript que ce sont des Groupe
 * (vrai ici, puisque les clés sont celles du Record<Groupe, …>).
 */
export const ORDRE_GROUPES = Object.keys(LIBELLES_GROUPES) as Groupe[];

/** Le groupe où ranger une carte : « Hybride » l'emporte sur son camp. */
export function groupeDe(role: Role): Groupe {
  return role.hybride ? "hybride" : role.camp;
}

/**
 * Transforme le champ `tours` d'un rôle en phrase pour le badge de la carte.
 *   undefined                 → "toutes les nuits"
 *   { de: 1, a: 1 }           → "nuit 1 uniquement"
 *   { de: 2 }                 → "dès la nuit 2"
 *   { de: 2, chaque: 2 }      → "dès la nuit 2, une nuit sur 2"
 */
export function libelleTours(tours?: Tours): string {
  // Pas de restriction : le rôle agit toutes les nuits.
  if (!tours) {
    return "toutes les nuits";
  }

  // Début et fin identiques : une seule nuit.
  const uneSeuleNuit = tours.de !== undefined && tours.de === tours.a;
  if (uneSeuleNuit) {
    return `nuit ${tours.de} uniquement`;
  }

  // Sinon, on assemble un morceau de phrase par champ renseigné.
  const morceaux: string[] = [];
  if (tours.de) {
    morceaux.push(`dès la nuit ${tours.de}`);
  }
  if (tours.a) {
    morceaux.push(`jusqu'à la nuit ${tours.a}`);
  }
  if (tours.chaque) {
    morceaux.push(`une nuit sur ${tours.chaque}`);
  }

  // join(", ") : ["dès la nuit 2", "une nuit sur 2"] → "dès la nuit 2, une nuit sur 2"
  return morceaux.join(", ");
}

/** Libellé affiché sur la table pour chaque tag. Un tag absent d'ici s'affiche avec son nom brut. */
export const TAGS: Record<string, string> = {
  mordu: "🩸 mordu",
  protege: "🛡️ protégé",
  protege_hier: "⏳ protégé hier",
  empoisonne: "☠️ empoisonné",
  amoureux: "💘 amoureux",
  vie_perdue: "💔 vie perdue",
  agonisant: "🐀 agonisant",
  peste: "🦠 peste (4 aubes)",
  peste_active: "🦠 peste (3 aubes)",
  peste_imminente: "🦠 peste (2 aubes)",
  peste_mortelle: "🦠 peste (dernière aube)",
  maire: "🎖️ maire",
  enchante: "✨ enchanté",
  lie: "🎭 lié",
  or: "💰 or",
  blesse: "🩹 blessé",
  renforce: "🧱 maison renforcée",
  invulnerable: "🦇 invulnérable",
  silence: "🤐 silencé",
  dirige: "🌀 dirigé",
  maudit: "😢 maudit",
  fete: "🥳 fait la fête",
  horrifie: "😱 horrifié",
  possede: "😈 possédé",
  imite: "👤 imite une carte",
  ignifuge: "🦎 ignifuge",
  catatonique: "🫥 catatonique",
  impuissant: "🚫 sans pouvoir",
  sauf_conduit: "🛕 asile",
  soupcon: "🦅 soupçonné",
  eclaire: "🌕 éclairé",
  apaisee: "🕊️ démasquée",
  mort: "⚰️ mort"
};
