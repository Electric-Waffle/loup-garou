import type { OptionChoix, Role } from "../types";

/** Préfixe des options « sonder une carte hors jeu » : "carte:sorciere". */
const PREFIXE_CARTE = "carte:";

/**
 * LOUP VOYANTE : la Voyante, côté loups. Chaque nuit, elle découvre la carte d'un joueur
 * (ou une carte hors jeu du Loup savant), puis vote avec les loups.
 *
 * POURQUOI ce code copie voyante.ts sans le réutiliser : chaque carte reste indépendante.
 * Une correction de la logique « sonder » est donc à reporter dans les deux fichiers.
 * POURQUOI priorité 107 : APRÈS le Salvateur (100), pour que sa protection bloque la vision,
 * et avant le tour des loups (120), pour qu'elle sache avant de choisir la victime.
 * ATTENTION : un échec ne peut pas être silencieux (le meneur doit lui montrer quelque chose).
 * Elle apprend donc que sa cible est protégée cette nuit, et la meute peut s'en servir au vote des loups.
 */
const loupVoyante: Role = {
  alias: "loup-voyante",
  titre: "Loup voyante",
  image: "👁️",
  camp: "loups",
  description: "Un loup qui, chaque nuit, découvre la carte d'un joueur, comme la Voyante.",
  priorite: 107,
  appelNuit: true,
  rejoint: ["loup"],

  decision(partie, moi) {
    // Vide si le Loup savant n'est pas actif (partie.cartesDuSavant est alors []).
    const optionsCartes: OptionChoix[] = partie.cartesDuSavant.map(alias => ({
      id: PREFIXE_CARTE + alias,
      label: `Carte : ${partie.titre(alias)}`,
      cible: "aucune"
    }));
    return {
      message: `${partie.titre(moi.role)} désigne un joueur, ou une carte hors jeu, dont elle veut voir la carte.`,
      choix: [{ id: "sonder", label: "Sonder", cible: "un_autre" }, ...optionsCartes]
    };
  },

  agir(choix, partie, moi) {
    if (choix.id.startsWith(PREFIXE_CARTE)) {
      const alias = choix.id.slice(PREFIXE_CARTE.length);
      return { infos: [{ pour: moi.id, texte: `${partie.titre(alias)} n'a été distribuée à personne.` }] };
    }
    const cible = partie.joueur(choix.cibles[0]);
    if (partie.aTagDe(cible, "protege", "salvateur")) {
      return { infos: [{ pour: moi.id, texte: `La vision échoue : la carte de ${cible.nom} reste cachée.` }] };
    }
    return {
      infos: [{ pour: moi.id, texte: `${cible.nom} est ${partie.titre(cible.role)}.` }]
    };
  }
};

export default loupVoyante;
