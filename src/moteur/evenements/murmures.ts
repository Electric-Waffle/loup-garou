import type { Evenement } from "../types";

/**
 * MURMURES D'OUTRE-TOMBE (animation) : les loups morts désignent un joueur, sans autre effet. Sans loup mort, « Un autre » ou « Passer ».
 * Aucun effet dans le moteur : l'oracle lit la règle et la fait respecter.
 */
const murmures: Evenement = {
  alias: "murmures",
  titre: "Voix d'outre-tombe",
  image: "👻",
  description: "Depuis le monde d'en bas, les loups morts désignent un joueur. C'est tout.",
  explication: [
    "Les loups morts désignent ensemble un joueur, sans autre effet.",
    "Au village d'en tirer quelque chose… ou de s'en méfier.",
    "Sans loup mort, l'oracle tire un autre événement ou passe."
  ]
};

export default murmures;
