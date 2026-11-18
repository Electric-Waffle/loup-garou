import type { Relique } from "../types";

/**
 * PYRAMIDE DE CHICHÉN ITZÁ : la relique par défaut. Aucun effet.
 * POURQUOI une relique « vide » plutôt que « pas de relique » : la partie a toujours exactement une
 * relique, donc le moteur n'a jamais à tester `if (partie.relique)`. Même idée qu'un objet nul.
 */
const templeDivin: Relique = {
  alias: "temple-divin",
  titre: "Pyramide de Chichén Itzá",
  image: "🛕",
  camp: "village",
  description: "La grande pyramide de Chichén Itzá veille sur le village, sans rien changer à la partie. C'est la relique par défaut.",
  explication: [
    "Aucun effet : la partie se joue avec les règles habituelles.",
    "C'est la relique choisie par défaut, quand l'oracle ne veut pas de modificateur."
  ]
};

export default templeDivin;
