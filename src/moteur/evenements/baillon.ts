import type { Evenement } from "../types";

/**
 * BÂILLON (animation) : le maire désigne une personne qui se tait pendant le vote.
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const baillon: Evenement = {
  alias: "baillon",
  titre: "Bâillon",
  image: "🤐",
  description: "Le maire désigne une personne : elle ne pourra pas parler pendant le vote."
};

export default baillon;
