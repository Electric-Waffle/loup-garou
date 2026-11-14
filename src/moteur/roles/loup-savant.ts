import type { Role } from "../types";

/**
 * LOUP SAVANT : un loup qui découvre, la première nuit, 3 cartes activées mais non distribuées.
 *
 * Déroulé :
 *   1. Au lancement, la PARTIE tire les 3 cartes (partie.cartesDuSavant), parce qu'elles doivent
 *      exister même si ce rôle n'est pas distribué : la Voyante peut les sonder.
 *   2. Nuit 1 : sa carte montre ces 3 cartes ; « Vu » produit une info privée.
 *   3. Chaque nuit : il vote avec les loups (rejoint: ["loup"]).
 */
const loupSavant: Role = {
  alias: "loup-savant",
  titre: "Loup savant",
  image: "📚",
  camp: "loups",
  description: "Un loup qui sait lire les cordelettes à nœuds des archivistes. La première nuit, il découvre 3 cartes activées que personne n'a reçues.",
  explication: [
    "Un loup qui se réveille avec la meute et assiste au choix de la victime.",
    "La première nuit (rang 110), l'oracle lui montre 3 cartes activées dans les options mais que personne n'a reçues.",
    "Il sait donc quelles cartes ne sont pas en jeu, et peut bluffer en prétendant en avoir une.",
    "Ces 3 cartes existent aussi pour la Voyante et le Loup voyante, qui peuvent les sonder pour apprendre qu'elles ne sont à personne."
  ],
  // POURQUOI 110 : juste avant le tour des loups (120), pour qu'il sache avant de voter.
  priorite: 110,
  appelNuit: true,
  tours: { de: 1, a: 1 },
  rejoint: ["loup"],

  decision(partie, moi) {
    return {
      message: `${partie.titre(moi.role)} découvre les cartes hors jeu : ${listeDesCartes(partie.cartesDuSavant, partie.titre.bind(partie))}.`,
      choix: [{ id: "voir", label: "Vu", cible: "aucune" }]
    };
  },

  agir(_choix, partie, moi) {
    const cartes = listeDesCartes(partie.cartesDuSavant, partie.titre.bind(partie));
    return { infos: [{ pour: moi.id, texte: `Cartes hors jeu : ${cartes}.` }] };
  }
};

/**
 * ["sorciere", "voyante"] → "Sorcière, Voyante" ; "aucune" si la liste est vide.
 * CONCEPT : partie.titre.bind(partie) fixe `this` : passée seule, la méthode perdrait sa partie.
 */
function listeDesCartes(aliases: string[], titre: (alias: string) => string): string {
  if (aliases.length === 0) return "aucune";
  return aliases.map(titre).join(", ");
}

export default loupSavant;
