import type { Relique } from "../types";

/**
 * TOISON D'OR [loups] : les loups sont immortels, jusqu'à ce que le village en élimine un par le vote.
 *
 * Déroulé :
 *   1. recevoir() : toute mort sur un joueur du camp des loups est BLOQUÉE… sauf le vote du village ;
 *   2. reagir() : dès qu'un loup meurt par le vote, la toison est brisée (état dans partie.etatRelique) :
 *      plus rien n'est bloqué, pour aucun loup.
 *
 * POURQUOI le même principe que l'invulnérabilité du Loup vampire (liste blanche : « seul le vote
 * passe ») : toute FUTURE cause de mort est bloquée d'office, sans la lister.
 * POURQUOI le vote passe : c'est justement lui qui brise la toison. Le premier loup voté meurt.
 * ATTENTION : « les loups » = le camp des loups, donc aussi Prêtre impur, Faux Parleur, Rat-garou.
 */
const toisonDOr: Relique = {
  alias: "toison-d-or",
  titre: "Toison d'or",
  image: "🐏",
  camp: "loups",
  description: "Les loups sont immortels jusqu'à ce que le village en élimine un par le vote.",
  explication: [
    "Tant que le village n'a éliminé aucun loup par le vote, aucun loup ne peut mourir : ni la potion de la Sorcière, ni le Chasseur, ni le Conquistador, ni le chagrin, ni la peste.",
    "Le vote du village, lui, passe : le premier loup qu'il élimine meurt, et la toison est brisée.",
    "À partir de là, les loups sont mortels comme tout le monde.",
    "« Les loups » comprend les loups cachés : Prêtre impur, Faux Parleur, Rat-garou, Loup barbare."
  ],

  recevoir(tag, meta, r, partie, joueur) {
    if (tag !== "mort" || partie.etatRelique.toisonBrisee) return;
    if (partie.roleDe(joueur).camp !== "loups") return;
    if (meta.cause === "vote") return;
    return r.bloquer("toison d'or : les loups sont immortels tant que le village n'en a pas voté un");
  },

  reagir(tag, meta, partie, joueur) {
    if (tag !== "mort" || meta.cause !== "vote") return;
    if (partie.roleDe(joueur).camp !== "loups") return;
    partie.etatRelique.toisonBrisee = true;
    partie.ajouterInfo({ pour: "tous", texte: "Un loup est tombé : la toison d'or est brisée, les loups sont mortels." });
  }
};

export default toisonDOr;
