import type { Evenement } from "../types";

/**
 * BÂTON DE PAROLE (animation) : seul celui qui tient le bâton peut parler.
 * Aucun effet dans le moteur : l'oracle lit la règle et la fait respecter.
 */
const batonDeParole: Evenement = {
  alias: "baton-de-parole",
  titre: "Bâton de Viracocha",
  image: "🪄",
  description: "Seul celui qui tient le bâton de Viracocha, le dieu créateur, a le droit de parler.",
  explication: [
    "Un objet sert de bâton de Viracocha : seul celui qui le tient a le droit de parler.",
    "Le bâton passe de main en main pendant le débat.",
    "C'est une animation : l'oracle fait respecter la règle."
  ]
};

export default batonDeParole;
