import type { Evenement } from "../types";

/**
 * COUP DOUBLE : si le joueur éliminé est un loup, le village peut voter une seconde fois.
 *
 * FLUX : apresVote() renvoie revoter ; le moteur propose alors partie.revoter(), et l'écran du
 * résultat affiche « Voter quelqu'un d'autre ». Le débat de ce second vote, le meneur le gère
 * de tête : on revient directement au vote.
 * POURQUOI le moteur limite à un second vote (et pas l'événement) : l'événement n'a pas d'état ;
 * partie.aRevote, remis à zéro chaque jour, s'en souvient.
 */
const coupDouble: Evenement = {
  alias: "coup-double",
  titre: "Coup double",
  image: "🎯",
  description: "Si le village élimine un loup aujourd'hui, il peut voter une seconde fois.",
  explication: [
    "Si le village élimine un loup aujourd'hui, il peut voter une seconde fois.",
    "Le second vote se fait sans nouveau débat.",
    "Un seul second vote par jour, même si le deuxième éliminé est aussi un loup."
  ],
  rappelVote: "Coup double : si l'éliminé est un loup, le village pourra voter une seconde fois.",

  apresVote(partie, elimine) {
    if (!elimine || partie.roleDe(elimine).camp !== "loups") return;
    return {
      revoter: true,
      infos: [{ pour: "tous", texte: `${elimine.nom} était un loup : coup double, le village peut voter une seconde fois.` }]
    };
  }
};

export default coupDouble;
