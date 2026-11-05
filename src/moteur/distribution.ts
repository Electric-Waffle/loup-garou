import { ROLES } from "./roles";

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
 *  1. camp des loups : nbLoups cartes, mélange au hasard de loups spéciaux et de Loups-Garous ;
 *  2. un exemplaire de chaque autre rôle spécial activé (tirés au hasard s'il y en a trop) ;
 *  3. complété avec des villageois.
 */
export function composer(nbJoueurs: number, nbLoups: number, actifs: string[], aleatoire: Aleatoire = Math.random): string[] {
  if (nbJoueurs < 3) throw new Error("Il faut au moins 3 joueurs à table.");
  if (nbLoups < 1 || nbLoups >= nbJoueurs) {
    throw new Error("Il faut au moins 1 loup, et moins de loups que de joueurs.");
  }

  const cartesLoups = composerLesLoups(nbLoups, actifs, aleatoire);

  const speciauxDuVillage = actifs.filter(alias => {
    const estUneCarteDeBase = alias === "loup" || alias === "villageois";
    const estDuCampDesLoups = ROLES[alias].camp === "loups";
    return !estUneCarteDeBase && !estDuCampDesLoups;
  });
  const placesRestantes = nbJoueurs - nbLoups;
  const speciauxTires = melanger(speciauxDuVillage, aleatoire).slice(0, placesRestantes);
  const cartes = [...cartesLoups, ...speciauxTires];

  if (cartes.length < nbJoueurs) {
    if (!actifs.includes("villageois")) {
      throw new Error("Pas assez de cartes activées : activez Villageois ou davantage de rôles.");
    }
    while (cartes.length < nbJoueurs) cartes.push("villageois");
  }
  return melanger(cartes, aleatoire);
}

/**
 * Les nbLoups cartes du camp des loups.
 * Un « loup spécial » est toute carte activée du camp des loups autre que le Loup-Garou
 * (un exemplaire chacun) ; le reste est complété par des Loups-Garous.
 *
 * POURQUOI tirer d'abord le NOMBRE de spéciaux, puis lesquels : chaque répartition
 * (0, 1, 2… spéciaux) a la même chance. Mélanger toutes les cartes possibles et en prendre
 * nbLoups favoriserait les Loups-Garous, qui seraient bien plus nombreux dans le tas.
 */
function composerLesLoups(nbLoups: number, actifs: string[], aleatoire: Aleatoire): string[] {
  const loupGarouActif = actifs.includes("loup");
  const loupsSpeciaux = actifs.filter(alias => alias !== "loup" && ROLES[alias].camp === "loups");

  // Bornes du nombre de loups spéciaux :
  //   min : 0 si les Loups-Garous peuvent compléter, sinon TOUS les loups doivent être spéciaux ;
  //   max : pas plus que de loups spéciaux activés, puisqu'il y a un exemplaire de chacun.
  const minSpeciaux = loupGarouActif ? 0 : nbLoups;
  const maxSpeciaux = Math.min(nbLoups, loupsSpeciaux.length);
  if (minSpeciaux > maxSpeciaux) {
    throw new Error("Pas assez de cartes loups : activez Loup-Garou ou davantage de loups spéciaux.");
  }

  // CONCEPT : aleatoire() est dans [0, 1[. Multiplié par le nombre de valeurs possibles
  // (max - min + 1) puis arrondi en dessous, il donne un entier de 0 à (max - min), sans biais.
  //   ex. min 0, max 3 : floor(0.62 × 4) = 2 → 2 loups spéciaux
  const nbSpeciaux = minSpeciaux + Math.floor(aleatoire() * (maxSpeciaux - minSpeciaux + 1));

  const speciauxTires = melanger(loupsSpeciaux, aleatoire).slice(0, nbSpeciaux);
  const loupsGarous = Array<string>(nbLoups - nbSpeciaux).fill("loup");
  return [...speciauxTires, ...loupsGarous];
}

/** Associe à chaque joueur (dans l'ordre de la table) une carte. */
export function distribuer(idsJoueurs: string[], nbLoups: number, actifs: string[], aleatoire: Aleatoire = Math.random): Record<string, string> {
  const cartes = composer(idsJoueurs.length, nbLoups, actifs, aleatoire);
  return Object.fromEntries(idsJoueurs.map((id, i) => [id, cartes[i]]));
}
