import type { Role } from "../types";

const DUREE_EN_SECONDES = 60;

/**
 * CONCILIABULE : une étape de la nuit, pas une carte qu'on distribue.
 *
 * Déroulé :
 *   1. Chaque nuit (priorité 12), tous les joueurs maudits vivants se réveillent, dès qu'il y en a un.
 *   2. Ils ont 60 secondes pour se concerter en silence, puis désignent un joueur, mort ou vivant.
 *   3. Bon choix (la carte du joueur désigné est la Pleureuse) : chaque maudit, mort ou vivant,
 *      reçoit "delivre" (recevoir.ts retire "maudit"), et la Pleureuse reçoit "apaisee".
 *      Mauvais choix : rien. Ils restent maudits, et la Pleureuse marquera quelqu'un d'autre.
 *
 * PATTERN : même étape à porteurs calculés que la Réunion des amoureux (champ porteurs, ETAPES).
 * POURQUOI les porteurs viennent des maudits et pas de la Pleureuse : le Conciliabule doit
 * continuer après sa mort, puisque personne ne sait que c'était elle.
 * POURQUOI la cible "n_importe_qui" : on peut accuser un mort (sa carte a été annoncée
 * « une villageoise », comme celle d'un Marchand ou d'un Bâtisseur).
 * ATTENTION : la malédiction ne bloque pas cette étape (partie.ts, decisionCourante), sinon des
 * porteurs tous maudits ne pourraient jamais voter. L'enchantement, lui, la bloque.
 */
const conciliabule: Role = {
  alias: "conciliabule",
  titre: "Conciliabule des maudits",
  image: "🕯️",
  // Jamais lu : aucun joueur n'a cette carte, victoire.ts ne la compte donc jamais.
  camp: "village",
  description: "Chaque nuit où au moins un joueur est maudit, les maudits se réunissent autour des braises pour tenter de démasquer la Pleureuse.",
  priorite: 12,
  appelNuit: true,

  porteurs: (partie) => partie.joueursAvecTag("maudit"),

  decision: () => ({
    message: "Les maudits se réveillent, se concertent en silence, puis désignent la Pleureuse (même morte).",
    choix: [{ id: "designer", label: "Désigner la Pleureuse", cible: "n_importe_qui" }],
    minuteur: DUREE_EN_SECONDES
  }),

  agir(choix, partie) {
    const designe = partie.joueur(choix.cibles[0]);
    const maudits = partie.joueurs.filter(j => partie.aTag(j, "maudit"));
    const vivantsMaudits = maudits.filter(j => j.vivant);

    if (designe.role !== "pleureuse") {
      return {
        infos: vivantsMaudits.map(j => ({ pour: j.id, texte: `${designe.nom} n'est pas la pleureuse : la malédiction continue.` }))
      };
    }

    // FLUX : "delivre" sur TOUS les maudits, morts compris, pour qu'il ne reste aucun tag
    // orphelin ; puis "apaisee" sur la Pleureuse, qui ne marquera plus personne.
    const delivrances = maudits.map(j => ({ tag: "delivre", a: j.id }));
    return {
      donner: [...delivrances, { tag: "apaisee", a: designe.id }],
      infos: vivantsMaudits.map(j => ({ pour: j.id, texte: `${designe.nom} était bien la pleureuse : la malédiction est levée.` }))
    };
  }
};

export default conciliabule;
