import type { Role } from "../types";

/**
 * ARLEQUIN : la nuit 1, puis une nuit sur deux, il lie deux joueurs jusqu'à l'aube.
 *
 * Déroulé :
 *   1. Appelé juste après la Fée (priorité 20) et avant tous les autres.
 *   2. Il DONNE "lie" aux deux joueurs, chacun avec l'id de son partenaire, expirant à l'aube.
 *   3. Le MOTEUR applique la règle : partie.ciblesPossibles() ne propose à un joueur lié que
 *      lui-même et son partenaire, quand il joue seul sa carte. Pour les loups, le meneur décide de tête.
 *
 * ATTENTION : le lien expire à la fin de l'aube, AVANT la décision urgente d'un Chasseur tué
 * cette nuit-là. Il ne s'applique donc pas à ce Chasseur.
 */
const arlequin: Role = {
  alias: "arlequin",
  titre: "Arlequin",
  image: "🎭",
  camp: "village",
  description: "Un danseur masqué des fêtes du Soleil. La 1re nuit, puis une nuit sur deux, il lie deux joueurs : ils ne peuvent agir que sur eux-mêmes ou sur l'autre.",
  explication: [
    "La première nuit, puis une nuit sur deux (rang 20), il lie deux joueurs jusqu'à l'aube.",
    "Un joueur lié qui joue seul sa carte ne peut viser que lui-même ou son partenaire.",
    "Pour une carte de groupe comme les loups, le meneur applique la règle de tête.",
    "Le lien disparaît à la fin de l'aube : un Chasseur tué cette nuit-là tire librement."
  ],
  priorite: 20,
  appelNuit: true,
  // FLUX : peutAgir() teste (tour - 1) % 2 === 0, soit les nuits 1, 3, 5…
  tours: { de: 1, chaque: 2 },

  decision: () => ({
    message: "L'arlequin désigne deux joueurs à lier pour la nuit.",
    choix: [{ id: "lier", label: "Lier", cible: "deux_joueurs" }]
  }),

  agir(choix) {
    const [a, b] = choix.cibles;
    return {
      donner: [
        { tag: "lie", a, meta: { partenaire: b, expire: "aube" } },
        { tag: "lie", a: b, meta: { partenaire: a, expire: "aube" } }
      ]
    };
  }
};

export default arlequin;
