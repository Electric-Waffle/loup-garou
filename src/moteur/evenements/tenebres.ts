import type { Evenement } from "../types";

/**
 * TÉNÈBRES (animation) : débat et vote les yeux fermés, sauf le maire.
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const tenebres: Evenement = {
  alias: "tenebres",
  titre: "Ténèbres",
  image: "🌑",
  description: "Le débat et le vote se font les yeux fermés. Seul le maire garde les yeux ouverts."
};

export default tenebres;
