import { appliquerResultat } from "../donner";
import type { Role } from "../types";

/**
 * LOUP-DÉMON : un loup qui, brûlé par le vote du village, possède un villageois au hasard.
 *
 * Déroulé :
 *   1. Chaque nuit : il se réveille avec les loups et vote avec eux (rejoint: ["loup"]).
 *   2. reagir() : sa mort par VOTE est acceptée (chagrin, or, Fêtard… s'appliquent), puis il DONNE
 *      à un joueur vivant du camp du village, tiré au hasard :
 *        - "possede" : la marque, visible du meneur sur la table ;
 *        - "devient" (role: "loup") : la règle générale de recevoir.ts change sa carte en Loup-Garou.
 *   3. Toute autre mort (morsure, poison, chagrin…) : rien de spécial, il meurt.
 *
 * POURQUOI réutiliser "devient" : c'est déjà le chemin du Rat qui devient rat-garou. Le possédé
 * garde ses tags (amoureux, or…) et sa memoire, mais joue désormais la carte Loup-Garou.
 * POURQUOI reagir() et pas recevoir() : la mort doit d'abord avoir lieu normalement.
 */
const loupDemon: Role = {
  alias: "loup-demon",
  titre: "Loup-démon",
  image: "😈",
  camp: "loups",
  description: "Un loup qui, s'il est éliminé par le vote du village, possède un villageois au hasard : celui-ci devient Loup-Garou. Tué autrement, il meurt simplement.",
  rejoint: ["loup"],

  reagir(tag, meta, partie, moi) {
    if (tag !== "mort" || meta.cause !== "vote") return;

    const villageois = partie.vivants().filter(joueur => partie.roleDe(joueur).camp === "village");
    const possede = partie.auHasard(villageois);
    if (!possede) return;

    // ATTENTION : l'ordre compte. "possede" est posé pendant qu'il est encore villageois (journal
    // lisible : « possédé, puis devient Loup-Garou »).
    appliquerResultat(partie, {
      donner: [
        { tag: "possede", a: possede.id },
        { tag: "devient", a: possede.id, meta: { role: "loup" } }
      ],
      infos: [{ pour: possede.id, texte: `${moi.nom}, le ${partie.titre(moi.role)}, t'a possédé : tu es maintenant ${partie.titre("loup")}.` }]
    }, moi.role);
  }
};

export default loupDemon;
