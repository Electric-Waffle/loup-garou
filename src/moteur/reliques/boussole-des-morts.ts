import type { Decision, Joueur, Relique } from "../types";

/**
 * BOUSSOLE DES MORTS [village] : une nuit sur deux, un mort des loups et un mort du village s'affrontent
 * au pierre-feuille-ciseaux. Le gagnant désigne un vivant, que l'oracle montre au village le matin,
 * sans dire de quel camp est le gagnant.
 *
 * Déroulé (état dans partie.etatRelique.boussole) :
 *   1. debutDeNuit() : les nuits paires (2, 4, 6…), s'il y a au moins un mort du camp des loups ET un
 *      mort du camp du village, un mort de chaque camp est tiré au hasard : ce sont les duellistes.
 *      La relique ouvre sa décision urgente, avant toutes les cartes de la nuit ;
 *   2. TEMPS 1 : l'oracle fait jouer le duel (3 manches) et indique qui a gagné ;
 *   3. TEMPS 2 : agir() rouvre la décision pour le gagnant : il désigne un joueur vivant ;
 *   4. agir() annonce publiquement le désigné, lu au rapport de l'aube.
 *
 * POURQUOI les nuits paires : la nuit 1, personne n'est encore mort ; « une nuit sur deux » tombe
 * donc sur les nuits 2, 4, 6…
 * POURQUOI deux décisions et pas une seule : le gagnant n'est connu qu'après le duel. Chaque temps est
 * une décision urgente de la relique, la seconde étant ouverte par la première (voir Partie.ouvrirDecisionDeRelique).
 * ATTENTION : le duel se joue en vrai, entre les deux joueurs morts, autour de la table ; l'application
 * ne tire rien, elle enregistre le résultat. Seuls les camps COMPTENT, pas les cartes : un Fou mort ou un
 * Skinwalker mort ne sont ni « loups » ni « village ».
 */

/** L'état du duel de la nuit, rangé dans partie.etatRelique.boussole. */
interface DuelDeLaNuit {
  temps: 1 | 2;          // 1 : qui a gagné ? ; 2 : qui est désigné ?
  loup: string;          // id du mort du camp des loups
  village: string;       // id du mort du camp du village
  gagnant?: string;      // id du gagnant, connu au temps 2
}

const boussoleDesMorts: Relique = {
  alias: "boussole-des-morts",
  titre: "Boussole de Xibalba",
  image: "🧭",
  camp: "village",
  description: "Une nuit sur deux, un mort des loups et un mort du village s'affrontent au pierre-feuille-ciseaux : le gagnant désigne un vivant, montré au village le matin.",
  explication: [
    "Les nuits paires (2, 4, 6…), si au moins un joueur mort était du camp des loups et un autre du camp du village, un mort de chaque camp est tiré au hasard.",
    "Ils s'affrontent au pierre-feuille-ciseaux, en 3 manches, autour de la table : l'oracle enregistre qui gagne.",
    "Le gagnant désigne un joueur vivant, en secret. Au matin, l'oracle le montre au village, sans dire de quel camp était le gagnant.",
    "Un mort du camp des loups qui gagne peut donc détourner les soupçons du village, et un mort du village peut l'aider : tout est dans la manière dont on lit la désignation.",
    "Seuls comptent les morts des camps du village et des loups, loups cachés et cartes hybrides comprises selon leur camp à la mort. Sans les deux camps parmi les morts, la nuit se passe normalement."
  ],

  debutDeNuit(partie) {
    if (partie.tour % 2 !== 0) return undefined;
    const morts = partie.joueurs.filter(joueur => !joueur.vivant);
    const mortDesLoups = partie.auHasard(morts.filter(j => partie.roleDe(j).camp === "loups"));
    const mortDuVillage = partie.auHasard(morts.filter(j => partie.roleDe(j).camp === "village"));
    if (!mortDesLoups || !mortDuVillage) return undefined;

    const duel: DuelDeLaNuit = { temps: 1, loup: mortDesLoups.id, village: mortDuVillage.id };
    partie.etatRelique.boussole = duel;
    return mortDesLoups;
  },

  porteurs(partie) {
    const duel = partie.etatRelique.boussole as DuelDeLaNuit;
    // Temps 1 : les deux duellistes sont surlignés sur la table. Temps 2 : seulement le gagnant.
    if (duel.temps === 1) return [partie.joueur(duel.loup), partie.joueur(duel.village)];
    return [partie.joueur(duel.gagnant!)];
  },

  decision(partie): Decision {
    const duel = partie.etatRelique.boussole as DuelDeLaNuit;
    if (duel.temps === 1) {
      const mortDesLoups = partie.joueur(duel.loup);
      const mortDuVillage = partie.joueur(duel.village);
      return {
        message: `Les morts s'affrontent au pierre-feuille-ciseaux, en 3 manches : ${mortDesLoups.nom} (mort, camp des loups) contre ${mortDuVillage.nom} (mort, camp du village). Qui gagne ?`,
        // L'id d'un choix est celui du gagnant : agir() n'a rien d'autre à relire.
        choix: [
          { id: mortDesLoups.id, label: `${mortDesLoups.nom} gagne`, cible: "aucune" },
          { id: mortDuVillage.id, label: `${mortDuVillage.nom} gagne`, cible: "aucune" }
        ]
      };
    }
    const gagnant = partie.joueur(duel.gagnant!);
    return {
      message: `${gagnant.nom} a gagné le duel et désigne une personne. Au matin, l'oracle la montrera au village, sans dire de quel camp est le gagnant.`,
      choix: [{ id: "designer", label: "Désigner", cible: "un_joueur" }]
    };
  },

  agir(choix, partie) {
    const duel = partie.etatRelique.boussole as DuelDeLaNuit;

    if (duel.temps === 1) {
      // Temps 1 → 2 : le gagnant est connu, sa décision s'ouvre aussitôt (elle passera avant les cartes).
      duel.gagnant = choix.id;
      duel.temps = 2;
      partie.ouvrirDecisionDeRelique(partie.joueur(choix.id) as Joueur);
      return;
    }

    const designe = partie.joueur(choix.cibles[0]);
    return {
      infos: [{ pour: "tous", texte: `La boussole de Xibalba s'est tournée vers ${designe.nom}.` }]
    };
  }
};

export default boussoleDesMorts;
