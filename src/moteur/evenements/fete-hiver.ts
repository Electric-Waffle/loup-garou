import type { Evenement } from "../types";

/**
 * FÊTE DE KAYAB (hiver, animation) : on n'a droit qu'à UNE prise de parole pendant le débat, sauf le maire.
 * Aucun effet dans le moteur : l'oracle lit la règle (rappelDebat) et la fait respecter.
 * POURQUOI un champ Evenement.rappelDebat plutôt qu'un tag : il n'y a rien à retenir par joueur, la
 * règle est la même pour tous ; l'oracle n'a besoin que du texte à l'écran du débat.
 */
const feteHiver: Evenement = {
  alias: "fete-hiver",
  titre: "Fête de Kayab",
  image: "🐢",
  description: "Fête de l'hiver : la tortue Kayab parle une seule fois. Une fois qu'on a fini de parler, on se tait jusqu'à la fin du débat, sauf le maire.",
  explication: [
    "Chacun n'a droit qu'à une seule prise de parole pendant le débat.",
    "Une fois qu'il a fini de parler, un joueur ne peut plus ni parler ni faire de signe jusqu'à la fin du débat.",
    "Le maire fait exception : il peut intervenir quand il veut.",
    "C'est une animation : l'oracle fait respecter la règle."
  ],
  rappelDebat: "Fête de Kayab : une seule prise de parole par joueur. Une fois qu'on a fini, plus un mot ni un signe jusqu'à la fin du débat, sauf le maire."
};

export default feteHiver;
