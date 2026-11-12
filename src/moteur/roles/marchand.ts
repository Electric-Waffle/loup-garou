import type { Role } from "../types";

/**
 * MARCHAND : un villageois qui commence la partie avec de l'or.
 *
 * Déroulé :
 *   1. debut() lui DONNE le tag "or" avant la nuit 1.
 *   2. Toute la règle de l'or vit dans recevoir.ts (case "mort"), car l'or change de main :
 *      - voté par le village : l'or est dépensé, la mort est consommée, nouveau débat où il parle seul ;
 *      - tué autrement : l'or va à un de ses tueurs vivants (tiré au hasard s'ils sont plusieurs) ;
 *      - aucun tueur vivant (Chasseur, peste, chagrin…) : le mourant choisit → décision ci-dessous.
 *
 * ATTENTION : cette décision n'est pas réservée au Marchand. Tout porteur d'or qui meurt sans tueur
 * vivant la reçoit (un loup qui a hérité de l'or et meurt de chagrin) : le titre affiché sera
 * « Marchand », mais `moi` est bien le mourant.
 */
const marchand: Role = {
  alias: "marchand",
  titre: "Marchand",
  image: "💰",
  camp: "village",
  description: "Un marchand des routes de l'Inca, la bourse pleine d'or. Voté, il dépense son or pour un second vote où lui seul a la parole. Tué, son or passe à son tueur.",
  explication: [
    "Il commence la partie avec de l'or.",
    "Voté par le village, il dépense son or : le vote est annulé, il a seul la parole pour se défendre, puis le village revote.",
    "Tué autrement, son or passe à un de ses tueurs vivants : un loup s'il a été dévoré, la Sorcière s'il a été empoisonné…",
    "Sans tueur vivant (peste, chagrin…), il choisit lui-même à qui donner son or.",
    "L'or appartient à celui qui le porte : un loup qui en hérite peut racheter son propre vote.",
    "La Pleureuse, le Fêtard, le Marchand et le Bâtisseur partagent la même carte : à sa mort, le village apprend seulement qu'un villageois est mort. Seuls le joueur et le meneur savent lequel des quatre rôles c'était."
  ],

  debut: (_partie, moi) => ({
    donner: [{ tag: "or", a: moi.id }]
  }),

  // Pas d'appelNuit : cette décision n'existe qu'en urgence, quand un porteur d'or meurt.
  decision: (_partie, moi) => ({
    message: `${moi.nom} meurt avec de l'or : à qui le donne-t-il ? (« Passer » : l'or est perdu)`,
    choix: [{ id: "donner", label: "Donner l'or", cible: "un_joueur" }]
  }),

  agir(choix, partie, moi) {
    // Le mort lâche son or. Sur « Passer », agir n'est pas appelé : l'or reste sur le mort, donc perdu.
    partie.retirerTag(moi, "or", 0);
    return {
      donner: [{ tag: "or", a: choix.cibles[0], meta: { source: moi.id, cause: "heritage" } }]
    };
  }
};

export default marchand;
