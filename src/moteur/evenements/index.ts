import type { Evenement } from "../types";

/**
 * Les événements utilisent le même chemin que les rôles :
 * ils renvoient { donner, infos }, qui passent par donnerTag() et le journal.
 */

const calme: Evenement = {
  alias: "calme",
  titre: "Journée calme",
  image: "☀️",
  description: "Rien de particulier ne se passe.",
  appliquer: () => ({})
};

const rumeur: Evenement = {
  alias: "rumeur",
  titre: "Rumeur",
  image: "🗣️",
  description: "Une rumeur révèle à tous le camp d'un joueur tiré au hasard.",
  appliquer(partie) {
    const cible = partie.auHasard(partie.vivants());
    if (!cible) return {};
    const texte = partie.roleDe(cible).camp === "loups"
      ? `La rumeur dit que ${cible.nom} est un loup-garou.`
      : `La rumeur dit que ${cible.nom} n'est pas un loup-garou.`;
    return { infos: [{ pour: "tous", texte }] };
  }
};

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

export const LISTE_EVENEMENTS: Evenement[] = [calme, rumeur, benediction];
export const EVENEMENTS: Record<string, Evenement> = Object.fromEntries(LISTE_EVENEMENTS.map(e => [e.alias, e]));
