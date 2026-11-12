import type { Evenement } from "../types";

/** URGENCE : le débat ne dure que 2 minutes (partie.dureeDuDebat lit le champ minuteur). */
const urgence: Evenement = {
  alias: "urgence",
  titre: "Urgence",
  image: "🚨",
  description: "Le débat ne dure que 2 minutes.",
  explication: [
    "Le débat ne dure que 2 minutes.",
    "Il faut accuser et se défendre vite : pas de place pour les longs discours."
  ],
  minuteur: 2
};

export default urgence;
