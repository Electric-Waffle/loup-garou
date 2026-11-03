import type { Role } from "../types";

/**
 * LOUP AMOUREUX : un loup qui, la nuit 1, se lie lui-même à un joueur.
 *
 * Déroulé :
 *   1. Nuit 1 : decision() propose « Se lier » → agir() DONNE "amoureux" à lui et à sa cible,
 *      chacun avec l'id de l'autre dans meta.partenaires : le chagrin marche dans les deux sens
 *      (règle générale de recevoir.ts, case "mort").
 *   2. Son partenaire est prévenu par une info privée : il sait qu'il aime un loup.
 *   3. Chaque nuit : il se réveille avec les loups et vote avec eux (rejoint: ["loup"]).
 *   4. Cible protégée par le Salvateur : le lien échoue, sans annonce, et sans seconde chance
 *      (tours : nuit 1 seulement). Il restera sans amoureux toute la partie.
 *
 * Si sa cible est aussi liée par Cupidon, les liens s'additionnent (réseau, recevoir.ts),
 * et la Réunion des amoureux leur permet de s'en rendre compte.
 * POURQUOI priorité 102 : APRÈS le Salvateur (100), sinon sa protection n'existe pas encore.
 * Prix : la Réunion des amoureux (60) est déjà passée, son partenaire n'y vient qu'à partir de la nuit 2.
 */
const loupAmoureux: Role = {
  alias: "loup-amoureux",
  titre: "Loup amoureux",
  image: "💞",
  camp: "loups",
  description: "Un loup qui, la première nuit, se lie à un joueur. Si l'un meurt, l'autre meurt de chagrin.",
  priorite: 102,
  appelNuit: true,
  tours: { de: 1, a: 1 },
  rejoint: ["loup"],

  decision: (partie, moi) => ({
    message: `${partie.titre(moi.role)} choisit le joueur à qui il se lie.`,
    choix: [{ id: "lier", label: "Se lier", cible: "un_autre" }]
  }),

  agir(choix, partie, moi) {
    const aime = choix.cibles[0];
    if (partie.aTagDe(partie.joueur(aime), "protege", "salvateur")) return {};

    return {
      donner: [
        { tag: "amoureux", a: moi.id, meta: { partenaires: [aime] } },
        { tag: "amoureux", a: aime, meta: { partenaires: [moi.id] } }
      ],
      infos: [
        { pour: aime, texte: `Tu es amoureux de ${moi.nom}, le ${partie.titre(moi.role)}. Si l'un meurt, l'autre aussi.` }
      ]
    };
  }
};

export default loupAmoureux;
