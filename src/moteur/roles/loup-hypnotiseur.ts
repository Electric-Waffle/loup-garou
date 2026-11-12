import type { OptionChoix, Role } from "../types";

/**
 * LOUP HYPNOTISEUR : un loup avec deux médaillons à usage unique, comme les potions de la Sorcière.
 *
 * Déroulé :
 *   1. Chaque nuit, il choisit un médaillon encore intact (silence ou suggestion), ou aucun.
 *      Le médaillon utilisé est détruit (memoire), que l'effet réussisse ou non.
 *   2. Effet : il DONNE "silence" ou "dirige" à sa cible, avec son propre id en meta.par.
 *      Le tag dure jusqu'à l'aube SUIVANTE ("aube_suivante") : il couvre tous les votes du
 *      jour, y compris un second vote racheté avec l'or.
 *   3. Au vote, partie.rappelsDuVote() rappelle au meneur de ne pas compter le vote du silencé,
 *      et de faire voter le dirigé comme le Loup hypnotiseur. Rien n'est révélé pendant le débat.
 *   4. Cible protégée par le Salvateur : rien n'est donné, le médaillon est perdu quand même,
 *      et rien n'est annoncé (même règle que les autres loups bloqués par le Salvateur).
 *
 * POURQUOI vérifier la protection ici et pas dans recevoir.ts : le médaillon doit être détruit
 * même en cas d'échec, et c'est le rôle qui agit qui tient sa memoire.
 * POURQUOI priorité 115 : APRÈS le Salvateur (100), sinon sa protection n'existe pas encore,
 * et juste avant le tour des loups (120).
 */
const MEDAILLONS = {
  silence: { libelle: "Médaillon de silence", tag: "silence" },
  suggestion: { libelle: "Médaillon de suggestion", tag: "dirige" }
} as const;

type Medaillon = keyof typeof MEDAILLONS;

const loupHypnotiseur: Role = {
  alias: "loup-hypnotiseur",
  titre: "Loup hypnotiseur",
  image: "🌀",
  camp: "loups",
  description: "Un loup qui porte deux médaillons d'obsidienne à usage unique. Silence : le vote de la cible ne compte pas. Suggestion : la cible vote comme lui. Le Salvateur bloque l'effet, en silence.",
  explication: [
    "Un loup qui se réveille avec la meute et assiste au choix de la victime.",
    "Il a deux médaillons à usage unique, et peut en utiliser un par nuit (rang 115).",
    "Silence : le lendemain, le vote de sa cible ne compte pas. Suggestion : le lendemain, sa cible vote obligatoirement comme lui, sauf s'il est mort.",
    "L'effet dure jusqu'à l'aube suivante : il couvre aussi le second vote d'une plaidoirie. Le meneur le voit rappelé à l'écran du vote, jamais pendant le débat.",
    "Sur une cible protégée par le Salvateur, rien ne se passe et le médaillon est perdu quand même, sans annonce. La Caravane de lamas lui rend ses médaillons."
  ],
  priorite: 115,
  appelNuit: true,
  rejoint: ["loup"],

  init: () => ({ silence: true, suggestion: true }),

  // Marché noir (événement) : les deux médaillons reviennent (voir sorciere.ts).
  recevoir(tag, _meta, r, _partie, moi) {
    if (tag !== "recharge") return;
    moi.memoire.silence = true;
    moi.memoire.suggestion = true;
    return r.consommer("médaillons rechargés");
  },

  decision(partie, moi) {
    const choix: OptionChoix[] = [];
    for (const medaillon of Object.keys(MEDAILLONS) as Medaillon[]) {
      if (moi.memoire[medaillon]) {
        choix.push({ id: medaillon, label: MEDAILLONS[medaillon].libelle, cible: "un_autre" });
      }
    }
    if (choix.length === 0) {
      return { message: `${partie.titre(moi.role)} n'a plus de médaillon.`, choix: [] };
    }
    choix.push({ id: "rien", label: "Aucun médaillon", cible: "aucune" });
    return { message: `${partie.titre(moi.role)} choisit un médaillon, ou aucun.`, choix };
  },

  agir(choix, partie, moi) {
    if (choix.id !== "silence" && choix.id !== "suggestion") return {};

    const medaillon = MEDAILLONS[choix.id];
    moi.memoire[choix.id] = false; // détruit, même si l'effet échoue

    const cible = partie.joueur(choix.cibles[0]);
    if (partie.aTagDe(cible, "protege", "salvateur")) return {};

    return {
      donner: [{ tag: medaillon.tag, a: cible.id, meta: { par: moi.id, expire: "aube_suivante" } }]
    };
  }
};

export default loupHypnotiseur;
