import type { Relique } from "../types";

/**
 * TEMPLE DIVIN : la relique par défaut. Aucun effet.
 * POURQUOI une relique « vide » plutôt que « pas de relique » : la partie a toujours exactement une
 * relique, donc le moteur n'a jamais à tester `if (partie.relique)`. Même idée qu'un objet nul.
 */
const templeDivin: Relique = {
  alias: "temple-divin",
  titre: "Temple Divin",
  image: "🛕",
  camp: "village",
  description: "Le temple veille sur le village, sans rien changer à la partie. C'est la relique par défaut.",
  explication: [
    "Aucun effet : la partie se joue avec les règles habituelles.",
    "C'est la relique choisie par défaut, quand l'oracle ne veut pas de modificateur."
  ]
};

export default templeDivin;
