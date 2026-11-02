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
 *      et une info PUBLIQUE l'annonce au rapport de l'aube.
 *
 * POURQUOI vérifier la protection ici et pas dans recevoir.ts : l'échec doit produire une
 * annonce publique, et seul le rôle qui agit renvoie des infos (agir → { donner, infos }).
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
  description: "Un loup avec deux médaillons à usage unique. Silence : le vote de la cible ne compte pas. Suggestion : la cible vote comme lui. Le Salvateur bloque l'effet, et c'est annoncé.",
  priorite: 115,
  appelNuit: true,
  rejoint: ["loup"],

  init: () => ({ silence: true, suggestion: true }),

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
    const protegeParLeSalvateur = cible.tags.some(t => t.type === "protege" && t.source === "salvateur");
    if (protegeParLeSalvateur) {
      const texte = `Le ${partie.titre("salvateur")} a empêché le ${partie.titre(moi.role)} d'utiliser le ${medaillon.libelle.toLowerCase()} sur ${cible.nom}.`;
      return { infos: [{ pour: "tous", texte }] };
    }

    return {
      donner: [{ tag: medaillon.tag, a: cible.id, meta: { par: moi.id, expire: "aube_suivante" } }]
    };
  }
};

export default loupHypnotiseur;
