export type Aleatoire = () => number;

export function melanger<T>(liste: T[], aleatoire: Aleatoire = Math.random): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(aleatoire() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/**
 * Compose la liste des cartes pour n joueurs à partir des rôles activés :
 *  - loups : 1 pour 4 joueurs (au moins 1)
 *  - un exemplaire de chaque rôle spécial activé (tirés au hasard s'il y en a trop)
 *  - complété avec des villageois
 */
export function composer(nbJoueurs: number, actifs: string[], aleatoire: Aleatoire = Math.random): string[] {
  if (nbJoueurs < 3) throw new Error("Il faut au moins 3 joueurs à table.");
  if (!actifs.includes("loup")) throw new Error("La carte Loup-Garou doit être activée.");

  const nbLoups = Math.max(1, Math.floor(nbJoueurs / 4));
  const speciaux = melanger(actifs.filter(a => a !== "loup" && a !== "villageois"), aleatoire);
  const cartes = [...Array(nbLoups).fill("loup"), ...speciaux.slice(0, nbJoueurs - nbLoups)];

  if (cartes.length < nbJoueurs) {
    if (!actifs.includes("villageois")) {
      throw new Error("Pas assez de cartes activées : activez Villageois ou davantage de rôles.");
    }
    while (cartes.length < nbJoueurs) cartes.push("villageois");
  }
  return melanger(cartes, aleatoire);
}

/** Associe à chaque joueur (dans l'ordre de la table) une carte. */
export function distribuer(idsJoueurs: string[], actifs: string[], aleatoire: Aleatoire = Math.random): Record<string, string> {
  const cartes = composer(idsJoueurs.length, actifs, aleatoire);
  return Object.fromEntries(idsJoueurs.map((id, i) => [id, cartes[i]]));
}
