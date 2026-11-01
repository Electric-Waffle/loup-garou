import type { Role } from "../types";

/**
 * PRÊTRE : un villageois qui choisit en secret, la première nuit, s'il est pur ou impur.
 *
 * Déroulé :
 *   1. Nuit 1 : decision() propose « Pur » ou « Impur » → agir() lui DONNE le tag "pur" ou "impur".
 *      Seuls le Prêtre et le meneur (qui voit le tag sur la table) connaissent ce choix.
 *   2. De son vivant : aucun pouvoir.
 *   3. Mort (et annoncé) : il garde les yeux fermés la nuit et ouverts le jour comme les vivants,
 *      ne vote plus, mais peut chuchoter au maire pendant le débat (rappel affiché par PartieVue).
 *      Pur, il cherche à aider le village ; impur, à le tromper. Personne ne sait lequel.
 *   4. Victoire (victoire.ts) :
 *      - pour COMPTER les camps, il est toujours un villageois (camp: "village"), même impur :
 *        1 loup contre 2 villageois dont un prêtre impur, les loups n'ont pas encore gagné ;
 *      - pour savoir QUI GAGNE, le tag décide : impur, il gagne avec les loups et perd avec le village.
 *
 * POURQUOI un tag plutôt que joueur.memoire : victoire.ts doit lire le choix, et une règle
 * générale ne lit jamais la mémoire d'un rôle (elle est privée et non typée). Le tag, lui, est
 * visible par tout le moteur, apparaît au journal et sur la table du meneur.
 * POURQUOI garder camp: "village" et pas un camp "impur" : le camp sert à COMPTER (victoire.ts
 * filtre sur "village" et "loups"). Un camp à part ferait sortir le prêtre impur du décompte des
 * villageois, alors qu'il doit y rester.
 */
const pretre: Role = {
  alias: "pretre",
  titre: "Prêtre",
  image: "⛪",
  camp: "village",
  description: "La 1re nuit, il choisit en secret d'être pur (il gagne avec le village) ou impur (il gagne avec les loups, mais compte comme un villageois). Mort, il peut chuchoter au maire.",
  // POURQUOI 3 : n'importe quelle place convient (son choix n'affecte personne la nuit 1).
  // Juste après les liens (Cupidon 1, Loup succube 2) et avant la Voyante (5).
  priorite: 3,
  appelNuit: true,
  tours: { de: 1, a: 1 },

  decision: () => ({
    message: "Le prêtre choisit en secret sa foi : pur (il sert le village) ou impur (il sert les loups).",
    choix: [
      { id: "pur", label: "Pur", cible: "aucune" },
      { id: "impur", label: "Impur", cible: "aucune" }
    ]
  }),

  // ATTENTION : si le meneur clique « Passer », agir() n'est pas appelé et le prêtre ne reçoit
  // aucun tag. victoire.ts ne cherche que "impur" : sans tag, il est donc traité comme pur.
  agir(choix, _partie, moi) {
    const tag = choix.id === "impur" ? "impur" : "pur";
    return { donner: [{ tag: tag, a: moi.id }] };
  }
};

export default pretre;
