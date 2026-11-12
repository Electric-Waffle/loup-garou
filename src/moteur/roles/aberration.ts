import type { Role } from "../types";

/**
 * ABERRATION : un camp à elle seule. Chaque nuit, elle horrifie un joueur ; elle gagne quand
 * tous les autres survivants sont horrifiés. Tant qu'elle vit, personne d'autre ne gagne.
 *
 * Déroulé :
 *   1. Chaque nuit (priorité 25, avant le tour des loups), elle DONNE "horrifie" à un autre joueur.
 *      Le tag reste tant qu'elle est en vie.
 *   2. Les autres cartes lisent ce tag :
 *      - loup.ts : si tous ceux qui votent avec les loups sont horrifiés, ils ne mangent pas ;
 *      - partie.ts (voteImpossible) : si tous les villageois vivants sont horrifiés, pas de vote ;
 *      - voyante.ts et loup-voyante.ts : qui regarde sa carte devient "catatonique" (tag bloquant)
 *        et meurt à l'aube (aube.ts, CONSEQUENCES), comme le Rat "agonisant".
 *   3. victoire.ts : elle vivante, aucun autre camp ne gagne ; elle gagne quand tous les autres
 *      vivants sont horrifiés.
 *   4. reagir() : à sa mort, "horrifie" est retiré à tout le monde. Les loups remangent, le
 *      village revote. (Une voyante déjà catatonique, elle, meurt quand même à l'aube.)
 *
 * POURQUOI un camp "aberration" et pas "solo" : victoire.ts doit la reconnaître pour bloquer les
 * autres victoires, et "solo" pourrait un jour servir à un autre rôle.
 * POURQUOI priorité 25 : un loup horrifié cette nuit ne chasse déjà plus cette nuit (loups : 120).
 */
const aberration: Role = {
  alias: "aberration",
  titre: "Aberration",
  image: "🦑",
  camp: "aberration",
  description: "TERRIFI3 UN JOU4UR PAR NU1T. T0UT L0UP TERRIFIE5 NE M0RDENT P4S. TOUT VILLAGE0IS TERRIFIES NE VOTENT PAS. SONDE MA CARTE ET MEURT. SI TOUT LE MONDE TERRIFIE, JE GAGNE. SI JE MEURT, TERREUR DISPARAIT. Mais cela n'arrivera pas, n'est-ce pas ?",
  explication: [
    "Je forme un camp a moi tout seul.",
    "Chaque nuit (rang 25), j'horrifie un autre joueur.",
    "Si tous ceux qui chassent avec la meute de loup garous sont horrifiés, les loups ne mordent plus. Si tous ceux du camp des villageois sont horrifiés, le village ne peut plus voter.",
    "Si la Voyante ou le Loup voyante qui regardent ma carte... eh bien... je ne donne pas cher de leur peau. Vu comment se composent vos esprits, ils devraient devenir catatonique et mourir à l'aube.",
    "Tant que je vit, personne d'autre gagne.",
    "Si tout le monde est horrifié, je gagne. Et si je meurt, la terreur de tout les joueurs mourira avec moi."
  ],
  priorite: 25,
  appelNuit: true,

  decision(partie, moi) {
    const dejaHorrifies = partie.joueursAvecTag("horrifie").map(j => j.nom);
    const rappel = dejaHorrifies.length ? ` (déjà horrifiés : ${dejaHorrifies.join(", ")})` : "";
    return {
      message: `${partie.titre(moi.role)} choisit qui elle horrifie${rappel}.`,
      choix: [{ id: "horrifier", label: "Horrifier", cible: "un_autre" }]
    };
  },

  reagir(tag, _meta, partie) {
    if (tag !== "mort") return;
    // POURQUOI retirerTag avec une profondeur : l'opération est tracée au journal du meneur.
    for (const joueur of partie.joueurs.filter(j => partie.aTag(j, "horrifie"))) {
      partie.retirerTag(joueur, "horrifie", 1);
    }
  },

  // ATTENTION : aucun type de cible n'exclut les horrifiés. Choisir un joueur déjà horrifié ne
  // donne rien : la nuit est perdue pour elle.
  agir(choix, partie) {
    const cible = partie.joueur(choix.cibles[0]);
    if (partie.aTag(cible, "horrifie")) return {};
    return { donner: [{ tag: "horrifie", a: cible.id }] };
  }
};

export default aberration;
