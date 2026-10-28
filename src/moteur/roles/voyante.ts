import type { Role } from "../types";

// La voyante REGARDE : elle ne donne aucun tag, elle produit une info privée.
const voyante: Role = {
  alias: "voyante",
  titre: "Voyante",
  image: "🔮",
  camp: "village",
  description: "Chaque nuit, elle découvre la carte d'un joueur.",
  priorite: 5,
  appelNuit: true,

  decision: () => ({
    message: "La voyante désigne un joueur dont elle veut voir la carte.",
    choix: [{ id: "sonder", label: "Sonder", cible: "un_autre" }]
  }),

  agir(choix, partie, moi) {
    const cible = partie.joueur(choix.cibles[0]);
    return {
      infos: [{ pour: moi.id, texte: `${cible.nom} est ${partie.titre(cible.role)}.` }]
    };
  }
};

export default voyante;
