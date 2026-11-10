import type { Role } from "../types";

/**
 * STRATÈGE : un villageois qui apprend, chaque nuit à partir de la 2e, si au moins un loup a voté
 * pour le même joueur que lui au vote du jour.
 *
 * Déroulé :
 *   1. Pendant le vote : rappelVote() affiche « regardez pour qui vote le stratège ».
 *   2. Après le vote : apresVote() ouvre une décision URGENTE, « Oui » ou « Non ». agir() range la
 *      réponse dans sa memoire, avec le numéro de la nuit où elle servira (tour + 1).
 *   3. La nuit : decision() (sans choix) dit au meneur quoi lui répondre.
 *
 * POURQUOI une question au meneur : le moteur ne connaît que l'éliminé, pas qui a voté pour qui
 * (comme le Fêtard). La poser tout de suite évite au meneur de s'en souvenir jusqu'à la nuit.
 * POURQUOI le numéro de nuit (comme le Loup barbare) : bloqué au vote (impuissant…), il n'est pas
 * questionné ; la réponse de la veille ne correspond plus à cette nuit et n'est pas redonnée.
 */
const stratege: Role = {
  alias: "stratege",
  titre: "Stratège",
  image: "♟️",
  camp: "village",
  description: "Chaque nuit à partir de la 2e, le meneur lui dit si au moins un loup a voté pour le même joueur que lui au vote du jour.",
  // POURQUOI 85 : son information ne dépend d'aucune carte de la nuit. Après la Voyante (80).
  priorite: 85,
  appelNuit: true,
  tours: { de: 2 },

  rappelVote: (_partie, moi) => `Regardez pour qui vote ${moi.nom} (stratège), et si un loup vote pour le même joueur.`,

  apresVote(partie, moi) {
    partie.mettreEnAttente("stratege", moi);
  },

  decision(partie, moi) {
    if (partie.phase === "nuit") {
      const reponse = moi.memoire.nuit === partie.tour ? moi.memoire.loupAvecLui : undefined;
      const texte = reponse === undefined
        ? "il n'a rien appris aujourd'hui."
        : reponse ? "répondez-lui OUI, un loup a voté comme lui." : "répondez-lui NON, aucun loup n'a voté comme lui.";
      return { message: `${moi.nom}, le stratège, se réveille : ${texte}`, choix: [] };
    }
    // ATTENTION : une décision urgente n'a pas de bouton « Passer » : le « non » est une option.
    return {
      message: `Un loup a-t-il voté pour le même joueur que ${moi.nom}, le stratège ?`,
      choix: [
        { id: "oui", label: "Oui", cible: "aucune" },
        { id: "non", label: "Non", cible: "aucune" }
      ]
    };
  },

  agir(choix, partie, moi) {
    moi.memoire.loupAvecLui = choix.id === "oui";
    moi.memoire.nuit = partie.tour + 1;
  }
};

export default stratege;
