import type { Role } from "../types";

/**
 * PRÊTRE PUR : un villageois qui choisit en secret, la première nuit, de rester pur ou de devenir
 * Prêtre impur.
 *
 * Déroulé :
 *   1. Nuit 1 : decision() propose « Pur » ou « Impur ». Impur, agir() DONNE "devient" : sa carte
 *      devient le Prêtre impur (pretre-impur.ts, camp "loups").
 *      Seuls le Prêtre et l'oracle (qui voit sa carte sur la table) connaissent ce choix.
 *   2. De son vivant : aucun pouvoir.
 *   3. Mort (et annoncé) : il garde les yeux fermés la nuit et ouverts le jour comme les vivants,
 *      ne vote plus, mais peut chuchoter au maire pendant le débat (rappel affiché par PartieVue).
 *      Pur, il cherche à aider le village ; impur, à le tromper. Personne ne sait lequel.
 *
 * PATTERN : carte qui en devient une autre (tag "devient"), comme le Rat → Rat-garou. Pur, il reste
 * cette carte, du camp du village. Impur, il EST un Prêtre impur, du camp des loups : victoire.ts le
 * compte et le fait gagner avec eux sans rien savoir des prêtres.
 * POURQUOI l'alias reste "pretre" : les réglages et distributions déjà enregistrés le connaissent.
 */
const pretre: Role = {
  alias: "pretre",
  titre: "Prêtre pur",
  image: "⛪",
  camp: "village",
  hybride: true,
  description: "Un prêtre du temple du Soleil. La 1re nuit, il choisit en secret d'être pur (il reste villageois) ou impur (il devient Prêtre impur, du camp des loups). Mort, il peut chuchoter au maire.",
  explication: [
    "La première nuit (rang 70), il choisit en secret d'être pur ou impur. Seuls lui et l'oracle le savent.",
    "Pur, ou s'il passe : il reste un villageois.",
    "Impur : sa carte devient Prêtre impur, du camp des loups, sans que les loups le sachent.",
    "De son vivant, il n'a aucun pouvoir.",
    "Mort, il continue de jouer comme un vivant : il garde les yeux ouverts le jour et les ferme la nuit. Il ne vote plus, mais pendant le débat il peut chuchoter au maire, pour l'aider.",
    "Carte hybride : à sa mort, l'oracle annonce « Prêtre », sans jamais révéler le camp que le joueur avait choisi."
  ],
  // POURQUOI 70 : n'importe quelle place convient (son choix n'affecte personne la nuit 1).
  // Juste après les liens (Loup amoureux 30, Cupidon 50, Réunion des amoureux 60) et avant la Voyante (80).
  priorite: 70,
  appelNuit: true,
  tours: { de: 1, a: 1 },

  decision: () => ({
    message: "Le prêtre choisit en secret sa foi : pur (il sert le village) ou impur (il sert les loups).",
    choix: [
      { id: "pur", label: "Pur", cible: "aucune" },
      { id: "impur", label: "Impur", cible: "aucune" }
    ]
  }),

  // Pur (ou « Passer ») : rien ne change, il reste un Prêtre pur, du village.
  agir(choix, _partie, moi) {
    if (choix.id === "impur") return { donner: [{ tag: "devient", a: moi.id, meta: { role: "pretre-impur" } }] };
  }
};

export default pretre;
