import type { Evenement } from "../types";

/**
 * PASSATION : le maire choisit son successeur.
 * POURQUOI juste donner "maire" : la règle « un seul maire » vit dans recevoir.ts (case "maire")
 * et retire le tag à l'ancien. Elle vaut aussi pour toute future façon de devenir maire.
 *
 * PATTERN : même contrat qu'un rôle. decision() décrit le choix, agir() renvoie ce qu'il DONNE ;
 * le maire tient la place de moi, donc la cible "un_autre" l'exclut (il ne se désigne jamais).
 */
const passation: Evenement = {
  alias: "passation",
  titre: "Passation",
  image: "🎖️",
  description: "Le maire désigne son successeur : cette personne devient le nouveau maire.",
  explication: [
    "Le maire désigne son successeur, jamais lui-même.",
    "La personne désignée devient le nouveau maire, et l'ancien perd son titre : il n'y a toujours qu'un seul maire."
  ],

  decision: (_partie, maire) => ({
    message: `${maire.nom}, le maire, désigne son successeur.`,
    choix: [{ id: "designer", label: "Désigner", cible: "un_autre" }]
  }),

  agir: (choix) => ({
    donner: [{ tag: "maire", a: choix.cibles[0] }]
  })
};

export default passation;
