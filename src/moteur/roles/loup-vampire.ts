import type { Role } from "../types";

/**
 * LOUP VAMPIRE : un loup que seul le vote du village peut tuer.
 *
 * Déroulé :
 *   1. debut() lui DONNE le tag "invulnerable" avant la nuit 1.
 *   2. Chaque nuit, il se réveille et vote avec les loups (rejoint: ["loup"]).
 *   3. Toute mort qui n'est pas un vote du village est BLOQUÉE à la réception (recevoir.ts,
 *      case "mort") : poison de la Sorcière, tir du Chasseur, chagrin d'amoureux, peste du Rat…
 *   4. Voté par le village, il meurt normalement : l'or, la chaîne des amoureux et le Chasseur
 *      s'appliquent comme pour n'importe qui.
 *
 * POURQUOI un tag plutôt qu'un recevoir() dans ce fichier : l'invulnérabilité devient une
 * propriété que n'importe quel joueur peut porter (un événement, une future potion…), comme l'or.
 * Si personne d'autre ne s'en sert, on pourra la ramener ici sous forme de recevoir().
 *
 * POURQUOI rien n'est bloqué en amont (mordu, empoisonne…) : il est loup, il n'est jamais mordu ;
 * les autres tags mortels ne sont pas visibles par un rôle qui pourrait se faire avoir.
 * Seule la conversion en "mort" compte, et c'est elle qu'on bloque.
 */
const loupVampire: Role = {
  alias: "loup-vampire",
  titre: "Loup vampire",
  image: "🦇",
  camp: "loups",
  description: "Un loup qui vote avec la meute. Rien ne peut le tuer, sauf le vote du village.",
  rejoint: ["loup"],

  // POURQUOI debut() et pas init() : init() remplit la memoire, invisible des règles générales.
  // Le tag, lui, est lu par recevoir.ts et apparaît sur la table et au journal.
  debut: (_partie, moi) => ({
    donner: [{ tag: "invulnerable", a: moi.id }]
  })
};

export default loupVampire;
