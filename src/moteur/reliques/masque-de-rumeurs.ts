import type { Relique } from "../types";

/**
 * MASQUE DE RUMEURS [village] : dès le premier soir, le village apprend quelles cartes hors du village
 * sont en jeu, et combien de joueurs les portent. Jamais QUI les porte.
 *
 * Déroulé : debut() lit la table au lancement (avant la nuit 1) et renvoie UNE information publique.
 *
 * POURQUOI regrouper par titre (« 2 × Loup-Garou ») : le village sait ainsi combien de joueurs ne sont
 * pas villageois, ce qui compte autant que les cartes elles-mêmes.
 * POURQUOI lire Role.camp et pas une liste de cartes : une future carte d'un autre camp est révélée
 * sans toucher à ce fichier, et les cartes hybrides comptent selon leur camp AU LANCEMENT (un Prêtre
 * pur, du village, n'est pas listé ; un Prêtre impur distribué tel quel, des loups, l'est).
 * ATTENTION : l'oracle doit annoncer ce texte au village avant la première nuit ; l'écran de la nuit 1
 * le lui rappelle tant qu'aucune carte n'a joué.
 */
const masqueDeRumeurs: Relique = {
  alias: "masque-de-rumeurs",
  titre: "Masque de Hun Batz",
  image: "🎭",
  camp: "village",
  description: "Hun Batz, le dieu-singe des scribes, répète ce qu'il a entendu : dès le premier soir, le village apprend quelles cartes hors du village sont en jeu, sans savoir qui les porte.",
  explication: [
    "Au lancement, le masque révèle au village toutes les cartes qui ne sont pas du camp du village : loups, Fou, Skinwalker, Aberration…",
    "Il dit combien de joueurs portent chacune, et combien de joueurs ne sont donc pas villageois, mais jamais qui.",
    "L'oracle annonce cette liste avant la première nuit. Elle reste affichée à l'écran de la nuit 1.",
    "Les cartes hybrides comptent selon leur camp de départ : un Prêtre pur ou un Rat sont du village et n'apparaissent pas ; un Prêtre impur, un Faux Parleur ou un Rat-garou distribués tels quels apparaissent.",
    "Un Beau Parleur ou un Prêtre qui choisit son camp la nuit 1 n'est pas dévoilé par le masque : il ne voit que la distribution."
  ],

  debut(partie) {
    const horsDuVillage = partie.joueurs.filter(joueur => partie.roleDe(joueur).camp !== "village");
    if (horsDuVillage.length === 0) {
      return { infos: [{ pour: "tous", texte: "Le masque de Hun Batz murmure : tous les joueurs sont du village." }] };
    }

    // Titre → nombre de porteurs. CONCEPT : un Map garde l'ordre d'insertion, donc l'ordre de la table.
    const parTitre = new Map<string, number>();
    for (const joueur of horsDuVillage) {
      const titre = partie.titre(joueur.role);
      parTitre.set(titre, (parTitre.get(titre) ?? 0) + 1);
    }
    //   Map { "Loup-Garou" => 2, "Fou" => 1 }  →  ["2 × Loup-Garou", "Fou"]
    const liste = [...parTitre].map(([titre, nombre]) => (nombre > 1 ? `${nombre} × ${titre}` : titre));
    const combien = horsDuVillage.length === 1
      ? "1 joueur n'est pas villageois."
      : `${horsDuVillage.length} joueurs ne sont pas villageois.`;

    return {
      infos: [{
        pour: "tous",
        texte: `Le masque de Hun Batz murmure : hors du village, il y a en jeu ${liste.join(", ")}. ${combien}`
      }]
    };
  }
};

export default masqueDeRumeurs;
