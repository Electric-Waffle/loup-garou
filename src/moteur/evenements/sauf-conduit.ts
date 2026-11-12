import type { Evenement } from "../types";

/**
 * SAUF-CONDUIT : la personne désignée ne peut pas être éliminée au vote du jour.
 * FLUX : partie.voter() refuse cette cible, l'interface rend son siège non cliquable, et
 * rappelsDuVote() le rappelle. Le tag couvre aussi le second vote d'une plaidoirie (or).
 *
 * PATTERN : même contrat qu'un rôle. decision() décrit le choix, agir() renvoie ce qu'il DONNE ;
 * le maire tient la place de moi, donc la cible "un_autre" l'exclut (il ne se désigne jamais).
 */
const saufConduit: Evenement = {
  alias: "sauf-conduit",
  titre: "Sauf-conduit",
  image: "📜",
  description: "Le maire désigne une personne : elle ne pourra pas être éliminée par le vote d'aujourd'hui.",
  explication: [
    "Le maire désigne une personne, jamais lui-même.",
    "Elle ne peut pas être éliminée par le vote d'aujourd'hui : son siège n'est pas cliquable au vote.",
    "La protection couvre aussi le second vote d'une plaidoirie (or du Marchand).",
    "Elle disparaît à l'aube suivante."
  ],

  decision: (_partie, maire) => ({
    message: `${maire.nom}, le maire, désigne la personne qui ne pourra pas être éliminée aujourd'hui.`,
    choix: [{ id: "designer", label: "Désigner", cible: "un_autre" }]
  }),

  agir: (choix) => ({
    donner: [{ tag: "sauf_conduit", a: choix.cibles[0], meta: { expire: "aube" } }]
  })
};

export default saufConduit;
