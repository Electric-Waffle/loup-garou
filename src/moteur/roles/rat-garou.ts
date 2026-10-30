import { appliquerResultat } from "../donner";
import type { Partie } from "../partie";
import type { Joueur, Role } from "../types";

/**
 * RAT-GAROU : un Rat qui a rejoint la meute (via le tag "devient"), ou distribué directement.
 *
 * Déroulé :
 *   1. Chaque nuit, il se réveille avec les loups (rejoint: ["loup"]) mais ne vote pas :
 *      le meneur ne tient pas compte de son avis, et passe la carte s'il est seul.
 *   2. À l'aube, s'il est le dernier participant au vote des loups, il meurt (crochet aube).
 *   3. S'il est éliminé par le vote, le maire attrape la peste.
 *
 * POURQUOI ce code ressemble à rat.ts sans le réutiliser : chaque carte reste indépendante,
 * pour qu'on puisse jouer avec un rat-garou sans Rat, ou supprimer l'un sans casser l'autre.
 * ATTENTION : victoire.ts connaît ce rôle par son alias (cas « rat-garou contre un seul joueur »).
 */
const ratGarou: Role = {
  alias: "rat-garou",
  titre: "Rat-garou",
  image: "🐾",
  camp: "loups",
  description: "Il connaît les loups mais ne vote pas avec eux. S'il est le dernier loup, il meurt. Éliminé par le village, il contamine le maire.",
  rejoint: ["loup"],

  reagir(tag, meta, partie, moi) {
    if (tag === "mort" && meta.cause === "vote") contaminerLeMaire(partie, moi);
  },

  aube(partie, moi) {
    const meute = partie.porteursDe("loup");
    const estLeDernier = meute.length === 1 && meute[0].id === moi.id;
    if (estLeDernier) {
      return { donner: [{ tag: "mort", a: moi.id, meta: { cause: "isole" } }] };
    }
  }
};

/** Le maire vivant attrape la peste (voir la même fonction dans rat.ts). */
function contaminerLeMaire(partie: Partie, moi: Joueur): void {
  const maire = partie.joueursAvecTag("maire")[0];
  if (!maire) return;
  appliquerResultat(partie, { donner: [{ tag: "peste", a: maire.id }] }, moi.role);
}

export default ratGarou;
