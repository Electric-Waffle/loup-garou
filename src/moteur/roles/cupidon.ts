import type { Partie } from "../partie";
import type { Joueur, ResultatAction, Role } from "../types";

/**
 * CUPIDON : lie deux amoureux la nuit 1, découvre leurs rôles la nuit 3.
 *
 * Déroulé :
 *   1. Nuit 1 : decision() propose « lier » → agir() DONNE "amoureux" aux deux joueurs.
 *   2. Nuit 2 : la carte n'est pas appelée (champ tours).
 *   3. Nuit 3 : decision() propose « voir » → agir() produit une info privée avec leurs rôles.
 *
 * PATTERN : une carte, deux usages. decision() choisit l'usage selon la nuit ;
 * agir() exécute l'usage choisi (choix.id) sans relire la nuit. La règle
 * « quelle nuit fait quoi » n'est donc écrite qu'à un seul endroit.
 */

const NUIT_DU_LIEN = 1;

const cupidon: Role = {
  alias: "cupidon",
  titre: "Cupidon",
  image: "💘",
  camp: "village",
  description: "La première nuit, il lie deux joueurs. Si l'un meurt, l'autre meurt de chagrin. La 3e nuit, il découvre leurs rôles.",
  priorite: 1,
  appelNuit: true,
  // FLUX : peutAgir() teste (tour - 1) % 2 === 0, soit les nuits 1, 3, 5… ; « a: 3 » coupe après la 3.
  // decision() n'a pas besoin de changer : elle distingue seulement « nuit du lien » et « autre nuit ».
  tours: { de: 1, chaque: 2, a: 3 },

  // POURQUOI le titre lu dans la partie plutôt que « Cupidon » en dur : le meneur peut
  // renommer la carte dans Options.
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

/**
 * Nuit 3 : une info réservée au porteur de la carte (moi), avec les rôles sans les noms.
 * Le meneur choisit ensuite comment transmettre l'information.
 */
function revelerLesAmoureux(partie: Partie, moi: Joueur): ResultatAction {
  // ATTENTION : joueursAvecTag ne renvoie que les VIVANTS. C'est sans risque aujourd'hui : la chaîne
  // des amoureux (recevoir.ts, case "mort") tue l'un avec l'autre, ils sont donc vivants ou morts ensemble.
  // Si un rôle annule un jour une mort par chagrin, un amoureux survivant serait révélé seul.
  // Si Cupidon et le Loup succube sont dans la même partie, on voit les 4 rôles : choix assumé.
  // loup-succube.ts contient une copie volontaire de cette logique : une correction ici est à reporter là-bas.
  const amoureux = partie.joueursAvecTag("amoureux");

  if (amoureux.length === 0) {
    return { infos: [{ pour: moi.id, texte: "Les amoureux ne sont plus de ce monde." }] };
  }

  // CONCEPT : map() renvoie un NOUVEAU tableau, sans toucher à `amoureux`.
  //   amoureux                → [Joueur Emma, Joueur Hugo]
  //   .map(titre de son rôle) → ["Voyante", "Loup-Garou"]
  //   .join(", ")             → "Voyante, Loup-Garou"   (comme implode(", ", $x) en PHP)
  const titresDesRoles = amoureux.map(joueur => partie.titre(joueur.role));
  return { infos: [{ pour: moi.id, texte: `Rôles des amoureux : ${titresDesRoles.join(", ")}.` }] };
}

export default cupidon;
