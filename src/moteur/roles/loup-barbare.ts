import type { Role } from "../types";

/**
 * LOUP BARBARE : un loup solitaire. Il ne se réveille PAS avec la meute (pas de rejoint), donc les
 * autres loups ignorent qu'il est des leurs. Mais quand le village se trompe, il frappe.
 *
 * Déroulé :
 *   1. apresVote() : si le village vient d'éliminer un joueur hors du camp des loups, il retient
 *      dans sa memoire que la NUIT SUIVANTE (tour + 1) est une nuit de morsure.
 *   2. Cette nuit-là (priorité 124, après le vote des loups à 120, avant la Sorcière à 130),
 *      decision() propose « Mordre » ; les autres nuits, sa carte n'offre que « Passer ».
 *   3. agir() DONNE "mordu", comme le Loup-Garou : protection du Salvateur, fête du Fêtard,
 *      vie de l'Ancien et potion de la Sorcière s'appliquent sans une ligne de plus.
 *
 * POURQUOI un numéro de nuit plutôt qu'un simple « peutMordre = true » : il n'y a rien à remettre
 * à zéro. Si le meneur passe son tour, la nuit d'après le numéro ne correspond plus.
 * ATTENTION : il compte comme un loup pour la victoire (camp "loups"), même si la meute l'ignore.
 */
const loupBarbare: Role = {
  alias: "loup-barbare",
  titre: "Loup barbare",
  image: "🗡️",
  camp: "loups",
  description: "Un loup qui ne se réveille pas avec la meute. Si le village élimine un joueur qui n'est pas un loup, il peut mordre quelqu'un la nuit suivante, après les loups.",
  priorite: 124,
  appelNuit: true,

  apresVote(partie, moi, elimine) {
    if (partie.roleDe(elimine).camp === "loups") return;
    moi.memoire.nuitDeMorsure = partie.tour + 1;
  },

  decision(partie, moi) {
    const titre = partie.titre(moi.role);
    if (moi.memoire.nuitDeMorsure !== partie.tour) {
      return { message: `${titre} : le village n'a pas éliminé d'innocent hier, il reste caché.`, choix: [] };
    }
    return {
      message: `${titre} : le village s'est trompé hier, il choisit une victime.`,
      choix: [{ id: "mordre", label: "Mordre", cible: "un_autre" }]
    };
  },

  agir: (choix) => ({
    donner: [{ tag: "mordu", a: choix.cibles[0] }]
  })
};

export default loupBarbare;
