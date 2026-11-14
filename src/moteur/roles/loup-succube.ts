import type { Partie } from "../partie";
import type { Joueur, Role } from "../types";

/**
 * LOUP SUCCUBE : un loup qui se lie à un compagnon, à sens unique.
 *
 * Déroulé :
 *   1. Chaque nuit où il n'a pas de compagnon vivant (la nuit 1, puis après la mort du compagnon),
 *      decision() propose « Se lier » → agir() DONNE :
 *        - à lui-même : "amoureux" avec le compagnon dans meta.partenaires ;
 *        - au compagnon : "amoureux" SANS partenaire.
 *      Les autres nuits, sa carte n'offre que « Passer ».
 *   2. Le chagrin (recevoir.ts, case "mort") suit les partenaires du MOURANT :
 *      le Succube meurt → son compagnon meurt ; le compagnon meurt → personne ne le suit.
 *   3. Chaque nuit : il se réveille avec les loups et vote avec eux (rejoint: ["loup"]).
 *   4. Il ne vient pas à la Réunion des amoureux : son compagnon, si.
 *   5. Cible protégée par le Salvateur : le lien échoue, sans annonce. Le Succube reste sans
 *      compagnon jusqu'à la nuit suivante, où sa carte lui propose de nouveau « Se lier ».
 *
 * PATTERN : un tag existant, une règle existante, un sens unique obtenu par une meta absente.
 * POURQUOI le compagnon en memoire et pas lu dans le tag : en réseau, le tag "amoureux" du
 * Succube peut aussi contenir un partenaire donné par Cupidon. Seule la memoire sait lequel
 * est SON compagnon, celui dont la mort lui permet d'en choisir un autre.
 */
const loupSuccube: Role = {
  alias: "loup-succube",
  titre: "Loup succube",
  image: "💋",
  camp: "loups",
  description: "Un loup qui envoûte un compagnon. S'il meurt, son compagnon meurt aussi ; si le compagnon meurt, il en choisit un autre la nuit suivante.",
  explication: [
    "Un loup qui se réveille avec la meute et assiste au choix de la victime.",
    "À son tour (rang 105), s'il n'a pas de compagnon vivant, il s'en choisit un.",
    "Le lien est à sens unique : si le Succube meurt, son compagnon meurt avec lui ; si le compagnon meurt, le Succube survit et en choisit un autre la nuit suivante.",
    "Le compagnon vient à la Réunion des amoureux à partir de la nuit suivante ; le Succube, jamais.",
    "Il joue après le Salvateur : un compagnon protégé fait échouer le lien, et il reste seul jusqu'à la nuit suivante."
  ],
  // POURQUOI 105 : APRÈS le Salvateur (100), sinon sa protection n'existe pas encore quand le
  // Succube se lie. Prix : la Réunion des amoureux (60) est déjà passée, un nouveau compagnon
  // n'y vient qu'à partir de la nuit suivante.
  priorite: 105,
  appelNuit: true,
  rejoint: ["loup"],

  init: () => ({ compagnon: null }),

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

    // POURQUOI ici et pas dans reagir() : reagir() n'est appelé que sur le joueur qui REÇOIT
    // un tag. Celui qui agit ne vérifie qu'ici, avant de donner quoi que ce soit (comme le
    // Loup hypnotiseur). La memoire n'est pas touchée : decision() le reverra sans compagnon.
    if (partie.aTagDe(compagnon, "protege", "salvateur")) return {};

    moi.memoire.compagnon = compagnon.id;

    return {
      donner: [
        { tag: "amoureux", a: moi.id, meta: { partenaires: [compagnon.id] } },
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
  const id = moi.memoire.compagnon;
  if (typeof id !== "string") return undefined;
  const compagnon = partie.joueur(id);
  return compagnon.vivant ? compagnon : undefined;
}

export default loupSuccube;
