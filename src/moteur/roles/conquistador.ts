import type { Role } from "../types";

/**
 * CONQUISTADOR : un villageois avec une seule balle. Une nuit de son choix, il tue un joueur.
 * Si sa victime avait de l'or, il récupère sa balle.
 *
 * Déroulé :
 *   1. init() : une balle dans sa memoire.
 *   2. Chaque nuit (rang 122, après les loups), tant qu'il a sa balle : « Tirer » sur un autre joueur.
 *   3. agir() : regarde AVANT le tir si la victime porte de l'or, puis DONNE "mort" (cause
 *      "conquistador"). La balle est gardée seulement si la victime avait de l'or.
 *   4. La règle générale de l'or (recevoir.ts) fait le reste : l'or d'un mort passe à son tueur
 *      vivant, donc au Conquistador. Il peut ensuite racheter son propre vote avec.
 *
 * POURQUOI lire l'or avant de donner "mort" : après le tir, l'or a déjà changé de main.
 * POURQUOI "mort" et pas "mordu" : une balle n'est pas une morsure. Ni le Salvateur, ni la
 * Sorcière, ni la seconde vie de l'Ancien n'y peuvent rien ; seul l'invulnérable Loup vampire y
 * survit (la balle est perdue quand même).
 */
const conquistador: Role = {
  alias: "conquistador",
  titre: "Conquistador",
  image: "🔫",
  camp: "village",
  description: "Une seule fois dans la partie, il tue un joueur pendant la nuit. Si sa victime avait de l'or, il récupère sa balle.",
  explication: [
    "Il a une seule balle pour toute la partie.",
    "Chaque nuit (rang 122, après les loups), tant qu'il a sa balle, il peut tirer sur un joueur, ou attendre.",
    "Sa victime meurt aussitôt : ce n'est pas une morsure, donc ni le Salvateur, ni la Sorcière, ni la seconde vie de l'Ancien ne la sauvent. Seul le Loup vampire, invulnérable, y survit.",
    "Si sa victime avait de l'or, il récupère sa balle, et l'or lui revient : il pourra racheter son propre vote.",
    "Sans balle, il est appelé chaque nuit mais ne peut plus rien faire."
  ],
  priorite: 122,
  appelNuit: true,
  init: () => ({ balle: true }),

  decision(_partie, moi) {
    if (!moi.memoire.balle) {
      return { message: "Le conquistador n'a plus de balle.", choix: [] };
    }
    return {
      message: "Le conquistador peut tirer sa balle sur un joueur, ou attendre une autre nuit.",
      choix: [{ id: "tirer", label: "Tirer", cible: "un_autre" }]
    };
  },

  agir(choix, partie, moi) {
    const victime = partie.joueur(choix.cibles[0]);
    moi.memoire.balle = partie.aTag(victime, "or");
    return { donner: [{ tag: "mort", a: victime.id, meta: { cause: "conquistador" } }] };
  }
};

export default conquistador;
