import type { Role } from "../types";

/**
 * SKINWALKER : son propre camp. Chaque nuit à partir de la 3e, il tue un joueur et prend sa carte.
 *
 * Déroulé :
 *   1. Nuit 3 et suivantes (126, après le Salvateur à 100) : il désigne une victime.
 *   2. Victime protégée par le Salvateur : rien ne se passe, et il ne pourra pas tuer la nuit
 *      suivante (numéro de nuit en memoire, comme le Loup barbare).
 *   3. Sinon il DONNE "mort" (cause "skinwalker") : ni la Sorcière ni l'Ancien n'y peuvent rien,
 *      ce n'est pas une morsure. Le rapport de l'aube ne révèle pas la carte de la victime.
 *   4. Il se DONNE "imite" avec la carte de la victime : partie.porteursDe() l'appelle désormais au
 *      tour de cette carte, et la Voyante voit cette carte au lieu de la sienne.
 *   5. Victoire (victoire.ts) : si le village gagne et qu'il est vivant, il gagne seul.
 *
 * POURQUOI un tag "imite" et pas "devient" : "devient" change sa carte, donc son camp et son
 * pouvoir de tuer. Il garde sa carte de Skinwalker et JOUE en plus celle de sa victime.
 * POURQUOI init() de la carte volée : il la prend neuve (potions pleines pour une Sorcière) ; une
 * carte ne lit jamais la memoire d'un autre joueur.
 * shortcut: il ne joue que les tours de nuit de la carte volée, pas ses pouvoirs passifs (deux vies
 * de l'Ancien, tir du Chasseur) ; à étendre si une partie le demande.
 * ATTENTION : la carte volée est appelée dès cette nuit si son tour vient après 126 (Sorcière),
 * sinon à partir de la nuit suivante.
 */
const skinwalker: Role = {
  alias: "skinwalker",
  titre: "Skinwalker",
  image: "👤​",
  camp: "skinwalker",
  description: "Chaque nuit à partir de la 3e, il tue un joueur (sauf s'il est protégé par le Salvateur) et prend sa carte, sans la révéler. S'il est vivant quand le village gagne, il gagne seul.",
  priorite: 126,
  appelNuit: true,
  tours: { de: 3 },

  decision(partie, moi) {
    if (moi.memoire.nuitSansMeurtre === partie.tour) {
      return { message: "Le skinwalker a échoué hier : il ne peut tuer personne cette nuit.", choix: [] };
    }
    return {
      message: "Le skinwalker désigne sa victime : il la tue et prend sa carte.",
      choix: [{ id: "tuer", label: "Tuer", cible: "un_autre" }]
    };
  },

  agir(choix, partie, moi) {
    const victime = partie.joueur(choix.cibles[0]);
    if (partie.aTagDe(victime, "protege", "salvateur")) {
      moi.memoire.nuitSansMeurtre = partie.tour + 1;
      return {};
    }
    Object.assign(moi.memoire, partie.role(victime.role).init?.() ?? {});
    return {
      donner: [
        { tag: "mort", a: victime.id, meta: { cause: "skinwalker" } },
        { tag: "imite", a: moi.id, meta: { role: victime.role } }
      ]
    };
  }
};

export default skinwalker;
