import type { Evenement } from "../types";

/**
 * TÉNÈBRES (animation) : débat et vote les yeux fermés, sauf le maire.
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const tenebres: Evenement = {
  alias: "tenebres",
  titre: "Ténèbres",
  image: "🌑",
  description: "Le débat et le vote se font les yeux fermés. Seul le maire garde les yeux ouverts.",
  explication: [
    "Tout le monde ferme les yeux pendant le débat et le vote, sauf le maire.",
    "Seul le maire voit qui accuse qui et qui vote quoi.",
    "C'est une animation : le meneur fait respecter la règle."
  ]
};

export default tenebres;
