import type { Evenement } from "../types";

/**
 * CARNAVAL (animation) : on ne désigne les joueurs que par des surnoms de personnages de dessin animé.
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const carnaval: Evenement = {
  alias: "carnaval",
  titre: "Inti Raymi",
  image: "🎭",
  description: "C'est la grande fête du Soleil : interdit d'appeler quelqu'un par son nom, uniquement par un surnom de personnage de film d'animation.",
  explication: [
    "L'Inti Raymi est la grande fête du Soleil : le village se déguise.",
    "Toute la journée, interdit d'appeler un joueur par son nom : on ne le désigne que par un surnom de personnage de film d'animation.",
    "C'est une animation : le meneur fait respecter la règle."
  ]
};

export default carnaval;
