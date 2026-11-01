import type { Partie } from "./partie";

/**
 * Renvoie le camp vainqueur, ou undefined si la partie continue.
 *
 * Deux questions différentes, à ne pas confondre :
 *   1. QUI A GAGNÉ ? On compte les vivants par camp (Role.camp). Un prêtre impur compte comme
 *      un villageois : son camp reste "village".
 *   2. QUI EST DANS L'ÉQUIPE GAGNANTE ? Un prêtre impur (tag "impur") gagne avec les loups et
 *      perd avec le village. victoireDuVillage() et victoireDesLoups() complètent le texte.
 */
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
  if (vivants.length === 2 && resteUnRatGarou && resteUnNonLoup) return victoireDuVillage(partie, "Le village");

  if (nbLoups === 0) return victoireDuVillage(partie, "Le village");

  // Bâtisseur : toutes les maisons des villageois VIVANTS sont renforcées.
  // POURQUOI avant les loups : si les deux arrivent en même temps, le chantier de plusieurs nuits l'emporte.
  // ATTENTION : [].every(...) vaut true. Sans le test de longueur, zéro villageois vivant = victoire du village.
  const villageoisVivants = vivants.filter(j => partie.roleDe(j).camp === "village");
  const toutesRenforcees = villageoisVivants.every(j => partie.aTag(j, "renforce"));
  if (villageoisVivants.length > 0 && toutesRenforcees) {
    return victoireDuVillage(partie, "Le village (toutes les maisons sont renforcées)");
  }

  if (nbLoups >= vivants.length - nbLoups) {
    // Le Fou voulait cette victoire des loups : s'il est encore en vie, elle lui revient,
    // à lui seul (le prêtre impur, qui servait les loups, perd aussi).
    const fouVivant = vivants.some(j => partie.roleDe(j).camp === "fou");
    return fouVivant ? "Le fou" : victoireDesLoups(partie);
  }
  return undefined;
}

/**
 * Y a-t-il un prêtre impur dans la partie, vivant OU mort ?
 * POURQUOI partie.joueurs et pas joueursAvecTag : joueursAvecTag ne renvoie que les vivants.
 * Or le prêtre gagne ou perd avec son équipe même mort, comme un loup mort gagne avec la meute.
 */
function aUnPretreImpur(partie: Partie): boolean {
  return partie.joueurs.some(joueur => partie.aTag(joueur, "impur"));
}

/** Victoire du village : le prêtre impur fait partie des perdants, on le précise au meneur. */
function victoireDuVillage(partie: Partie, texte: string): string {
  if (aUnPretreImpur(partie)) return `${texte}, sans le prêtre impur`;
  return texte;
}

/** Victoire des loups : le prêtre impur gagne avec eux. */
function victoireDesLoups(partie: Partie): string {
  if (aUnPretreImpur(partie)) return "Les loups-garous et le prêtre impur";
  return "Les loups-garous";
}
