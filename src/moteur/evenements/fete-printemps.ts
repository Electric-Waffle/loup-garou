import type { Evenement } from "../types";

/**
 * FÊTE DE SIP (printemps, animation) : au vote, chacun vote avec les bras et les jambes.
 * Aucun effet dans le moteur : l'oracle lit la règle (rappelVote) et la fait respecter.
 */
const fetePrintemps: Evenement = {
  alias: "fete-printemps",
  titre: "Fête de Sip",
  image: "🌱",
  description: "Fête du printemps : on peut voter avec ses deux bras et ses deux jambes.",
  explication: [
    "Au vote, chacun peut voter avec ses deux bras et ses deux jambes : jusqu'à quatre membres levés.",
    "L'oracle compte tous les membres levés.",
    "C'est une animation : l'oracle fait respecter la règle."
  ],
  rappelVote: "Fête de Sip : chacun peut voter avec ses deux bras et ses deux jambes. Comptez tous les membres levés."
};

export default fetePrintemps;
