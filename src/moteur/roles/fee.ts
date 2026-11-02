import type { Role } from "../types";

/**
 * FÉE : à partir de la nuit 2, elle enchante un joueur, qui ne fait rien de la nuit.
 *
 * Déroulé :
 *   1. Elle est appelée la première (priorité 10), avant toute carte qu'elle pourrait bloquer.
 *   2. Elle DONNE "enchante", qui expire à la toute fin de l'aube.
 *   3. Le MOTEUR fait le reste, pour tous les rôles :
 *      - decisionCourante() : une carte dont tous les porteurs sont enchantés n'offre que « Passer » ;
 *      - mettreEnAttente() : aucune décision urgente (Chasseur, Rat) pour un joueur enchanté.
 *
 * POURQUOI l'expiration à la FIN de l'aube : un Chasseur enchanté tué cette nuit-là meurt à l'aube ;
 * il doit encore être enchanté à ce moment pour ne pas pouvoir tirer.
 */
const fee: Role = {
  alias: "fee",
  titre: "Fée",
  image: "🧚",
  camp: "village",
  description: "À partir de la 2e nuit, elle enchante un joueur : il ne peut rien faire de la nuit.",
  priorite: 10,
  appelNuit: true,
  tours: { de: 2 },

  decision: () => ({
    message: "La fée choisit le joueur qu'elle enchante.",
    choix: [{ id: "enchanter", label: "Enchanter", cible: "un_autre" }]
  }),

  agir: (choix) => ({
    donner: [{ tag: "enchante", a: choix.cibles[0], meta: { expire: "aube" } }]
  })
};

export default fee;
