import type { Partie } from "./partie";

/** Renvoie le camp vainqueur, ou undefined si la partie continue. */
export function verifierVictoire(partie: Partie): string | undefined {
  const vivants = partie.vivants();
  if (vivants.length === 0) return "Personne : le village est désert.";

  const nbLoups = vivants.filter(j => partie.roleDe(j).camp === "loups").length;

  if (vivants.length === 2 && vivants.every(j => partie.aTag(j, "amoureux"))) return "Les amoureux";
  if (nbLoups === 0) return "Le village";
  if (nbLoups >= vivants.length - nbLoups) return "Les loups-garous";
  return undefined;
}
