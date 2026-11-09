import type { Role } from "../types";

/**
 * FAUX PARLEUR : un orateur au service des loups. Distribué directement, ou atteint par un Beau
 * Parleur qui choisit de le devenir la nuit 1 (tag "devient", sa mémoire le suit).
 *
 * Déroulé :
 *   1. Il se réveille et vote avec la meute (rejoint: ["loup"]) ; il compte comme un loup.
 *   2. Deux vies face aux loups (un Loup barbare peut le mordre) : sa première mort par morsure
 *      devient "vie_perdue".
 *   3. S'il est maire : avantVote() suspend chaque vote. Le meneur lui montre en secret la carte
 *      de l'accusé, puis il laisse la mort avoir lieu, ou, UNE fois par partie, relance le vote
 *      (pour sauver un loup, cette fois).
 *
 * POURQUOI pas d'appel de nuit à lui : decision() ne sert qu'au vote suspendu, quand il est maire.
 * POURQUOI memoire.relanceUtilisee peut déjà valoir true : un Beau Parleur devenu Faux Parleur
 * garde sa mémoire. Sans relance au départ (init), il en a une, comme le Beau Parleur.
 */
const fauxParleur: Role = {
  alias: "faux-parleur",
  titre: "Faux Parleur",
  image: "🎭",
  camp: "loups",
  hybride: true,
  description: "Un loup qui vote avec la meute et survit à la première attaque des loups. Maire, il voit la carte de chaque accusé avant sa mort et peut, une fois par partie, relancer le vote.",
  rejoint: ["loup"],

  init: () => ({ relanceUtilisee: false }),

  recevoir(tag, meta, r, partie, moi) {
    if (tag === "mort" && meta.cause === "mordu" && !partie.aTag(moi, "vie_perdue")) {
      return r.transformer("vie_perdue");
    }
  },

  avantVote(partie, moi) {
    if (partie.aTag(moi, "maire")) partie.mettreEnAttente("faux-parleur", moi);
  },

  decision(partie, moi) {
    const accuse = partie.joueur(partie.voteEnSuspens!);
    const peutRelancer = !moi.memoire.relanceUtilisee;
    return {
      message: `Montrez en secret au maire la carte de ${accuse.nom} : ${partie.titre(accuse.role)}.`
        + (peutRelancer ? " Il peut relancer le vote, une seule fois dans la partie." : " (Il a déjà relancé un vote.)"),
      choix: [
        { id: "executer", label: "Laisser le vote", cible: "aucune" },
        ...(peutRelancer ? [{ id: "relancer", label: "Relancer le vote", cible: "aucune" as const }] : [])
      ]
    };
  },

  agir(choix, partie, moi) {
    const relancer = choix.id === "relancer";
    if (relancer) moi.memoire.relanceUtilisee = true;
    partie.trancherLeVote(relancer);
  }
};

export default fauxParleur;
