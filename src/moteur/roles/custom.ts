import type { Role } from "../types";

// Le Chasseur ne bloque rien : il laisse sa mort se produire (règles générales,
// donc la chaîne des amoureux fonctionne), puis RÉAGIT en ouvrant une décision.
const custom: Role = {
  alias: "custom",
  titre: "Custom",
  image: "🃏",
  camp: "village",
  description: "Chaque nuit, il désigne une personne A et fait son role sur une personne B, sans connaitre le role copié.",

  decision: (_partie, moi) => ({
    message: `${moi.nom}, va copier le role de quelqu'un.`,
    choix: [ 
      { id: "copier", label: "Copier", cible: "un_autre" },
      { id: "rien", label: "Ne pas tirer", cible: "aucune" }
    ]
  }),

  agir: (choix) =>
  {
    if (choix.id === "copier") {
      { donner: [{ tag: "mort", a: choix.cibles[0], meta: { cause: "chasseur" } }] }
    }
  }
    
};

export default custom;
