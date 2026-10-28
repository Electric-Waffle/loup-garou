import type { Role } from "../types";

// Le Chasseur ne bloque rien : il laisse sa mort se produire (règles générales,
// donc la chaîne des amoureux fonctionne), puis RÉAGIT en ouvrant une décision.
const chasseur: Role = {
  alias: "chasseur",
  titre: "Chasseur",
  image: "🏹",
  camp: "village",
  description: "En mourant, il emporte immédiatement un joueur de son choix.",

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
