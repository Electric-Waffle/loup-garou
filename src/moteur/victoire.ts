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
  if (nbLoups >= vivants.length - nbLoups) return "Les loups-garous";
  return undefined;
}
