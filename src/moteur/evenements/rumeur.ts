import type { Evenement } from "../types";

/** RUMEUR : une rumeur révèle à tous le camp d'un joueur tiré au hasard (à la validation). */
const rumeur: Evenement = {
  alias: "rumeur",
  titre: "Rumeur",
  image: "🗣️",
  description: "Une rumeur révèle à tous le camp d'un joueur tiré au hasard.",
  explication: [
    "Quand l'événement est validé, un joueur vivant est tiré au hasard, maire compris.",
    "Le meneur annonce à tous s'il est un loup-garou ou non.",
    "Seul le camp des loups compte : le Fou, le Skinwalker ou l'Aberration sont annoncés comme « pas un loup-garou »."
  ],
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
