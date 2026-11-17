import type { Evenement } from "../types";

/**
 * CONTAGION : la personne désignée meurt de la peste à la 2e aube. C'est le même tag « peste » que
 * celui du Rat, donc la même règle (voir aube.ts). Comme lui, aucune Sorcière ne peut la soigner.
 *
 * PATTERN : même contrat qu'un rôle. decision() décrit le choix, agir() renvoie ce qu'il DONNE ;
 * le maire tient la place de moi, donc la cible "un_autre" l'exclut (il ne se désigne jamais).
 */
const contagion: Evenement = {
  alias: "contagion",
  titre: "Souffle de Supay",
  image: "🦠",
  description: "Le maire désigne une personne : Supay lui souffle la peste, elle mourra à la 2e aube.",
  explication: [
    "Le maire désigne une personne, jamais lui-même.",
    "Supay lui souffle la peste : elle mourra à la 2e aube, c'est-à-dire après-demain matin.",
    "Comme la peste du Rat, aucune potion ne la soigne. Seul un Loup vampire, invulnérable, y survivrait."
  ],

  decision: (_partie, maire) => ({
    message: `${maire.nom}, le maire, désigne la personne qui attrape la peste.`,
    choix: [{ id: "designer", label: "Désigner", cible: "un_autre" }]
  }),

  agir: (choix) => ({
    donner: [{ tag: "peste", a: choix.cibles[0] }]
  })
};

export default contagion;
