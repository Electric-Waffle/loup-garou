import type { Partie } from "./partie";

/**
 * Renvoie le camp vainqueur, ou undefined si la partie continue.
 * On compte les vivants par camp (Role.camp). Les cartes hybrides n'ont pas de cas particulier :
 * un Prêtre pur devenu Prêtre impur, ou un Beau Parleur devenu Faux Parleur, a changé de
 * CARTE (tag "devient"), donc de camp.
 */
export function verifierVictoire(partie: Partie): string | undefined {
  const vivants = partie.vivants();
  if (vivants.length === 0) return "Personne : le village est désert.";

  // Aberration vivante : AUCUN autre camp ne gagne (ni loups, ni village, ni amoureux, ni Fou).
  // Elle gagne quand tous les autres survivants sont horrifiés.
  // ATTENTION : seule survivante, [].every(...) vaut true : elle gagne, c'est voulu.
  const aberration = vivants.find(j => partie.roleDe(j).camp === "aberration");
  if (aberration) {
    const autres = vivants.filter(j => j.id !== aberration.id);
    return autres.every(j => partie.aTag(j, "horrifie")) ? "L'aberration" : undefined;
  }

  const nbLoups = vivants.filter(j => partie.roleDe(j).camp === "loups").length;

  // Skinwalker vivant : la victoire du village lui revient, à lui seul (comme le Fou pour les loups).
  const skinwalkerVivant = vivants.some(j => partie.roleDe(j).camp === "skinwalker");
  const village = (texte: string) => skinwalkerVivant ? "Le skinwalker" : texte;

  // Amoureux en majorité STRICTE parmi les vivants, liés entre eux ou pas, quel que soit leur camp.
  // Couvre l'ancien cas « 2 vivants amoureux » (2 contre 0). POURQUOI strict : avec ">=", Cupidon
  // dans une partie à 4 (2 contre 2) gagnerait dès la première aube.
  const nbAmoureux = vivants.filter(j => partie.aTag(j, "amoureux")).length;
  if (nbAmoureux > vivants.length - nbAmoureux) return "Les amoureux";

  // Cas particulier : un rat-garou face à un seul joueur hors du camp des loups.
  // POURQUOI ici : le rat-garou compte comme loup, donc « 1 loup contre 1 » ferait gagner les loups
  // avant que son crochet aube() ne le tue (la victoire est vérifiée avant la nuit suivante).
  const resteUnRatGarou = vivants.some(j => j.role === "rat-garou");
  const resteUnNonLoup = vivants.some(j => partie.roleDe(j).camp !== "loups");
  if (vivants.length === 2 && resteUnRatGarou && resteUnNonLoup) return village("Le village");

  if (nbLoups === 0) return village("Le village");

  // Bâtisseur : toutes les maisons des villageois VIVANTS sont renforcées.
  // POURQUOI avant les loups : si les deux arrivent en même temps, le chantier de plusieurs nuits l'emporte.
  // ATTENTION : [].every(...) vaut true. Sans le test de longueur, zéro villageois vivant = victoire du village.
  const villageoisVivants = vivants.filter(j => partie.roleDe(j).camp === "village");
  const toutesRenforcees = villageoisVivants.every(j => partie.aTag(j, "renforce"));
  if (villageoisVivants.length > 0 && toutesRenforcees) {
    return village("Le village (toutes les maisons sont renforcées)");
  }

  if (nbLoups >= vivants.length - nbLoups) {
    // Le Fou voulait cette victoire des loups : s'il est encore en vie, elle lui revient,
    // à lui seul (les loups perdent, Prêtre impur compris).
    const fouVivant = vivants.some(j => partie.roleDe(j).camp === "fou");
    return fouVivant ? "Le fou" : "Les loups-garous";
  }
  return undefined;
}

