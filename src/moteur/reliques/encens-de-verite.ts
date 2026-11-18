import type { Relique } from "../types";
import { loupsVivants } from "./outils";

/**
 * ENCENS DE VÉRITÉ [village] : un loup est révélé au village. Rien ne peut le tuer tant qu'il reste
 * un autre loup en vie : il tombe en dernier.
 *
 * Déroulé :
 *   1. debut() : un loup est tiré au hasard, marqué du tag « encens », et le village l'apprend ;
 *   2. recevoir() : toute mort sur ce joueur est BLOQUÉE tant que d'autres loups vivent, quelle qu'en
 *      soit la cause (vote compris : « absolument invincible ») ;
 *   3. dès qu'il est le dernier loup, la mort passe comme pour n'importe qui.
 *
 * POURQUOI un tag et pas l'id du loup dans partie.etatRelique : le tag est visible sur la table de
 * l'oracle, il apparaît au journal, et il suit le joueur s'il change de carte (Rat-garou…).
 * POURQUOI loupsVivants() compte aussi les loups cachés (Prêtre impur, Faux Parleur…) : comme pour la
 * victoire du village, « un loup » veut dire « du camp des loups ».
 * ATTENTION : un vote bloqué compte comme « personne n'est éliminé » (voir Partie.executerLeVote).
 */
const encensDeVerite: Relique = {
  alias: "encens-de-verite",
  titre: "Copal d'Itzamná",
  image: "🪔",
  camp: "village",
  description: "La fumée du copal brûlé pour Itzamná, dieu de la sagesse, révèle un loup au village. Il est invincible tant qu'il reste un autre loup : il ne peut tomber qu'en dernier.",
  explication: [
    "Au lancement, la fumée du copal sacré d'Itzamná désigne un loup tiré au hasard : tout le village sait qu'il est un loup.",
    "Tant qu'un autre loup est en vie, Itzamná le protège : rien ne peut le tuer, ni le vote du village, ni la Sorcière, ni le Chasseur, ni le chagrin… absolument rien.",
    "Quand il est le dernier loup vivant, le dieu l'abandonne : il redevient mortel.",
    "Le village peut donc ignorer ce loup et chasser les autres d'abord, en sachant que le dernier de la meute est déjà connu.",
    "« Un loup » veut aussi dire un loup caché : Prêtre impur, Faux Parleur, Rat-garou ou Loup barbare."
  ],

  debut(partie) {
    const loup = partie.auHasard(loupsVivants(partie));
    if (!loup) return;
    return {
      donner: [{ tag: "encens", a: loup.id }],
      infos: [{ pour: "tous", texte: `La fumée du copal d'Itzamná révèle un loup : ${loup.nom} est du camp des loups. Il ne tombera qu'en dernier.` }]
    };
  },

  recevoir(tag, meta, r, partie, joueur) {
    if (tag !== "mort" || !partie.aTag(joueur, "encens")) return;
    const autresLoups = loupsVivants(partie).filter(loup => loup.id !== joueur.id);
    if (autresLoups.length === 0) return;
    if (meta.cause === "vote") {
      partie.ajouterInfo({ pour: "tous", texte: `Le copal d'Itzamná protège ${joueur.nom} : il ne peut pas tomber tant qu'il reste d'autres loups.` });
    }
    return r.bloquer("copal d'Itzamná : invincible tant qu'il reste d'autres loups");
  }
};

export default encensDeVerite;
