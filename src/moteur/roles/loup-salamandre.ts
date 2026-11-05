import type { Role } from "../types";

/**
 * LOUP SALAMANDRE : chaque nuit, il rend un joueur ignifuge. Si le village le brûle le lendemain,
 * il entre dans les flammes et en ressort indemne. Le village apprend qu'un loup l'a protégé…
 * mais est-ce parce que c'est un loup, ou pour le faire croire ? Personne ne le sait.
 *
 * Déroulé :
 *   1. Chaque nuit, il DONNE "ignifuge" à un joueur (lui-même compris), qui expire "aube_suivante" :
 *      posé la nuit, il survit à l'aube et couvre tous les votes du jour.
 *   2. recevoir.ts (case "mort") : une mort par vote sur un joueur ignifuge est BLOQUÉE, mais APRÈS
 *      l'or : un joueur qui a de l'or rachète d'abord son vote (plaidoirie). C'est seulement au vote
 *      final, sur le bûcher, que la salamandre agit.
 *   3. partie.voter() l'annonce au village, et le jour compte comme « personne n'est éliminé »
 *      pour l'événement (l'Ultimatum tue alors le maire).
 *   4. Il vote avec les loups (rejoint: ["loup"]).
 *
 * POURQUOI la memoire pour « pas deux fois de suite » et pas un tag comme "protege_hier" : la règle
 * ne regarde que SA dernière protection. La memoire retient le joueur ET la nuit, donc une nuit
 * passée sans protéger personne libère le joueur de l'avant-veille.
 * POURQUOI priorité 108 : n'importe quel moment de la nuit convient (rien ne lit "ignifuge" avant
 * le vote) ; juste après les autres loups qui agissent seuls (102 à 107).
 */
const loupSalamandre: Role = {
  alias: "loup-salamandre",
  titre: "Loup salamandre",
  image: "🦎",
  camp: "loups",
  description: "Un loup qui, chaque nuit, rend un joueur ignifuge : si le village le brûle le lendemain, il ressort indemne des flammes, et tout le monde sait qu'un loup l'a protégé. Jamais deux nuits de suite le même.",
  priorite: 108,
  appelNuit: true,
  rejoint: ["loup"],

  init: () => ({ dernierProtege: null, nuitDeLaProtection: 0 }),

  decision(partie, moi) {
    const titre = partie.titre(moi.role);
    const interdit = protegeHier(partie.tour, moi.memoire);
    const rappel = interdit ? ` (impossible : ${partie.joueur(interdit).nom}, protégé la nuit dernière)` : "";
    return {
      message: `${titre} choisit qui résistera aux flammes demain${rappel}.`,
      choix: [{ id: "ignifuger", label: "Rendre ignifuge", cible: "un_joueur" }]
    };
  },

  // ATTENTION : aucun type de cible n'exclut le protégé d'hier. Si le meneur le choisit quand
  // même, rien n'est donné : la nuit est perdue (comme le Salvateur, dont la protection est bloquée).
  agir(choix, partie, moi) {
    const cible = choix.cibles[0];
    if (cible === protegeHier(partie.tour, moi.memoire)) return {};
    moi.memoire.dernierProtege = cible;
    moi.memoire.nuitDeLaProtection = partie.tour;
    return { donner: [{ tag: "ignifuge", a: cible, meta: { expire: "aube_suivante" } }] };
  }
};

/** Le joueur protégé la nuit précédente, ou undefined (nuit passée, ou première nuit). */
function protegeHier(tour: number, memoire: Record<string, any>): string | undefined {
  return memoire.nuitDeLaProtection === tour - 1 ? memoire.dernierProtege ?? undefined : undefined;
}

export default loupSalamandre;
