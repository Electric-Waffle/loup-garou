import type { Role } from "../types";

// Le salvateur DONNE "protege". C'est la règle du tag "mordu" (dans recevoir.ts)
// qui regarde si le receveur est protégé : le loup n'a pas à le savoir.
const salvateur: Role = {
  alias: "salvateur",
  titre: "Salvateur",
  image: "🛡️",
  camp: "village",
  description: "Chaque nuit, il protège un joueur des loups. Jamais deux nuits de suite le même.",
  priorite: 100,
  appelNuit: true,

  decision(partie) {
    const hier = partie.joueursAvecTag("protege_hier").map(j => j.nom);
    return {
      message: hier.length
        ? `Le salvateur choisit qui protéger (impossible : ${hier.join(", ")}).`
        : "Le salvateur choisit qui protéger.",
      choix: [{ id: "proteger", label: "Protéger", cible: "un_joueur" }]
    };
  },

  agir: (choix) => ({
    donner: [{ tag: "protege", a: choix.cibles[0] }]
  })
};

export default salvateur;
