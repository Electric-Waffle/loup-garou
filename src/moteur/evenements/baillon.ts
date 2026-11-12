import type { Evenement } from "../types";

/**
 * BÂILLON (animation) : le maire désigne une personne qui se tait pendant le vote.
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const baillon: Evenement = {
  alias: "baillon",
  titre: "Colère de Supay",
  image: "🤐",
  description: "Supay, seigneur du monde d'en bas, vole la voix d'une personne désignée par le maire : elle ne pourra pas parler pendant le vote.",
  explication: [
    "Le maire désigne une personne : Supay lui vole la voix.",
    "Elle n'a pas le droit de parler pendant le vote.",
    "C'est une animation : l'application ne vérifie rien, le meneur fait respecter la règle."
  ]
};

export default baillon;
