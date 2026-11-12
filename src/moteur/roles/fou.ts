import type { Role } from "../types";

/**
 * FOU : il se réveille avec les loups et vote avec eux, mais son vote ne compte pas.
 *
 * Déroulé :
 *   1. Chaque nuit, il rejoint la carte des loups (rejoint: ["loup"]). Seul le meneur sait
 *      qu'il est le Fou, et il ignore son vote de tête.
 *   2. Son camp, « fou », n'est ni le village ni les loups : il ne compte pas comme un loup.
 *   3. Si les loups devraient gagner alors qu'il est vivant, c'est lui qui gagne (victoire.ts).
 *
 * ATTENTION : participant au vote des loups, il peut attraper la peste du Rat.
 */
const fou: Role = {
  alias: "fou",
  titre: "Fou",
  image: "🃏",
  camp: "fou",
  description: "Il se réveille et vote avec les loups, mais son vote ne compte pas. Si les loups gagnent et qu'il est vivant, il gagne seul.",
  explication: [
    "Il se réveille avec les loups et fait semblant d'être des leurs : seul le meneur sait qu'il est le Fou.",
    "Son vote ne compte pas : le meneur ignore son avis pour choisir la victime.",
    "Il n'est pas un loup : il ne compte pas dans le nombre de loups, et la Rumeur l'annonce innocent.",
    "Si les loups devraient gagner alors qu'il est vivant, c'est lui qui gagne, seul : les loups perdent."
  ],
  rejoint: ["loup"]
};

export default fou;
