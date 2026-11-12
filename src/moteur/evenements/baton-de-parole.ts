import type { Evenement } from "../types";

/**
 * BÂTON DE PAROLE (animation) : seul celui qui tient le bâton peut parler.
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const batonDeParole: Evenement = {
  alias: "baton-de-parole",
  titre: "Bâton de parole",
  image: "🪄",
  description: "Seul celui qui tient le bâton de parole a le droit de parler.",
  explication: [
    "Un objet sert de bâton de parole : seul celui qui le tient a le droit de parler.",
    "Le bâton passe de main en main pendant le débat.",
    "C'est une animation : le meneur fait respecter la règle."
  ]
};

export default batonDeParole;
