import type { Evenement } from "../types";

/**
 * BOUCHE COUSUE (animation) : on parle les lèvres collées pendant le vote.
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const boucheCousue: Evenement = {
  alias: "bouche-cousue",
  titre: "Bouche cousue",
  image: "🫢",
  description: "Pendant le vote, interdit d'ouvrir la bouche : on peut parler, mais les lèvres ne se décollent jamais.",
  explication: [
    "Pendant le vote, personne n'a le droit d'ouvrir la bouche.",
    "On peut parler, mais les lèvres toujours collées.",
    "C'est une animation : le meneur fait respecter la règle."
  ]
};

export default boucheCousue;
