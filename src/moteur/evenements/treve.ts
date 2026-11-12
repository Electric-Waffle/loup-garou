import type { Evenement } from "../types";

/**
 * TRÊVE : pas de minuteur aujourd'hui (minuteur: null), et le village peut ne tuer personne.
 * POURQUOI rien d'autre : « Personne n'est éliminé » existe déjà à l'écran du vote.
 */
const treve: Evenement = {
  alias: "treve",
  titre: "Paix de Pachamama",
  image: "🕊️",
  description: "Pachamama, la Terre Mère, apaise les esprits : pas de minuteur aujourd'hui, et le village peut décider de n'éliminer personne.",
  explication: [
    "Pas de minuteur : le débat dure le temps qu'il faut.",
    "Le village a le droit de n'éliminer personne : l'oracle choisit « Personne n'est éliminé » à l'écran du vote."
  ],
  minuteur: null
};

export default treve;
