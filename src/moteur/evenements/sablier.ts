import type { Evenement } from "../types";

/**
 * SABLIER : le débat dure 8 minutes. Le temps restant au « Passer au vote » devient la durée
 * du débat du LENDEMAIN, et ce jour-là aucun événement n'est tiré : seule la suite du Sablier.
 *
 * FLUX : partie.ouvrirVote(secondesRestantes) range le temps dans partie.reportDuSablier ;
 *        le lendemain, partie.ouvrirEvenement() voit ce report et impose sablierSuite.
 * POURQUOI deux événements : la suite n'est jamais tirée au hasard (absente de LISTE_EVENEMENTS)
 * et ne peut être ni remplacée ni passée (force).
 */
export const sablier: Evenement = {
  alias: "sablier",
  titre: "Course d'Inti",
  image: "⏳",
  description: "Inti traverse le ciel : le débat dure 8 minutes. Le temps qui reste au moment du vote sera la durée du débat de demain.",
  explication: [
    "Le débat dure 8 minutes, le temps qu'Inti avance dans le ciel.",
    "Le temps qui reste quand l'oracle passe au vote est gardé.",
    "Le lendemain, aucun événement n'est tiré : le débat dure exactement ce temps restant (Course d'Inti, suite).",
    "Un village qui vote vite s'offre donc un long débat le lendemain."
  ],
  minuteur: 8,
  reporteLeTempsRestant: true
};

export const sablierSuite: Evenement = {
  alias: "sablier-suite",
  titre: "Course d'Inti (suite)",
  image: "⌛",
  description: "Inti reprend sa course : le débat dure le temps qui restait hier au moment du vote. Pas d'autre événement aujourd'hui.",
  explication: [
    "Imposé le lendemain d'une Course d'Inti : il ne peut être ni remplacé ni passé.",
    "Le débat dure le temps qui restait la veille au moment du vote.",
    "Aucun autre événement ce jour-là."
  ],
  force: true
};
