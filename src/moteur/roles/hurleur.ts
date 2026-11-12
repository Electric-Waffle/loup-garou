import type { Role } from "../types";

/**
 * HURLEUR : un villageois qui hurle dès qu'une carte s'en prend à lui la nuit. Tout le village
 * l'apprend au rapport de l'aube : quelle carte, quelle action, mais JAMAIS qui est le Hurleur.
 *
 * Déroulé :
 *   1. La nuit, une carte le désigne (morsure, Voyante, Salvateur, Sorcière, Fée…).
 *   2. Le moteur appelle estVise() avant l'action ; le Hurleur ajoute une info PUBLIQUE avec le
 *      titre de la carte et le libellé de l'option choisie (« Dévorer », « Sonder », « Protéger »…).
 *   3. Le meneur la lit à voix haute au rapport de l'aube.
 *
 * ATTENTION : jamais le nom du Hurleur dans l'annonce, même quand on pourrait le deviner (Clair de
 * lune). Les boutons peuvent contenir son nom (« Sonder J3 ») : le Hurleur le retire du libellé.
 *
 * POURQUOI estVise() et pas reagir() : reagir() ne voit que les tags reçus. La Voyante regarde sans
 * rien donner : elle serait passée inaperçue.
 * POURQUOI relire decision() pour le libellé : le choix fait ne garde que l'id ("sonder") ; le
 * libellé est celui que le meneur a vu sur le bouton. Relu AVANT agir(), l'état n'a pas encore changé.
 */
const hurleur: Role = {
  alias: "hurleur",
  titre: "Hurleur",
  image: "📢",
  camp: "village",
  description: "Si une carte s'en prend à lui pendant la nuit (morsure, regard, protection…), il hurle : tout le village l'apprend à l'aube.",
  explication: [
    "Un villageois qui hurle dès qu'une carte s'en prend à lui pendant la nuit.",
    "Morsure, regard de la Voyante, protection du Salvateur, potion, enchantement… toute carte qui le désigne déclenche un hurlement.",
    "Au rapport de l'aube, le meneur annonce que le Hurleur a été visé, par quelle carte et avec quelle action.",
    "Son nom n'est jamais donné : le village sait seulement que le Hurleur a été visé."
  ],

  estVise(partie, moi, alias, choix, acteur) {
    if (partie.phase !== "nuit") return;
    const option = partie.role(alias).decision?.(partie, acteur)?.choix.find(c => c.id === choix.id);
    // « Sonder J3 » → « Sonder » : le libellé du bouton, sans le nom du Hurleur.
    // POURQUOI la DERNIÈRE occurrence seulement : le nom suit l'action. Un Hurleur nommé « Sonde »
    // donne « Sonder Sonde » ; retirer toutes les occurrences abîmerait aussi « Sonder ».
    const label = option?.label ?? choix.id;
    const position = label.lastIndexOf(moi.nom);
    const sansNom = position < 0 ? label : label.slice(0, position) + label.slice(position + moi.nom.length);
    const action = sansNom.replace(/\s+/g, " ").trim();
    partie.ajouterInfo({ pour: "tous", texte: `Un hurlement dans la nuit : le Hurleur a été visé par ${partie.titre(alias)} (« ${action} »).` });
  }
};

export default hurleur;
