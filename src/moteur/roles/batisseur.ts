import type { Role } from "../types";

/**
 * BÂTISSEUR : chaque nuit, il renforce une maison (la sienne comprise).
 *
 * Il DONNE "renforce", un tag permanent. La victoire est vérifiée dans victoire.ts :
 * si toutes les maisons des villageois VIVANTS sont renforcées, le village gagne.
 *
 * CONCEPT : le rôle est relu à chaque vérification. Une maison renforcée d'un Rat devenu
 * rat-garou sort du compte toute seule ; renforcer un loup est une nuit perdue.
 */
const batisseur: Role = {
  alias: "batisseur",
  titre: "Bâtisseur",
  image: "🧱",
  camp: "village",
  description: "Un tailleur de pierre qui bâtit des murs sans mortier. Chaque nuit, il renforce une maison. Quand toutes les maisons des villageois vivants sont renforcées, le village gagne.",
  explication: [
    "Chaque nuit (rang 90), il renforce une maison, la sienne comprise. Une maison reste renforcée toute la partie.",
    "Quand toutes les maisons des villageois vivants sont renforcées, le village gagne aussitôt, même s'il reste des loups.",
    "Renforcer la maison d'un loup est une nuit perdue : elle ne compte pas.",
    "Si sa victoire et celle des loups arrivent en même temps, c'est la sienne qui l'emporte.",
    "La Pleureuse, le Fêtard, le Marchand et le Bâtisseur partagent la même carte : à sa mort, le village apprend seulement qu'un villageois est mort. Seuls le joueur et l'oracle savent lequel des quatre rôles c'était."
  ],
  priorite: 90,
  appelNuit: true,

  // "un_joueur" et pas "un_autre" : sans sa propre maison, la victoire serait impossible.
  decision: () => ({
    message: "Le bâtisseur choisit la maison qu'il renforce.",
    choix: [{ id: "renforcer", label: "Renforcer", cible: "un_joueur" }]
  }),

  agir: (choix) => ({
    donner: [{ tag: "renforce", a: choix.cibles[0] }]
  })
};

export default batisseur;
