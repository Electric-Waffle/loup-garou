import type { Relique } from "../types";
import { verifierVictoire } from "../victoire";

/**
 * HACHE DE GUERRE [village] : tant que le village élimine un loup, il peut revoter.
 *
 * Déroulé :
 *   1. apresVote() : si l'éliminé du vote définitif est du camp des loups, la relique propose un autre
 *      vote (revoter: true), comme l'événement Chasse du puma ;
 *   2. Partie.finDuVote() ouvre alors le bouton « Voter quelqu'un d'autre » ;
 *   3. le nouveau vote rappelle apresVote() : la chaîne continue tant que le village trouve un loup.
 *
 * POURQUOI sans limite, alors que Chasse du puma n'autorise qu'un second vote par jour : c'est
 * précisément ce qui fait la force de la hache. Un village qui devine juste peut tout nettoyer en un
 * jour. Partie.finDuVote() ne borne que les revotes demandés par les ÉVÉNEMENTS.
 * POURQUOI verifierVictoire : quand le dernier loup tombe, il n'y a plus rien à rejouer.
 */
const hacheDeGuerre: Relique = {
  alias: "hache-de-guerre",
  titre: "Hache de guerre",
  image: "⚔️",
  camp: "village",
  description: "Tant que le village élimine un loup, il peut revoter : un village qui devine juste peut gagner en un jour.",
  explication: [
    "Chaque fois que le village élimine un loup par le vote, il peut voter une nouvelle fois, sans limite.",
    "La chaîne s'arrête dès qu'un vote élimine quelqu'un qui n'est pas un loup, ou personne.",
    "Un village qui trouve un loup à chaque vote peut donc tous les éliminer le jour même, et gagner dès le premier tour.",
    "« Un loup » comprend les loups cachés : Prêtre impur, Faux Parleur, Rat-garou, Loup barbare.",
    "Le débat se fait de tête, sans minuteur, entre deux votes."
  ],

  apresVote(partie, elimine) {
    if (!elimine || partie.roleDe(elimine).camp !== "loups") return;
    if (verifierVictoire(partie) !== undefined) return;
    return {
      revoter: true,
      infos: [{ pour: "tous", texte: `${elimine.nom} était un loup : la hache de guerre permet au village de voter encore.` }]
    };
  }
};

export default hacheDeGuerre;
