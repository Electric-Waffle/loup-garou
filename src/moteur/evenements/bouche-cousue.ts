import type { Evenement } from "../types";

/**
 * BOUCHE COUSUE (animation) : on parle les lèvres collées pendant le vote.
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const boucheCousue: Evenement = {
  alias: "bouche-cousue",
  titre: "Masque de jade",
  image: "🫢",
  description: "Chacun porte un masque de jade pendant le vote : on peut parler, mais les lèvres ne se décollent jamais.",
  explication: [
    "Les masques de jade couvrent les visages pendant le vote : personne n'a le droit d'ouvrir la bouche.",
    "On peut parler, mais les lèvres toujours collées.",
    "C'est une animation : le meneur fait respecter la règle."
  ]
};

export default boucheCousue;
