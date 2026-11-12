import { appliquerResultat } from "../donner";
import type { Role } from "../types";

/**
 * ANCIEN : il survit à la première morsure ; s'il est éliminé par le VOTE du village, tous les
 * joueurs vivants hors du camp des loups perdent leurs pouvoirs jusqu'à la fin de la partie.
 *
 * Déroulé :
 *   1. recevoir() : la première mort par morsure devient "vie_perdue" (il survit).
 *   2. reagir() : sa mort par vote est acceptée (le chagrin des amoureux, l'or, etc. s'appliquent),
 *      puis il DONNE "impuissant" à chaque vivant dont le camp n'est pas "loups".
 *   3. Le MOTEUR fait le reste : "impuissant" est un tag bloquant (TAGS_BLOQUANTS, partie.ts),
 *      comme "enchante" ou "maudit", et il n'expire jamais.
 *
 * POURQUOI reagir() et pas recevoir() : la mort doit d'abord avoir lieu normalement. Un recevoir()
 * qui accepte lui-même court-circuiterait les règles générales (chagrin, or).
 * POURQUOI un tag par joueur plutôt qu'un état global « village sans pouvoir » : la règle « ne fait
 * pas son rôle » existe déjà pour les tags bloquants ; elle s'applique sans une ligne de plus.
 * ATTENTION : la liste est figée au moment du vote. Le Fou (camp "fou") et le Prêtre pur
 * (camp "village") la reçoivent aussi : seuls les loups gardent leurs pouvoirs.
 */
const ancien: Role = {
  alias: "ancien",
  titre: "Ancien",
  image: "👴",
  camp: "village",
  description: "Le doyen du village, gardien des cordelettes à nœuds où l'on compte les récoltes. Il survit à la première attaque des loups. S'il est éliminé par le vote du village, plus personne, à part les loups, ne peut utiliser son pouvoir jusqu'à la fin de la partie.",
  explication: [
    "Il a deux vies face aux loups : la première morsure qui devrait le tuer lui fait seulement perdre une vie.",
    "Les autres morts (poison, vote, chagrin, Chasseur) le tuent du premier coup.",
    "S'il est éliminé par le vote du village, c'est une catastrophe : tous les joueurs vivants qui ne sont pas du camp des loups perdent leur pouvoir jusqu'à la fin de la partie.",
    "Seuls les loups gardent leurs pouvoirs : le Fou et le Prêtre pur perdent aussi les leurs."
  ],

  recevoir(tag, meta, r, partie, moi) {
    if (tag === "mort" && meta.cause === "mordu" && !partie.aTag(moi, "vie_perdue")) {
      return r.transformer("vie_perdue");
    }
    // sinon : rien, on laisse les règles générales décider
  },

  reagir(tag, meta, partie, moi) {
    if (tag !== "mort" || meta.cause !== "vote") return;
    const nonLoups = partie.vivants().filter(joueur => partie.roleDe(joueur).camp !== "loups");
    const impuissances = nonLoups.map(joueur => ({ tag: "impuissant", a: joueur.id }));
    // POURQUOI appliquerResultat : reagir() ne renvoie rien, mais on garde le chemin commun (journal, recevoir).
    appliquerResultat(partie, { donner: impuissances }, moi.role);
  }
};

export default ancien;
