import type { Role } from "../types";

/**
 * PLEUREUSE : à partir de la nuit 2, elle pleure devant la porte d'un joueur, qui est maudit.
 *
 * Déroulé :
 *   1. Chaque nuit (priorité 15, juste après le Conciliabule à 12), elle DONNE "maudit" à un joueur.
 *   2. Le MOTEUR fait le reste, pour tous les rôles : un maudit ne fait plus son rôle
 *      (TAGS_BLOQUANTS dans partie.ts, comme l'enchantement de la Fée, mais sans expiration).
 *   3. Chaque nuit, les maudits tiennent le Conciliabule (conciliabule.ts). S'ils la désignent,
 *      elle reçoit "apaisee" : sa carte n'offre plus que « Passer ».
 *
 * POURQUOI "apaisee" est un tag et pas sa memoire : c'est le Conciliabule qui lui retire son
 * pouvoir, et une autre carte ne lit ni n'écrit jamais la memoire d'un rôle.
 * ATTENTION : camp "village". Sa carte ressemble à celle du Marchand ou du Bâtisseur : à sa mort,
 * le rapport affiche « Pleureuse » à l'oracle, qui annonce seulement « une villageoise ».
 */
const pleureuse: Role = {
  alias: "pleureuse",
  titre: "Pleureuse",
  image: "😢",
  camp: "village",
  description: "Une pleureuse des funérailles, dont les larmes portent malheur. À partir de la 2e nuit, elle maudit un joueur chaque nuit : il ne fait plus son rôle. Les maudits peuvent la démasquer pendant leur conciliabule.",
  explication: [
    "À partir de la nuit 2 (rang 15), elle pleure devant la porte d'un joueur, qui devient maudit.",
    "Un maudit ne fait plus son rôle, jusqu'à la fin de la partie.",
    "Chaque nuit, les maudits vivants tiennent le Conciliabule (60 secondes) et désignent un joueur, mort ou vivant.",
    "S'ils désignent la Pleureuse, ils sont tous délivrés, et elle perd son pouvoir.",
    "La Pleureuse, le Fêtard, le Marchand et le Bâtisseur partagent la même carte : à sa mort, le village apprend seulement qu'un villageois est mort. Seuls le joueur et l'oracle savent lequel des quatre rôles c'était."
  ],
  priorite: 15,
  appelNuit: true,
  tours: { de: 2 },

  decision(partie, moi) {
    const titre = partie.titre(moi.role);
    if (partie.aTag(moi, "apaisee")) {
      return { message: `${titre} a été démasquée : elle a perdu son pouvoir.`, choix: [] };
    }
    const dejaMaudits = partie.joueursAvecTag("maudit").map(j => j.nom);
    const rappel = dejaMaudits.length ? ` (déjà maudits : ${dejaMaudits.join(", ")})` : "";
    return {
      message: `${titre} choisit devant quelle porte elle vient pleurer${rappel}.`,
      choix: [{ id: "maudire", label: "Pleurer devant sa porte", cible: "un_autre" }]
    };
  },

  // ATTENTION : aucun type de cible n'exclut les maudits. Si l'oracle en choisit un quand même,
  // rien n'est donné : la nuit est perdue pour elle.
  agir(choix, partie) {
    const cible = partie.joueur(choix.cibles[0]);
    if (partie.aTag(cible, "maudit")) return {};
    return { donner: [{ tag: "maudit", a: cible.id }] };
  }
};

export default pleureuse;
