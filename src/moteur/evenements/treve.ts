import type { Evenement } from "../types";

/**
 * TRÊVE : pas de minuteur aujourd'hui (minuteur: null), et le village peut ne tuer personne.
 * POURQUOI rien d'autre : « Personne n'est éliminé » existe déjà à l'écran du vote.
 */
const treve: Evenement = {
  alias: "treve",
  titre: "Trêve",
  image: "🕊️",
  description: "Pas de minuteur aujourd'hui. Le village peut décider de n'éliminer personne.",
  explication: [
    "Pas de minuteur : le débat dure le temps qu'il faut.",
    "Le village a le droit de n'éliminer personne : le meneur choisit « Personne n'est éliminé » à l'écran du vote."
  ],
  minuteur: null
};

export default treve;
