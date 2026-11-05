import type { Evenement } from "../types";

/**
 * CONTAGION : la personne désignée meurt de la peste 3 aubes plus tard.
 * ATTENTION : "peste_active" et pas "peste" : la chaîne de l'aube (aube.ts) compte un cran par
 * aube, et "peste" tuerait à la 4e. Comme la morsure du Rat, aucune Sorcière ne peut la soigner.
 *
 * PATTERN : même contrat qu'un rôle. decision() décrit le choix, agir() renvoie ce qu'il DONNE ;
 * le maire tient la place de moi, donc la cible "un_autre" l'exclut (il ne se désigne jamais).
 */
const contagion: Evenement = {
  alias: "contagion",
  titre: "Contagion",
  image: "🦠",
  description: "Le maire désigne une personne : elle attrape la peste et mourra dans 3 jours.",

  decision: (_partie, maire) => ({
    message: `${maire.nom}, le maire, désigne la personne qui attrape la peste.`,
    choix: [{ id: "designer", label: "Désigner", cible: "un_autre" }]
  }),

  agir: (choix) => ({
    donner: [{ tag: "peste_active", a: choix.cibles[0] }]
  })
};

export default contagion;
