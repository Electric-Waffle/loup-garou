import type { Evenement } from "../types";

/** RUMEUR : une rumeur révèle à tous le camp d'un joueur tiré au hasard (à la validation). */
const rumeur: Evenement = {
  alias: "rumeur",
  titre: "Rumeur",
  image: "🗣️",
  description: "Une rumeur révèle à tous le camp d'un joueur tiré au hasard.",
  appliquer(partie) {
    const cible = partie.auHasard(partie.vivants());
    if (!cible) return {};
    const texte = partie.roleDe(cible).camp === "loups"
      ? `La rumeur dit que ${cible.nom} est un loup-garou.`
      : `La rumeur dit que ${cible.nom} n'est pas un loup-garou.`;
    return { infos: [{ pour: "tous", texte }] };
  }
};

export default rumeur;
