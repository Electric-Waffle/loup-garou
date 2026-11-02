import type { Partie } from "../partie";
import type { Joueur, Role } from "../types";

/**
 * LOUP SUCCUBE : un loup qui se lie à un compagnon, à sens unique.
 *
 * Déroulé :
 *   1. Chaque nuit où il n'a pas de compagnon vivant (la nuit 1, puis après la mort du compagnon),
 *      decision() propose « Se lier » → agir() DONNE :
 *        - à lui-même : "amoureux" avec meta.partenaire = le compagnon ;
 *        - au compagnon : "amoureux" SANS partenaire.
 *      Les autres nuits, sa carte n'offre que « Passer ».
 *   2. Le chagrin (recevoir.ts, case "mort") suit le partenaire du MOURANT :
 *      le Succube meurt → son compagnon meurt ; le compagnon meurt → personne ne le suit.
 *   3. Chaque nuit : il se réveille avec les loups et vote avec eux (rejoint: ["loup"]).
 *
 * PATTERN : un tag existant, une règle existante, un sens unique obtenu par une meta absente.
 * POURQUOI priorité 0.5 : après le Loup amoureux (0), avant Cupidon (1). Son lien de la nuit 1
 * passe donc lui aussi avant celui de Cupidon.
 * ATTENTION : un compagnon déjà amoureux fait échouer le lien, sans rien dire au Succube.
 * Il le comprendra la nuit suivante, quand le meneur le réveillera de nouveau pour choisir.
 */
const loupSuccube: Role = {
  alias: "loup-succube",
  titre: "Loup succube",
  image: "💋",
  camp: "loups",
  description: "Un loup qui se lie à un compagnon. S'il meurt, son compagnon meurt aussi ; si le compagnon meurt, il en choisit un autre la nuit suivante.",
  priorite: 0.5,
  appelNuit: true,
  rejoint: ["loup"],

  decision(partie, moi) {
    const titre = partie.titre(moi.role);
    if (compagnonVivant(partie, moi)) {
      return { message: `${titre} a déjà un compagnon vivant.`, choix: [] };
    }
    return {
      message: `${titre} choisit son compagnon.`,
      choix: [{ id: "lier", label: "Se lier", cible: "un_autre" }]
    };
  },

  agir(choix, partie, moi) {
    const compagnon = partie.joueur(choix.cibles[0]);
    if (partie.aTag(compagnon, "amoureux")) return;

    return {
      donner: [
        { tag: "amoureux", a: moi.id, meta: { partenaire: compagnon.id } },
        { tag: "amoureux", a: compagnon.id }
      ],
      infos: [
        { pour: compagnon.id, texte: `Tu es lié à ${moi.nom}, le ${partie.titre(moi.role)} : s'il meurt, tu meurs aussi.` }
      ]
    };
  }
};

/** Le compagnon actuel, s'il est encore en vie. */
function compagnonVivant(partie: Partie, moi: Joueur): Joueur | undefined {
  const compagnon = partie.partenaireDe(moi);
  return compagnon?.vivant ? compagnon : undefined;
}

export default loupSuccube;
