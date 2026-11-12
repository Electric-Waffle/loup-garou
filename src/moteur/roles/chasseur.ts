import type { Role } from "../types";

// Le Chasseur ne bloque rien : il laisse sa mort se produire (règles générales,
// donc la chaîne des amoureux fonctionne), puis RÉAGIT en ouvrant une décision.
const chasseur: Role = {
  alias: "chasseur",
  titre: "Chasseur",
  image: "🏹",
  camp: "village",
  description: "Un chasseur encapuchonné des hauts plateaux, sa fronde toujours à la main. En mourant, il emporte immédiatement un joueur de son choix.",
  explication: [
    "Quand il meurt, quelle qu'en soit la cause (morsure, poison, vote, chagrin…), il tire tout de suite sur un joueur de son choix.",
    "Le meneur ouvre une décision urgente, jouée avant tout le reste : le joueur abattu meurt immédiatement.",
    "Sa mort a d'abord lieu normalement : si son amoureux meurt de chagrin, le Chasseur tire quand même.",
    "Enchanté par la Fée, maudit par la Pleureuse ou privé de pouvoir par l'Ancien, il meurt sans tirer."
  ],

  reagir(tag, _meta, partie, moi) {
    if (tag === "mort") partie.mettreEnAttente("chasseur", moi);
  },

  decision: (_partie, moi) => ({
    message: `${moi.nom}, le chasseur, meurt et emporte quelqu'un avec lui.`,
    choix: [
      { id: "tirer", label: "Tirer", cible: "un_autre" },
      { id: "rien", label: "Ne pas tirer", cible: "aucune" }
    ]
  }),

  agir: (choix) =>
    choix.id === "tirer"
      ? { donner: [{ tag: "mort", a: choix.cibles[0], meta: { cause: "chasseur" } }] }
      : {}
};

export default chasseur;
