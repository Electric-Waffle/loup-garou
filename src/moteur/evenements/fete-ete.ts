import type { Evenement } from "../types";

/**
 * FÊTE DE XUL (été, animation) : la vague remplace le minuteur. Le débat s'arrête quand elle se brise.
 * Aucun effet dans le moteur : l'oracle lit la règle (rappelDebat) et la fait respecter.
 * CONCEPT : `minuteur: null` = pas de minuteur. Le temps du débat n'est plus une durée mais un événement
 * du jeu : le premier qui laisse tomber la vague clôt le débat, volontairement ou non.
 */
const feteEte: Evenement = {
  alias: "fete-ete",
  titre: "Fête de Xul",
  image: "🌊",
  description: "Fête de l'été : tout le monde se tient les mains et fait passer une vague. Quand elle se brise, le débat est clos.",
  explication: [
    "Pendant le débat, tout le monde se tient les mains et fait circuler une vague d'un joueur à l'autre.",
    "Il n'y a pas de minuteur : le minuteur, c'est la vague.",
    "Dès que quelqu'un oublie de la continuer, volontairement ou non, le débat est clos et on passe au vote.",
    "C'est une animation : l'oracle fait respecter la règle."
  ],
  minuteur: null,
  rappelDebat: "Fête de Xul : tout le monde se tient les mains et fait passer une vague. Pas de minuteur : le débat est clos dès que la vague est brisée."
};

export default feteEte;
