import type { Evenement } from "../types";

/**
 * CLAIR DE LUNE : cette nuit, la Voyante et le Loup voyante ne peuvent voir que la carte de la personne désignée.
 * Ce sont ces deux cartes qui lisent le tag "eclaire" (posé le jour, il couvre la nuit).
 * Sans voyante en jeu, l'événement tombe à plat : le meneur fait semblant, c'est voulu.
 *
 * PATTERN : même contrat qu'un rôle. decision() décrit le choix, agir() renvoie ce qu'il DONNE ;
 * le maire tient la place de moi, donc la cible "un_autre" l'exclut (il ne se désigne jamais).
 */
const clairDeLune: Evenement = {
  alias: "clair-de-lune",
  titre: "Lumière de Mama Killa",
  image: "🌕",
  description: "Le maire désigne une personne : cette nuit, Mama Killa, la Lune, n'éclaire qu'elle. La Voyante et le Loup voyante ne pourront voir que sa carte.",
  explication: [
    "Le maire désigne une personne, jamais lui-même.",
    "Cette nuit, Mama Killa n'éclaire qu'elle : la Voyante et le Loup voyante ne peuvent regarder que sa carte.",
    "Si c'est le Hurleur, le regard le fait hurler, sans révéler son nom.",
    "Sans voyante en jeu, l'événement tombe à plat : le meneur fait semblant."
  ],

  decision: (_partie, maire) => ({
    message: `${maire.nom}, le maire, désigne la personne que Mama Killa éclaire cette nuit.`,
    choix: [{ id: "designer", label: "Désigner", cible: "un_autre" }]
  }),

  agir: (choix) => ({
    donner: [{ tag: "eclaire", a: choix.cibles[0], meta: { expire: "aube" } }]
  })
};

export default clairDeLune;
