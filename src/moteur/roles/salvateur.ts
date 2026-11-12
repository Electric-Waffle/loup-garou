import type { Role } from "../types";

// Le salvateur DONNE "protege". C'est la règle du tag "mordu" (dans recevoir.ts)
// qui regarde si le receveur est protégé : le loup n'a pas à le savoir.
const salvateur: Role = {
  alias: "salvateur",
  titre: "Salvateur",
  image: "🛡️",
  camp: "village",
  description: "Chaque nuit, il protège un joueur des loups. Jamais deux nuits de suite le même.",
  explication: [
    "Chaque nuit (rang 100), il choisit un joueur à protéger, lui-même compris.",
    "Le joueur protégé ne peut pas être mordu cette nuit : la morsure est bloquée, et la Sorcière ne voit aucune victime.",
    "La protection fait aussi échouer les loups qui agissent seuls (lien du Loup amoureux ou du Loup succube, vision du Loup voyante, médaillon du Loup hypnotiseur) et le meurtre du Skinwalker.",
    "Il ne peut jamais protéger la même personne deux nuits de suite.",
    "Elle ne protège ni du poison de la Sorcière, ni du tir du Chasseur, ni de la peste."
  ],
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
