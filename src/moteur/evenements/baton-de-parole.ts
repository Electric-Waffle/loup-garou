import type { Evenement } from "../types";

/**
 * BÂTON DE PAROLE (animation) : seul celui qui tient le bâton peut parler.
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const batonDeParole: Evenement = {
  alias: "baton-de-parole",
  titre: "Bâton de parole",
  image: "🪄",
  description: "Seul celui qui tient le bâton de parole a le droit de parler."
};

export default batonDeParole;
