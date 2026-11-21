import type { Evenement } from "../types";

/**
 * FÊTE DES QUATRE BACABS (les quatre saisons, animation) : les trois autres fêtes réunies. Chez les Mayas,
 * les quatre Bacabs soutiennent les quatre coins du ciel, d'où les quatre saisons.
 *   débat : une seule prise de parole, en onomatopées, et la vague (sans minuteur) ;
 *   vote  : bras et jambes comptent.
 * Aucun effet dans le moteur : rappelDebat et rappelVote suffisent.
 * ATTENTION : à la différence de la Fête de Kayab, le maire n'est PAS exempté : la règle ne le dit pas.
 */
const feteQuatreSaisons: Evenement = {
  alias: "fete-quatre-saisons",
  titre: "Fête des quatre Bacabs",
  image: "🌀",
  description: "Les quatre saisons à la fois : vague sans minuteur, une seule parole en onomatopées, et le vote avec les bras et les jambes.",
  explication: [
    "Pendant le débat, tout le monde se tient les mains et fait circuler une vague. Quand elle se brise, le débat est clos : il n'y a pas de minuteur.",
    "Chacun ne parle qu'une seule fois, et uniquement en onomatopées.",
    "Au vote, on peut voter avec ses deux bras et ses deux jambes.",
    "C'est une animation : l'oracle fait respecter la règle."
  ],
  minuteur: null,
  rappelDebat: "Fête des quatre Bacabs : tout le monde se tient les mains et fait passer une vague, le débat est clos quand elle se brise. Une seule prise de parole par joueur, en onomatopées seulement.",
  rappelVote: "Fête des quatre Bacabs : chacun peut voter avec ses deux bras et ses deux jambes. Comptez tous les membres levés."
};

export default feteQuatreSaisons;
