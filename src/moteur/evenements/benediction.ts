import type { Evenement } from "../types";

/**
 * BÉNÉDICTION : la personne désignée a l'effet COMPLET de la protection du Salvateur la nuit venue.
 * FLUX : le tag "benediction" est une demande. recevoir.ts (case "benediction") retire
 * "protege_hier" puis donne "protege" au nom du Salvateur : morsure bloquée, loups qui lient ou
 * regardent bloqués, et "protege_hier" posé à l'aube comme après une vraie protection.
 *
 * PATTERN : même contrat qu'un rôle. decision() décrit le choix, agir() renvoie ce qu'il DONNE ;
 * le maire tient la place de moi, donc la cible "un_autre" l'exclut (il ne se désigne jamais).
 */
const benediction: Evenement = {
  alias: "benediction",
  titre: "Bénédiction",
  image: "✨",
  description: "Le maire désigne une personne : elle a la protection du Salvateur la nuit venue.",

  decision: (_partie, maire) => ({
    message: `${maire.nom}, le maire, désigne la personne qui sera protégée cette nuit, comme par le Salvateur.`,
    choix: [{ id: "designer", label: "Désigner", cible: "un_autre" }]
  }),

  agir: (choix) => ({
    donner: [{ tag: "benediction", a: choix.cibles[0] }]
  })
};

export default benediction;
