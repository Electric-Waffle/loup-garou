import type { Role } from "../types";

// Cupidon n'agit que la première nuit (tours: { de: 1, a: 1 }).
// Il DONNE "amoureux" aux deux joueurs, chacun avec le nom de son partenaire en métadonnée.
const cupidon: Role = {
  alias: "cupidon",
  titre: "Cupidon",
  image: "💘",
  camp: "village",
  description: "La première nuit, il lie deux joueurs. Si l'un meurt, l'autre meurt de chagrin.",
  priorite: 1,
  appelNuit: true,
  tours: { de: 1, a: 1 },

  decision: () => ({
    message: "Cupidon désigne deux amoureux.",
    choix: [{ id: "lier", label: "Lier", cible: "deux_joueurs" }]
  }),

  agir(choix, partie) {
    const [a, b] = choix.cibles;
    return {
      donner: [
        { tag: "amoureux", a, meta: { partenaire: b } },
        { tag: "amoureux", a: b, meta: { partenaire: a } }
      ],
      infos: [
        { pour: a, texte: `Tu es amoureux de ${partie.joueur(b).nom}.` },
        { pour: b, texte: `Tu es amoureux de ${partie.joueur(a).nom}.` }
      ]
    };
  }
};

export default cupidon;
