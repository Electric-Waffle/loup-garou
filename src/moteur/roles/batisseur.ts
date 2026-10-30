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
  description: "Chaque nuit, il renforce une maison. Quand toutes les maisons des villageois vivants sont renforcées, le village gagne.",
  priorite: 5,
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
