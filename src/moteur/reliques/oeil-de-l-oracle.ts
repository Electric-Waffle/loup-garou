import type { Camp, Relique } from "../types";

/** Le camp, tel que l'oracle le dit au village. */
const CAMP_ANNONCE: Partial<Record<Camp, string>> = {
  village: "du camp du village",
  loups: "du camp des loups"
};

/**
 * ŒIL DE L'ORACLE [village] : le village apprend ce que l'oracle cache d'ordinaire.
 *
 * Trois révélations :
 *   - à la mort d'une carte HYBRIDE (Rat, Prêtre, Beau Parleur et leurs versions des loups) : son camp ;
 *   - à la mort d'une carte PARTAGÉE (Pleureuse, Fêtard, Marchand, Bâtisseur) : laquelle des quatre ;
 *   - chaque jour, le nom de l'événement en cours.
 *
 * Déroulé : reagir() est appelé à chaque mort, apresEvenement() à chaque événement validé ; les deux
 * ne donnent que des informations PUBLIQUES, lues au rapport de l'aube, au résultat du vote ou à
 * l'écran de l'événement.
 *
 * POURQUOI lire Role.hybride et Role.partagee : la relique ne connaît aucune carte par son nom. Une
 * future carte hybride ou partagée est révélée sans toucher à ce fichier.
 * ATTENTION : le camp d'un hybride est celui de sa carte AU MOMENT DE LA MORT : un Prêtre qui a choisi
 * d'être impur est « du camp des loups ». C'est exactement ce que cette relique dévoile.
 */
const oeilDeLOracle: Relique = {
  alias: "oeil-de-l-oracle",
  titre: "Œil du Chilam",
  image: "🧿",
  camp: "village",
  description: "Le Chilam, prêtre-devin des Mayas, voit ce que l'oracle cache d'ordinaire : le camp des cartes hybrides qui meurent, la carte exacte des cartes partagées, et le nom de l'événement du jour.",
  explication: [
    "À la mort d'une carte hybride (Rat, Prêtre, Beau Parleur…), le Chilam révèle au village de quel camp elle était : village ou loups. D'ordinaire, ce choix reste secret.",
    "À la mort d'une carte partagée (Pleureuse, Fêtard, Marchand, Bâtisseur), il révèle laquelle des quatre c'était, au lieu de « un villageois ».",
    "Chaque jour, il annonce aussi le nom de l'événement en cours.",
    "Si l'événement est le Pantomime, il révèle aussi le nom du seul joueur qui votera, dès le début du débat.",
    "Ces informations sont lues à voix haute au rapport de l'aube, au résultat du vote ou à l'écran de l'événement."
  ],

  reagir(tag, _meta, partie, joueur) {
    if (tag !== "mort") return;
    const role = partie.roleDe(joueur);
    if (role.hybride) {
      const camp = CAMP_ANNONCE[role.camp] ?? role.camp;
      partie.ajouterInfo({ pour: "tous", texte: `L'œil du Chilam révèle que ${joueur.nom}, carte hybride, était ${camp}.` });
    } else if (role.partagee) {
      partie.ajouterInfo({ pour: "tous", texte: `L'œil du Chilam révèle que ${joueur.nom} était ${partie.titre(joueur.role)}.` });
    }
  },

  apresEvenement(partie, evenement) {
    const infos = [{ pour: "tous", texte: `L'œil du Chilam révèle l'événement du jour : « ${evenement.titre} ».` }];
    // Synergie avec le Pantomime : le tag « votant » est posé par l'événement, et le Chilam en révèle le
    // nom tout de suite. POURQUOI lire le tag et pas l'alias de l'événement : un futur événement qui
    // désigne un votant unique est révélé sans toucher à ce fichier.
    for (const votant of partie.joueursAvecTag("votant")) {
      infos.push({ pour: "tous", texte: `Le Chilam voit plus loin : ${votant.nom} sera le seul à voter.` });
    }
    return { infos };
  }
};

export default oeilDeLOracle;
