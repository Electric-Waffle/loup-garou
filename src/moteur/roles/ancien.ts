import { appliquerResultat } from "../donner";
import type { Partie } from "../partie";
import type { Joueur, Role } from "../types";

/**
 * ANCIEN : il survit à la première morsure ; s'il est éliminé par le VOTE du village, les villageois
 * et toutes les cartes hybrides perdent leurs pouvoirs jusqu'à la fin de la partie.
 *
 * Déroulé :
 *   1. recevoir() : la première mort par morsure devient "vie_perdue" (il survit).
 *   2. reagir() : sa mort par vote est acceptée (le chagrin des amoureux, l'or, etc. s'appliquent),
 *      puis il DONNE "impuissant" à ceux que perdLeurPouvoir() désigne.
 *   3. Le MOTEUR fait le reste : "impuissant" est un tag bloquant (TAGS_BLOQUANTS, partie.ts),
 *      comme "enchante" ou "maudit", et il n'expire jamais.
 *
 * POURQUOI reagir() et pas recevoir() : la mort doit d'abord avoir lieu normalement. Un recevoir()
 * qui accepte lui-même court-circuiterait les règles générales (chagrin, or).
 * POURQUOI un tag par joueur plutôt qu'un état global « village sans pouvoir » : la règle « ne fait
 * pas son rôle » existe déjà pour les tags bloquants ; elle s'applique sans une ligne de plus.
 */

/**
 * Qui perd son pouvoir quand l'Ancien est éliminé par le village :
 *   - les vivants du camp village ;
 *   - toutes les cartes hybrides, QUEL QUE SOIT le camp choisi, et même mortes (un Prêtre mort
 *     ne peut plus chuchoter au maire).
 * POURQUOI les hybrides côté loups aussi : une carte hybride compte comme villageoise. Si un Faux
 * Parleur relançait encore le vote, ou si un Prêtre continuait de chuchoter, tout le monde
 * comprendrait qu'il a changé de camp. Bloqués comme les villageois, ils ne trahissent rien.
 * Le Fou, l'Aberration et le Skinwalker ne sont pas villageois : ils gardent leurs pouvoirs, comme
 * les loups. ATTENTION : la liste est figée au moment du vote.
 */
export function perdLeurPouvoir(partie: Partie): Joueur[] {
  return partie.joueurs.filter(joueur => {
    const role = partie.roleDe(joueur);
    return role.hybride || (joueur.vivant && role.camp === "village");
  });
}

const ancien: Role = {
  alias: "ancien",
  titre: "Ancien",
  image: "👴",
  camp: "village",
  description: "Le doyen du village, gardien des cordelettes à nœuds où l'on compte les récoltes. Il survit à la première attaque des loups. S'il est éliminé par le vote du village, les villageois et les cartes hybrides perdent leur pouvoir jusqu'à la fin de la partie.",
  explication: [
    "Il a deux vies face aux loups : la première morsure qui devrait le tuer lui fait seulement perdre une vie.",
    "Les autres morts (poison, vote, chagrin, Chasseur) le tuent du premier coup.",
    "S'il est éliminé par le vote du village, c'est une catastrophe : tous les villageois vivants perdent leur pouvoir jusqu'à la fin de la partie.",
    "Tous leurs pouvoirs, y compris ceux qui se déclenchent à leur mort ou quand on les vise : le Chasseur ne tire plus, le Stratège n'enquête plus, le Hurleur ne hurle plus, le Paysan dévoré ne blesse plus les loups.",
    "Les cartes hybrides le perdent aussi, quel que soit le camp choisi : le Rat ne peut plus mordre, rejoindre la meute ni répandre la peste, le Prêtre (pur ou impur, même mort) ne peut plus chuchoter au maire, le Beau ou le Faux Parleur perd sa relance et sa seconde vie. Sinon, une carte hybride qui agirait encore trahirait qu'elle est passée du côté des loups.",
    "Les loups, le Fou, l'Aberration et le Skinwalker gardent leurs pouvoirs : ils ne sont pas villageois."
  ],

  recevoir(tag, meta, r, partie, moi) {
    if (tag === "mort" && meta.cause === "mordu" && !partie.aTag(moi, "vie_perdue")) {
      return r.transformer("vie_perdue");
    }
    // sinon : rien, on laisse les règles générales décider
  },

  reagir(tag, meta, partie, moi) {
    if (tag !== "mort" || meta.cause !== "vote") return;
    const impuissances = perdLeurPouvoir(partie).map(joueur => ({ tag: "impuissant", a: joueur.id }));
    // POURQUOI appliquerResultat : reagir() ne renvoie rien, mais on garde le chemin commun (journal, recevoir).
    appliquerResultat(partie, { donner: impuissances }, moi.role);
  }
};

export default ancien;
