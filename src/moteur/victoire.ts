import type { Partie } from "./partie";

/** Renvoie le camp vainqueur, ou undefined si la partie continue. */
export function verifierVictoire(partie: Partie): string | undefined {
  const vivants = partie.vivants();
  if (vivants.length === 0) return "Personne : le village est désert.";

  const nbLoups = vivants.filter(j => partie.roleDe(j).camp === "loups").length;

  if (vivants.length === 2 && vivants.every(j => partie.aTag(j, "amoureux"))) return "Les amoureux";

  // Cas particulier : un rat-garou face à un seul joueur hors du camp des loups.
  // POURQUOI ici : le rat-garou compte comme loup, donc « 1 loup contre 1 » ferait gagner les loups
  // avant que son crochet aube() ne le tue (la victoire est vérifiée avant la nuit suivante).
  const resteUnRatGarou = vivants.some(j => j.role === "rat-garou");
  const resteUnNonLoup = vivants.some(j => partie.roleDe(j).camp !== "loups");
  if (vivants.length === 2 && resteUnRatGarou && resteUnNonLoup) return "Le village";

  if (nbLoups === 0) return "Le village";

  // Bâtisseur : toutes les maisons des villageois VIVANTS sont renforcées.
  // POURQUOI avant les loups : si les deux arrivent en même temps, le chantier de plusieurs nuits l'emporte.
  // ATTENTION : [].every(...) vaut true. Sans le test de longueur, zéro villageois vivant = victoire du village.
  const villageoisVivants = vivants.filter(j => partie.roleDe(j).camp === "village");
  const toutesRenforcees = villageoisVivants.every(j => partie.aTag(j, "renforce"));
  if (villageoisVivants.length > 0 && toutesRenforcees) return "Le village (toutes les maisons sont renforcées)";

  if (nbLoups >=vivants.length - nbLoups) {
    // Le Fou voulait cette victoire des loups : s'il est encore en vie, elle lui revient.
    const fouVivant = vivants.some(j => partie.roleDe(j).camp === "fou");
    return fouVivant ? "Le fou" : "Les loups-garous";
  }
  return undefined;
}
