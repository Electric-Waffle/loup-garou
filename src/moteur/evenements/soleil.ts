import type { Evenement } from "../types";

/**
 * SOLEIL : il ne se passe rien. C'est aussi l'événement forcé par « Passer ».
 * POURQUOI un vrai événement plutôt que « pas d'événement » : l'écran et le déroulé restent
 * les mêmes ; partie.evenement n'est jamais vide pendant la phase.
 */
const soleil: Evenement = {
  alias: "soleil",
  titre: "Soleil",
  image: "☀️",
  description: "Une belle journée : rien de particulier ne se passe.",
  explication: [
    "Rien de particulier : le débat et le vote se déroulent normalement.",
    "C'est aussi l'événement imposé quand le meneur choisit « Passer »."
  ]
};

export default soleil;
