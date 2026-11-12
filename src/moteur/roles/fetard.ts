import type { Role } from "../types";

/**
 * FÊTARD : s'il a voté contre un loup que le village élimine, il fête ça toute la nuit
 * et les loups ne peuvent pas le mordre. Les loups ne le savent pas.
 *
 * Déroulé :
 *   1. apresVote() : si l'éliminé est du camp des loups, une décision URGENTE demande à l'oracle
 *      si le Fêtard a voté contre lui. POURQUOI une question : le moteur ne connaît que l'éliminé,
 *      pas qui a voté pour qui (les mains levées, seul l'oracle les a vues).
 *   2. « Oui » : il se DONNE "fete", qui expire à l'aube. Posé le jour, il couvre toute la nuit.
 *      « Non » : il n'a pas voté contre le loup, rien ne se passe.
 *   3. recevoir() : tant qu'il a "fete", la morsure est bloquée (la Sorcière ne le voit donc pas
 *      parmi les victimes, et les loups ne savent pas pourquoi il a survécu).
 *
 * POURQUOI un tag "fete" et pas "protege" : la règle de "protege" refuse une protection deux
 * nuits de suite (protege_hier). Le Fêtard protégé la veille par le Salvateur perdrait sa fête.
 * POURQUOI dans recevoir() du Fêtard et pas dans recevoir.ts : seul le Fêtard fait la fête,
 * la règle reste dans sa carte (comme l'Ancien et sa vie supplémentaire).
 */
const fetard: Role = {
  alias: "fetard",
  titre: "Fêtard",
  image: "🥳",
  camp: "village",
  description: "Un habitué des fêtes où coule la bière de maïs. S'il a voté contre un loup éliminé par le village, il fait la fête toute la nuit : les loups ne peuvent pas le mordre.",
  explication: [
    "Il n'a pas de pouvoir de nuit.",
    "Quand le village élimine un loup, l'oracle indique s'il a voté contre lui.",
    "Si oui, il fait la fête toute la nuit : les loups ne peuvent pas le mordre, car il n'est pas chez lui.",
    "Les loups ne savent pas pourquoi leur morsure a échoué. La fête ne dure qu'une nuit.",
    "La Pleureuse, le Fêtard, le Marchand et le Bâtisseur partagent la même carte : à sa mort, le village apprend seulement qu'un villageois est mort. Seuls le joueur et l'oracle savent lequel des quatre rôles c'était."
  ],

  apresVote(partie, moi, elimine) {
    if (!elimine || partie.roleDe(elimine).camp !== "loups") return;
    moi.memoire.loupElimine = elimine.id;
    partie.mettreEnAttente("fetard", moi);
  },

  decision(partie, moi) {
    const loup = partie.joueur(moi.memoire.loupElimine);
    return {
      message: `${loup.nom} était un loup. ${moi.nom}, le fêtard, a-t-il voté contre lui ?`,
      // ATTENTION : une décision urgente n'a pas de bouton « Passer » : le « non » est une option.
      choix: [
        { id: "feter", label: "Oui : il fait la fête cette nuit", cible: "aucune" },
        { id: "non", label: "Non", cible: "aucune" }
      ]
    };
  },

  agir(choix, _partie, moi) {
    if (choix.id !== "feter") return {};
    return { donner: [{ tag: "fete", a: moi.id, meta: { expire: "aube" } }] };
  },

  recevoir(tag, _meta, r, partie, moi) {
    if (tag === "mordu" && partie.aTag(moi, "fete")) {
      return r.bloquer("fait la fête toute la nuit, introuvable chez lui");
    }
  }
};

export default fetard;
