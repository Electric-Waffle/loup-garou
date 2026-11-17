/* =====================================================================================
 *  finsDuJeu.ts — comment chacun gagne la partie, pour la page Explications (« Fin du jeu »)
 * =====================================================================================
 *
 *  Une fin par façon de gagner : le village, les loups, l'Aberration, le Skinwalker, le Fou,
 *  les amoureux et le Bâtisseur. Chacune dit COMMENT on gagne (`victoire`), puis donne des conseils.
 *
 *  POURQUOI des données et pas du JSX : même choix que casParticuliers.ts. La page n'a qu'une façon
 *  d'afficher une fin ; ajouter une fin, c'est ajouter un objet ici.
 *  PATTERN : source unique. Le Fou, l'Aberration, le Skinwalker et le Bâtisseur ont déjà un conseil
 *  sur leur carte (Role.conseil) : `conseilDeLaCarte` le reprend au lieu de le recopier. Corriger
 *  le conseil de la carte corrige aussi cette page.
 *  ATTENTION : ces textes décrivent victoire.ts. Si une condition de victoire change, la fin aussi.
 * ===================================================================================== */

import type { Camp } from "../moteur/types";

export interface FinDuJeu {
  titre: string;
  /** Alias de la carte dont on affiche l'image (celle choisie dans les options, s'il y en a une). */
  carte?: string;
  /** Image à défaut de carte (les amoureux n'en ont pas). */
  image?: string;
  /** Le badge : un camp du moteur, ou « amoureux », qui n'en est pas un. */
  camp: Camp | "amoureux";
  /** Comment on gagne, un paragraphe par ligne. */
  victoire: string[];
  /** Les conseils écrits ici… */
  conseils?: string[];
  /** … ou ceux de cette carte (Role.conseil), pour ne pas les écrire deux fois. */
  conseilDeLaCarte?: string;
}

export const FINS_DU_JEU: FinDuJeu[] = [
  {
    titre: "Le village",
    carte: "villageois",
    camp: "village",
    victoire: [
      "Le village gagne quand il ne reste plus aucun ennemi en vie : tous les loups, l'Aberration si elle est en jeu, et le Skinwalker s'il est en jeu.",
      "« Tous les loups », ce sont aussi ceux qui se cachent : le Prêtre impur, le Faux Parleur, le Rat-garou et le Loup barbare comptent comme des loups. Le Fou, lui, n'en est pas un : inutile de l'éliminer.",
      "Le Bâtisseur offre au village une autre façon de gagner (voir plus bas)."
    ],
    conseils: [
      "Si tous les loups semblent morts et que la partie continue, c'est qu'il reste l'Aberration… ou un loup qui se cache encore derrière une carte du village.",
      "Ne faites pas tomber le dernier loup tant que le Skinwalker est en vie : la victoire du village lui reviendrait, à lui seul."
    ]
  },
  {
    titre: "Les loups",
    carte: "loup",
    camp: "loups",
    victoire: [
      "Les loups gagnent dès qu'ils sont au moins aussi nombreux que tous les autres joueurs vivants.",
      "Tout le camp des loups compte, même ceux que la meute ne connaît pas (Prêtre impur, Loup barbare). Le Fou, lui, ne compte pas : il forme son propre camp."
    ],
    conseils: [
      "Si vous êtes assez nombreux mais que la partie continue, c'est qu'une Aberration est en vie : tant qu'elle vit, personne d'autre ne peut gagner.",
      "Ne prenez pas la majorité tant que le Fou est en vie : la victoire lui reviendrait, à lui seul, et vous perdriez tous. Il se réveille avec la meute : démasquez-le, et faites-le tomber d'abord."
    ]
  },
  {
    titre: "L'Aberration",
    carte: "aberration",
    camp: "aberration",
    victoire: [
      "L'Aberration gagne seule quand tous les autres joueurs encore en vie sont horrifiés (ou quand elle est la dernière survivante).",
      "Tant qu'elle est en vie, personne d'autre ne peut gagner : ni le village, ni les loups, ni personne."
    ],
    conseilDeLaCarte: "aberration"
  },
  {
    titre: "Le Skinwalker",
    carte: "skinwalker",
    camp: "skinwalker",
    victoire: [
      "Le Skinwalker vole la victoire du village : quand le village devrait gagner (plus aucun loup, ou toutes les maisons renforcées) et qu'il est encore en vie, c'est lui qui gagne, seul."
    ],
    conseilDeLaCarte: "skinwalker"
  },
  {
    titre: "Le Fou",
    carte: "fou",
    camp: "fou",
    victoire: [
      "Le Fou vole la victoire des loups : quand les loups devraient gagner et qu'il est encore en vie, c'est lui qui gagne, seul."
    ],
    conseilDeLaCarte: "fou"
  },
  {
    titre: "Les amoureux",
    image: "💘",
    camp: "amoureux",
    victoire: [
      "Tous les joueurs amoureux forment un camp à part, quels que soient leur carte et la personne qu'ils aiment (liés par Cupidon, par le Loup amoureux ou par le Loup succube). Ce camp gagne dès que les amoureux vivants sont strictement plus nombreux que les autres vivants.",
      "Pour s'organiser, les amoureux se retrouvent chaque nuit en secret pendant 60 secondes : ils se reconnaissent et complotent. Seul le Loup succube n'y est pas convié.",
      "Amoureux du même camp (tous loups, ou tous villageois) : rien ne change vraiment, ils gagnent avec leur camp.",
      "Amoureux de camps différents : leurs camps d'origine ne les feront jamais gagner ensemble. Leur seul espoir est d'unir leurs forces jusqu'à être en surnombre."
    ],
    conseils: [
      "À la Réunion des amoureux, regardez bien les cartes de chacun, et décidez ensemble d'une stratégie.",
      "Couvrez-vous les uns les autres grâce à vos rôles : au vote des loups comme à celui du village, détournez les voix de vos amoureux… sans jamais vous faire remarquer comme un groupe soudé."
    ]
  },
  {
    titre: "Le Bâtisseur",
    carte: "batisseur",
    camp: "village",
    victoire: [
      "Le village gagne aussi, avec le Bâtisseur, quand les maisons de tous les villageois encore en vie sont renforcées, même s'il reste des loups.",
      "Si cette victoire arrive en même temps que celle des loups, c'est le chantier qui l'emporte."
    ],
    conseilDeLaCarte: "batisseur"
  }
];
