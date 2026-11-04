import type { Evenement } from "../types";

/** URGENCE : le débat ne dure que 2 minutes (partie.dureeDuDebat lit le champ minuteur). */
const urgence: Evenement = {
  alias: "urgence",
  titre: "Urgence",
  image: "🚨",
  description: "Le débat ne dure que 2 minutes.",
  minuteur: 2
};

export default urgence;
