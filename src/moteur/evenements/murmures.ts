import type { Evenement } from "../types";

/**
 * MURMURES D'OUTRE-TOMBE (animation) : les loups morts désignent un joueur, sans autre effet. Sans loup mort, « Un autre » ou « Passer ».
 * Aucun effet dans le moteur : le meneur lit la règle et la fait respecter.
 */
const murmures: Evenement = {
  alias: "murmures",
  titre: "Murmures d'outre-tombe",
  image: "👻",
  description: "Les loups morts désignent un joueur. C'est tout."
};

export default murmures;
