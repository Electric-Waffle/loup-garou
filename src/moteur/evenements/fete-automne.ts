import type { Evenement } from "../types";

/**
 * FÊTE DE YAX (automne, animation) : pendant le débat, onomatopées et signes seulement.
 * Aucun effet dans le moteur : l'oracle lit la règle (rappelDebat) et la fait respecter.
 */
const feteAutomne: Evenement = {
  alias: "fete-automne",
  titre: "Fête de Yax",
  image: "🍂",
  description: "Fête de l'automne : pendant le débat, on ne s'exprime qu'en onomatopées et en gestes.",
  explication: [
    "Pendant le débat, aucun mot n'est permis : seulement des onomatopées (grognements, cris, bruitages) et des signes.",
    "Le vote se déroule normalement.",
    "C'est une animation : l'oracle fait respecter la règle."
  ],
  rappelDebat: "Fête de Yax : pendant le débat, seulement des onomatopées et des signes, aucun mot."
};

export default feteAutomne;
