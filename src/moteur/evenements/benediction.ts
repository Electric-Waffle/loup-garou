import type { Evenement } from "../types";

// shortcut : encore tirée au hasard, en attendant la version « le maire désigne » (étape 2).
const benediction: Evenement = {
  alias: "benediction",
  titre: "Bénédiction",
  image: "✨",
  description: "Un joueur tiré au hasard est protégé des loups la nuit suivante.",
  appliquer(partie) {
    const cible = partie.auHasard(partie.vivants());
    if (!cible) return {};
    return {
      donner: [{ tag: "protege", a: cible.id }],
      infos: [{ pour: "tous", texte: "Un villageois a reçu une bénédiction pour la nuit à venir." }]
    };
  }
};

export default benediction;
