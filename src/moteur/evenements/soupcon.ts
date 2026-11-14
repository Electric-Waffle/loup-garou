import type { Evenement } from "../types";

/**
 * SOUPÇON : la personne désignée part avec 2 voix contre elle, et le maire ne vote pas.
 * Le moteur ne compte pas les voix : rappelsDuVote() le rappelle à l'oracle.
 *
 * PATTERN : même contrat qu'un rôle. decision() décrit le choix, agir() renvoie ce qu'il DONNE ;
 * le maire tient la place de moi, donc la cible "un_autre" l'exclut (il ne se désigne jamais).
 */
const soupcon: Evenement = {
  alias: "soupcon",
  titre: "Vol du condor",
  image: "🦅",
  description: "Un condor tourne au-dessus d'une personne désignée par le maire, mauvais présage : elle commence le vote avec 2 voix contre elle. Le maire ne vote pas.",
  explication: [
    "Le maire désigne une personne, jamais lui-même : un condor tourne au-dessus d'elle, mauvais présage.",
    "Elle commence le vote avec 2 voix contre elle, et le maire ne vote pas.",
    "L'application ne compte pas les voix : l'oracle l'applique de tête, aidé par le rappel affiché au vote."
  ],

  decision: (_partie, maire) => ({
    message: `${maire.nom}, le maire, désigne la personne qui part avec 2 voix contre elle. Il ne votera pas.`,
    choix: [{ id: "designer", label: "Désigner", cible: "un_autre" }]
  }),

  agir: (choix) => ({
    donner: [{ tag: "soupcon", a: choix.cibles[0], meta: { expire: "aube" } }]
  })
};

export default soupcon;
