import type { Evenement } from "../types";

/**
 * BOUCHE COUSUE (animation) : on parle les lèvres collées pendant le vote.
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const boucheCousue: Evenement = {
  alias: "bouche-cousue",
  titre: "Bouche cousue",
  image: "🫢",
  description: "Pendant le vote, interdit d'ouvrir la bouche : on peut parler, mais les lèvres ne se décollent jamais."
};

export default boucheCousue;
