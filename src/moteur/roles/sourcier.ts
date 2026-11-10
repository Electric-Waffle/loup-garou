import type { Partie } from "../partie";
import type { Joueur, Role } from "../types";

/**
 * SOURCIER : il teste un joueur une nuit, et apprend la nuit SUIVANTE à combien de places de lui se
 * trouve le joueur non villageois vivant le plus proche (loups, Fou, Skinwalker, Aberration…).
 *
 * Déroulé :
 *   1. Nuits impaires (1, 3, 5…) : decision() propose « Tester » ; agir() range le testé et le
 *      numéro de la nuit du résultat (tour + 1) dans sa memoire.
 *   2. Nuit suivante : decision() (sans choix) donne le résultat au meneur, qui le lui montre avec
 *      les doigts. Testé mort entre-temps : aucune info.
 *
 * CONCEPT : la table est un cercle des VIVANTS, dans l'ordre de partie.joueurs (les morts ne
 * comptent plus). On compte dans les deux sens et on garde le plus court. Voisins = 1 place.
 * POURQUOI le testé lui-même est exclu : la distance va au non-villageois SUIVANT. « 0 » veut dire
 * qu'il n'y en a pas d'autre : le testé est alors le dernier.
 * POURQUOI le résultat la nuit d'après : l'info est puissante (souvent 1 ou 2 suspects). Il faut
 * choisir le bon joueur à l'avance, et qu'il survive.
 * POURQUOI calculé la nuit du résultat et pas celle du test : il apprend la table telle qu'elle est
 * quand il ouvre les yeux, sans les morts de la journée.
 */
const sourcier: Role = {
  alias: "sourcier",
  titre: "Sourcier",
  image: "🪄",
  camp: "village",
  description: "Une nuit sur deux, il teste un joueur. La nuit suivante, si ce joueur est encore en vie, il apprend à combien de places se trouve le non-villageois (loup, Fou, Skinwalker…) le plus proche de lui.",
  // POURQUOI 82 : son info ne dépend d'aucune carte de la nuit. Juste après la Voyante (80).
  priorite: 82,
  appelNuit: true,

  decision(partie, moi) {
    if (partie.tour % 2 === 1) {
      return {
        message: "Le sourcier choisit un joueur à tester. Il aura la réponse la nuit prochaine.",
        choix: [{ id: "tester", label: "Tester", cible: "un_autre" }]
      };
    }
    if (moi.memoire.nuitDuResultat !== partie.tour) {
      return { message: "Le sourcier n'a testé personne la nuit dernière : rien à lui apprendre.", choix: [] };
    }
    const teste = partie.joueur(moi.memoire.teste);
    if (!teste.vivant) {
      return { message: `${teste.nom} est mort : le sourcier n'apprend rien.`, choix: [] };
    }
    const distance = distanceDuPlusProche(partie, teste);
    return { message: `Montrez au sourcier : ${teste.nom} est à ${distance} place${distance > 1 ? "s" : ""} du non-villageois le plus proche.`, choix: [] };
  },

  agir(choix, partie, moi) {
    moi.memoire.teste = choix.cibles[0];
    moi.memoire.nuitDuResultat = partie.tour + 1;
  }
};

/**
 * Plus petite distance (en places, autour de la table des vivants) entre `teste` et un autre
 * non-villageois vivant. 0 s'il n'y en a aucun autre.
 */
function distanceDuPlusProche(partie: Partie, teste: Joueur): number {
  const table = partie.vivants(); // dans l'ordre des sièges, sans les morts
  const depart = table.indexOf(teste);
  const distances = table
    .filter(j => j.id !== teste.id && partie.roleDe(j).camp !== "village")
    .map(j => {
      const ecart = Math.abs(table.indexOf(j) - depart);
      return Math.min(ecart, table.length - ecart); // les deux sens du cercle
    });
  return distances.length ? Math.min(...distances) : 0;
}

export default sourcier;
