import type { Partie } from "../partie";
import type { CoteDeTable, DroitsDuJour, Joueur, Relique } from "../types";

/**
 * DOMAINE DES OMBRES [loups] : la table est coupée en deux par un trait vertical. Un jour, la moitié
 * gauche parle et la moitié droite vote ; le lendemain, c'est l'inverse. Un joueur scindé par le
 * trait (nombre de joueurs impair) parle ET vote tous les jours.
 *
 * C'est surtout une ANIMATION : le moteur ne compte pas les voix, c'est l'oracle qui fait respecter la
 * règle. Le code se contente de trois choses :
 *   1. separation() : le côté de chaque joueur, FIXÉ au lancement d'après sa place à la table ;
 *   2. droitsDuJour() : qui peut parler, qui peut voter, selon le numéro du jour (partie.tour) ;
 *   3. rappelsDuDebat() / rappelsDuVote() : ces droits en toutes lettres pour l'oracle.
 * L'interface dessine le trait (Table.tsx) et marque chaque siège 💬 (parle) ou 🗳️ (vote).
 *
 * POURQUOI les côtés d'après la place et pas d'après les vivants : le trait est dessiné sur la table,
 * il ne bouge pas quand quelqu'un meurt. Les morts gardent leur côté ; les rappels ne citent que les vivants.
 * POURQUOI les homologues (le joueur en face, de l'autre côté du trait) ne sont pas calculés : ils ne
 * changent rien aux règles, la vue de la table les rend évidents.
 *
 * GÉOMÉTRIE (partie.joueurs, premier siège en haut, sens horaire) :
 *   impair : le siège 0 est SUR le trait (scindé) ; 1 à (n-1)/2 à droite ; le reste à gauche.
 *   pair   : la table est décalée d'un demi-siège, donc aucun siège sur le trait ; la première moitié
 *            à droite, la seconde à gauche.
 * ATTENTION : cette règle est le pendant exact de `separation` dans Table.tsx. Si l'un change, l'autre aussi.
 */

/** Le côté de chaque joueur, d'après son index parmi les sièges. */
function cotesDeTable(partie: Partie): Record<string, CoteDeTable> {
  const nombre = partie.joueurs.length;
  const estImpair = nombre % 2 === 1;
  const cotes: Record<string, CoteDeTable> = {};
  partie.joueurs.forEach((joueur, index) => {
    if (estImpair && index === 0) cotes[joueur.id] = "scinde";
    else if (estImpair) cotes[joueur.id] = index <= (nombre - 1) / 2 ? "droite" : "gauche";
    else cotes[joueur.id] = index < nombre / 2 ? "droite" : "gauche";
  });
  return cotes;
}

/**
 * Jour 1 : la gauche parle, la droite vote. Jour 2 : l'inverse. Et ainsi de suite.
 * CONCEPT : `tour % 2 === 1` vaut vrai les jours impairs (1, 3, 5…).
 */
function droitsDe(cote: CoteDeTable, jour: number): DroitsDuJour {
  if (cote === "scinde") return { parole: true, vote: true };
  const lesGauchesParlent = jour % 2 === 1;
  const parole = (cote === "gauche") === lesGauchesParlent;
  return { parole, vote: !parole };
}

/** Les noms des vivants qui ont ce droit, avec « (scindé) » pour celui qui est sur le trait. */
function nomsDe(partie: Partie, droit: keyof DroitsDuJour): string {
  const cotes = cotesDeTable(partie);
  return partie.vivants()
    .filter(joueur => droitsDe(cotes[joueur.id], partie.tour)[droit])
    .map(joueur => (cotes[joueur.id] === "scinde" ? `${joueur.nom} (scindé)` : joueur.nom))
    .join(", ") || "personne";
}

const domaineDesOmbres: Relique = {
  alias: "domaine-des-ombres",
  titre: "Domaine des ombres",
  image: "🌗",
  camp: "loups",
  description: "Les ombres de Xibalba coupent la table en deux : un jour, la moitié gauche parle et la moitié droite vote ; le lendemain, l'inverse. Un joueur scindé par le trait fait les deux.",
  explication: [
    "Au lancement, un trait vertical sépare la table en deux : la moitié gauche et la moitié droite, face à face. Chaque joueur a un vis-à-vis de l'autre côté du trait.",
    "Si le nombre de joueurs est impair, un joueur est scindé en deux par le trait : il peut à la fois parler et voter, tous les jours.",
    "Jour 1 : la gauche peut parler, mais seule la droite vote. Jour 2 : la gauche vote, mais seule la droite parle. Et ainsi de suite, un jour sur deux.",
    "Une information reçue la nuit ne peut donc pas toujours être dite le lendemain : une Voyante du mauvais côté doit attendre une autre aube pour parler de ce qu'elle a vu.",
    "Le trait est dessiné sur la table et chaque siège porte 💬 (peut parler) ou 🗳️ (peut voter) pendant le débat et le vote. C'est l'oracle qui fait respecter la règle."
  ],

  separation: cotesDeTable,

  droitsDuJour(partie, joueur: Joueur) {
    return droitsDe(cotesDeTable(partie)[joueur.id], partie.tour);
  },

  rappelsDuDebat(partie) {
    return [`Domaine des ombres, jour ${partie.tour} : peuvent parler ${nomsDe(partie, "parole")}. Les autres écoutent en silence.`];
  },

  rappelsDuVote(partie) {
    return [`Domaine des ombres, jour ${partie.tour} : seuls peuvent voter ${nomsDe(partie, "vote")}.`];
  }
};

export default domaineDesOmbres;
