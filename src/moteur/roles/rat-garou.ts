import { appliquerResultat } from "../donner";
import type { Partie } from "../partie";
import type { Joueur, Role } from "../types";

/**
 * RAT-GAROU : un Rat qui a rejoint la meute (via le tag "devient"), ou distribué directement.
 *
 * Déroulé :
 *   1. Chaque nuit, il se réveille avec les loups (rejoint: ["loup"]) mais ne vote pas :
 *      l'oracle ne tient pas compte de son avis, et passe la carte s'il est seul.
 *   2. À l'aube, s'il est le dernier vivant du camp des loups, il meurt (crochet aube).
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
  hybride: true,
  description: "Un rat passé du côté de la meute. Il connaît les loups mais ne vote pas avec eux. S'il est le dernier loup, il meurt. Éliminé par le village, il contamine le maire.",
  explication: [
    "Un Rat qui a rejoint la meute, ou une carte distribuée telle quelle.",
    "Il se réveille avec les loups et les connaît, mais il ne vote pas : l'oracle ignore son avis.",
    "Il compte comme un loup pour la victoire. Mais s'il devient le dernier loup vivant, il meurt à l'aube.",
    "Face à un seul autre joueur, il ne fait pas gagner les loups : c'est le village qui gagne.",
    "Éliminé par le vote du village, il contamine le maire, qui attrape la peste.",
    "Carte hybride : à sa mort, l'oracle annonce « Rat », sans jamais révéler le camp que le joueur avait choisi."
  ],
  rejoint: ["loup"],

  reagir(tag, meta, partie, moi) {
    if (tag === "mort" && meta.cause === "vote") contaminerLeMaire(partie, moi);
  },

  aube(partie, moi) {
    // POURQUOI le camp et pas porteursDe("loup") : le Fou vote avec les loups sans en être un.
    // Avec porteursDe, un Fou vivant empêcherait le rat-garou d'être jamais « le dernier ».
    const loupsVivants = partie.vivants().filter(j => partie.roleDe(j).camp === "loups");
    const estLeDernier = loupsVivants.length === 1 && loupsVivants[0].id === moi.id;
    if (estLeDernier) {
      return { donner: [{ tag: "mort", a: moi.id, meta: { cause: "isole" } }] };
    }
  }
};

/** Le maire vivant attrape la peste (voir la même fonction dans rat.ts). */
function contaminerLeMaire(partie: Partie, moi: Joueur): void {
  // Sans pouvoir : pas de peste non plus, exactement comme le Rat (sinon on verrait son camp).
  if (partie.estEmpeche(moi, moi.role)) return;
  const maire = partie.joueursAvecTag("maire")[0];
  if (!maire) return;
  appliquerResultat(partie, { donner: [{ tag: "peste", a: maire.id }] }, moi.role);
}

export default ratGarou;
