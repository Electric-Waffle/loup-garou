import type { Relique } from "../types";

/** Les deux réponses de la décision. */
const OUI = "larme";
const NON = "non";

/**
 * LARME DE LUNE [loups] : une fois par partie, juste après leur morsure, les loups peuvent se mettre
 * d'accord pour utiliser la larme. À l'aube, le village n'a ni débat ni vote : on retourne à la nuit.
 *
 * Déroulé :
 *   1. apresCarte() : quand les loups viennent de dévorer, la relique ouvre une décision URGENTE
 *      (comme le Chasseur ou le Rat), jouée avant la carte suivante ;
 *   2. decision() : « Utiliser la larme ? » ; il n'y a pas de « Passer » dans une décision urgente,
 *      d'où l'option « Non » ;
 *   3. agir() : « Oui » note la nuit dans partie.etatRelique.jourSaute et consomme la larme ;
 *   4. Partie.suiteDeLAube() lit ce numéro de nuit : après le rapport de l'aube, elle enchaîne la nuit
 *      suivante sans élection, événement, débat ni vote.
 *
 * POURQUOI après la morsure et pas à la place : les loups choisissent d'abord leur victime, puis
 * décident s'ils veulent en plus épargner au village un débat et un vote. La victime est donc
 * toujours dévorée.
 * POURQUOI seulement quand l'option « Dévorer » a été jouée : des loups blessés ou horrifiés n'ont
 * rien dévoré, et « passer » leur tour n'ouvre pas la décision.
 * ATTENTION : la question est reposée chaque nuit tant que la larme n'est pas utilisée.
 */
const larmeDeLune: Relique = {
  alias: "larme-de-lune",
  titre: "Larme d'Ixchel",
  image: "💧",
  camp: "loups",
  description: "Ixchel, déesse maya de la Lune, pleure pour les loups : une fois par partie, après leur morsure, ils peuvent faire tomber sa larme. Le lendemain, pas de vote : on retourne à la nuit.",
  explication: [
    "Chaque nuit, une fois les loups d'accord sur leur victime, l'oracle leur demande s'ils font tomber la larme d'Ixchel. Une seule fois dans la partie.",
    "S'ils le font, la victime est dévorée comme d'habitude, mais au matin le village apprend que la larme est tombée : il n'y a ni débat ni vote, et la nuit suivante commence aussitôt.",
    "Les autres événements de la nuit (poison, tir du Chasseur…) ont lieu normalement, et la victoire est vérifiée avant de sauter le jour.",
    "Bien utilisée, elle protège un loup démasqué du bûcher, ou gagne un jour de plus pour dévorer."
  ],

  apresCarte(partie, alias, choix) {
    return alias === "loup" && choix.id === "devorer" && !partie.etatRelique.larmeUtilisee;
  },

  decision() {
    return {
      message: "Les loups ont choisi leur victime. Se mettent-ils d'accord pour faire tomber la Larme d'Ixchel ?",
      choix: [
        { id: OUI, label: "Faire tomber la larme : pas de vote demain", cible: "aucune" },
        { id: NON, label: "Non", cible: "aucune" }
      ]
    };
  },

  agir(choix, partie) {
    if (choix.id !== OUI) return;
    partie.etatRelique.larmeUtilisee = true;
    partie.etatRelique.jourSaute = partie.tour;
    return {
      infos: [{ pour: "tous", texte: "Une larme d'Ixchel tombe sur le village : il n'y aura ni débat ni vote aujourd'hui." }]
    };
  }
};

export default larmeDeLune;
