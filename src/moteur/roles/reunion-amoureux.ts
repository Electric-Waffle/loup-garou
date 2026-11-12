import type { Role } from "../types";

const DUREE_EN_SECONDES = 60;

/**
 * RÉUNION DES AMOUREUX : une étape de la nuit, pas une carte qu'on distribue.
 *
 * Déroulé :
 *   1. Chaque nuit, après tous les liens (priorité 60), si au moins 2 amoureux vivants peuvent
 *      se réveiller, ils ouvrent les yeux ensemble : liés entre eux ou pas, loups ou non.
 *   2. Pendant 60 secondes, ils se voient, montrent leurs cartes et complotent en silence.
 *      La décision n'a aucun choix : l'oracle clique « Passer » à la fin du minuteur.
 *
 * PATTERN : une carte de groupe dont les porteurs sont CALCULÉS (champ porteurs) au lieu
 * d'être lus dans les rôles. porteursDe() et la file de la nuit la traitent comme les autres.
 * POURQUOI elle n'est pas dans LISTE_ROLES : personne ne la reçoit, elle ne doit apparaître
 * ni dans Options ni dans la distribution (voir roles/index.ts).
 * POURQUOI sans le Loup succube : son compagnon ne compte pas pour lui ; s'il meurt, le Succube
 * survit et en choisit un autre. Le compagnon, lui, vient à la réunion.
 */
const reunionAmoureux: Role = {
  alias: "reunion-amoureux",
  titre: "Réunion des amoureux",
  image: "💑",
  // Jamais lu : aucun joueur n'a cette carte, victoire.ts ne la compte donc jamais.
  camp: "village",
  description: "Chaque nuit où au moins deux amoureux sont en vie, ils se retrouvent sous la Lune pour se reconnaître et comploter.",
  priorite: 60,
  appelNuit: true,

  porteurs(partie) {
    const amoureux = partie
      .joueursAvecTag("amoureux")
      .filter(joueur => joueur.role !== "loup-succube");
    // Un seul amoureux n'a personne à qui parler : on ne le réveille pas pour rien.
    return amoureux.length >= 2 ? amoureux : [];
  },

  // Les noms des amoureux réveillés sont déjà affichés par l'interface (courante.porteurs).
  decision: () => ({
    message: "Les amoureux se réveillent ensemble : ils se reconnaissent et complotent en silence.",
    choix: [],
    minuteur: DUREE_EN_SECONDES
  })
};

export default reunionAmoureux;
