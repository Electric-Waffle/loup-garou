import type { Evenement } from "../types";

/**
 * PANTOMIME : tout le monde débat, mais un seul joueur vote. Personne ne sait lequel : chacun doit
 * donc convaincre tout le monde. Son nom n'est révélé qu'à la fin du débat.
 *
 * Déroulé :
 *   1. appliquer() tire un joueur vivant au hasard et lui DONNE « votant » jusqu'à l'aube ;
 *   2. Partie.rappelsDuDebat() dit à l'oracle de ne pas révéler son nom avant la fin du débat ;
 *   3. à l'écran du vote, Partie.rappelsDuVote() donne l'ordre à suivre : tout le monde vote, les
 *      pouvoirs des loups s'appliquent, PUIS on ne garde que le vote du votant.
 *
 * POURQUOI le moteur n'en fait pas plus : il ne compte pas les voix, c'est l'oracle qui lit les mains
 * levées et clique l'éliminé. C'est un événement d'ANIMATION, comme le Masque de jade ; le tag et les
 * rappels servent à l'oracle.
 * POURQUOI « le vote d'abord, les pouvoirs ensuite, puis on ne garde que le sien » et pas « seul lui
 * vote » : si le votant est dirigé par l'hypnotiseur (« dirige »), son vote DÉPEND de celui du loup ; le
 * vote doit donc avoir lieu en entier avant de savoir ce qui compte. Réduit au silence (« silence »),
 * son vote ne compte pas : personne n'est éliminé.
 * SYNERGIE : l'Œil du Chilam révèle déjà, à la validation de l'événement, le nom du votant (voir
 * oeil-de-l-oracle.ts, qui lit le tag « votant » sans connaître cet événement).
 */
const pantomime: Evenement = {
  alias: "pantomime",
  titre: "Pantomime",
  image: "🤹",
  description: "Tout le monde débat, mais un seul joueur vote. Personne ne sait lequel : son nom n'est révélé qu'à la fin du débat.",
  explication: [
    "Pendant le débat, tout le monde parle et cherche à convaincre. Mais un seul joueur, tiré au hasard, votera, et personne ne sait qui.",
    "À la fin du débat, l'oracle révèle son nom. Le village vote alors, et seul le vote de ce joueur compte.",
    "Les pouvoirs des loups s'appliquent d'abord : un joueur dirigé par le Loup hypnotiseur vote comme lui. On vote, on applique ces pouvoirs, puis on ne garde que le vote du votant.",
    "S'il est réduit au silence par le Loup hypnotiseur, son vote ne compte pas : personne n'est éliminé et on passe.",
    "L'Œil du Chilam révèle le nom du votant dès le début du débat : le village sait alors qui convaincre."
  ],

  appliquer(partie) {
    const votant = partie.auHasard(partie.vivants());
    if (!votant) return;
    return { donner: [{ tag: "votant", a: votant.id, meta: { expire: "aube" as const } }] };
  }
};

export default pantomime;
