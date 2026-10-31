import type { Partie } from "../partie";
import type { Joueur, ResultatAction, Role } from "../types";

/**
 * LOUP SUCCUBE : un loup qui lie deux amoureux la nuit 1 et découvre leurs rôles la nuit 3.
 *
 * Déroulé :
 *   1. Nuit 1 : sa propre carte propose « lier » → agir() DONNE "amoureux" aux deux joueurs.
 *   2. Nuit 3 : sa propre carte propose « voir » → agir() produit une info privée avec leurs rôles.
 *   3. Chaque nuit : il se réveille avec les loups et vote avec eux (rejoint: ["loup"]).
 *   4. Il compte comme un loup pour la victoire (camp: "loups", lu par victoire.ts).
 *
 * POURQUOI ce code ressemble à cupidon.ts sans le réutiliser : chaque carte reste indépendante.
 * Supprimer ou modifier Cupidon ne doit jamais changer le comportement du Loup succube.
 * Le prix : une correction de la logique « lier / voir » est à faire dans les deux fichiers.
 */

const NUIT_DU_LIEN = 1;

const loupSuccube: Role = {
  alias: "loup-succube",
  titre: "Loup succube",
  image: "💋",
  camp: "loups",
  description: "Un loup qui, la première nuit, lie deux joueurs comme Cupidon. La 3e nuit, il découvre leurs rôles.",
  // POURQUOI 2 : juste après Cupidon (1), avant la Voyante (5), pour que les liens existent dès la nuit 1.
  priorite: 2,
  appelNuit: true,
  // FLUX : peutAgir() teste (tour - 1) % 2 === 0, soit les nuits 1, 3, 5… ; « a: 3 » coupe après la 3.
  tours: { de: 1, chaque: 2, a: 3 },
  // FLUX : partie.porteursDe("loup") l'inclut, donc il vote avec les loups toutes les nuits,
  // même s'il est le dernier loup en vie. Ce n'est PAS lié à `tours`, qui ne concerne que sa propre carte.
  rejoint: ["loup"],

  decision(partie, moi) {
    const titre = partie.titre(moi.role);
    if (partie.tour === NUIT_DU_LIEN) {
      return {
        message: `${titre} désigne deux amoureux.`,
        choix: [{ id: "lier", label: "Lier", cible: "deux_joueurs" }]
      };
    }
    return {
      message: `${titre} découvre le rôle des amoureux.`,
      choix: [{ id: "voir", label: "Voir", cible: "aucune" }]
    };
  },

  agir(choix, partie, moi) {
    if (choix.id === "lier") return lierLesAmoureux(choix.cibles, partie);
    if (choix.id === "voir") return revelerLesAmoureux(partie, moi);
  }
};

/** Nuit 1 : chacun reçoit "amoureux", avec l'id de son partenaire en métadonnée. */
function lierLesAmoureux(cibles: string[], partie: Partie): ResultatAction {
  const [a, b] = cibles;
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

/** Nuit 3 : une info réservée au Loup succube (moi), avec les rôles sans les noms. */
function revelerLesAmoureux(partie: Partie, moi: Joueur): ResultatAction {
  // ATTENTION : joueursAvecTag ne renvoie que les vivants ; voir la même remarque dans cupidon.ts.
  const amoureux = partie.joueursAvecTag("amoureux");

  if (amoureux.length === 0) {
    return { infos: [{ pour: moi.id, texte: "Les amoureux ne sont plus de ce monde." }] };
  }

  const titresDesRoles = amoureux.map(joueur => partie.titre(joueur.role));
  return { infos: [{ pour: moi.id, texte: `Rôles des amoureux : ${titresDesRoles.join(", ")}.` }] };
}

export default loupSuccube;
