import type { OptionChoix, Role } from "../types";

/** Préfixe des options « sonder une carte hors jeu » : "carte:sorciere". */
const PREFIXE_CARTE = "carte:";

/** Option unique d'une nuit de Clair de lune : la cible est le joueur qui porte "eclaire". */
const OPTION_ECLAIRE = "sonder-eclaire";

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
  explication: [
    "Un loup qui se réveille avec la meute et assiste au choix de la victime.",
    "En plus, à son propre tour (rang 107), il regarde la carte d'un joueur comme la Voyante, ou une des cartes non distribuées connues du Loup savant.",
    "Il joue après le Salvateur : si sa cible est protégée, la vision échoue (« la carte reste cachée »). Il apprend donc que ce joueur est protégé.",
    "Clair de lune : il ne peut voir que le joueur éclairé. Face à un Skinwalker déguisé, il voit la carte volée.",
    "Comme la Voyante, s'il regarde la carte de l'Aberration, il devient catatonique et meurt à l'aube."
  ],
  priorite: 107,
  appelNuit: true,
  rejoint: ["loup"],

  decision(partie, moi) {
    // Clair de lune (événement) : une seule carte visible cette nuit, celle du joueur éclairé.
    const eclaire = partie.joueursAvecTag("eclaire")[0];
    if (eclaire) {
      return {
        message: `Le clair de lune éclaire ${eclaire.nom} : ${partie.titre(moi.role)} ne peut voir que sa carte.`,
        choix: [{ id: OPTION_ECLAIRE, label: `Sonder ${eclaire.nom}`, cible: "aucune", cibles: [eclaire.id] }]
      };
    }

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
    // Voir la carte de l'Aberration : catatonique, mort à l'aube (après la protection : une vision ratée ne fait rien).
    if (cible.role === "aberration") {
      return { donner: [{ tag: "catatonique", a: moi.id }] };
    }
    return {
      infos: [{ pour: moi.id, texte: `${cible.nom} est ${partie.titre(partie.carteImitee(cible) ?? cible.role)}.` }]
    };
  }
};

export default loupVoyante;
