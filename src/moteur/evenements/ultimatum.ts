import type { Evenement } from "../types";

/**
 * ULTIMATUM : si le village n'élimine pas un loup aujourd'hui, le maire meurt.
 *
 * « Pas un loup » : un joueur hors du camp des loups (le Fou compris), ou personne.
 * FLUX : partie.voter() appelle apresVote() une fois le vote définitif ; un vote racheté avec l'or
 * n'est pas un résultat, seul le second vote compte.
 * ATTENTION : la mort du maire passe par donnerTag comme les autres : chagrin des amoureux, or,
 * et l'invulnérabilité du Loup vampire (seul le vote le tue) s'appliquent.
 * Si le maire est lui-même l'éliminé, il est déjà mort : joueursAvecTag (vivants) ne le trouve plus.
 */
const ultimatum: Evenement = {
  alias: "ultimatum",
  titre: "Jugement d'Inti",
  image: "⚖️",
  description: "Inti exige justice : si le village n'élimine pas un loup aujourd'hui, le maire meurt.",
  explication: [
    "Inti exige justice : si le village n'élimine pas un loup aujourd'hui, le maire meurt.",
    "« Pas un loup » : un joueur hors du camp des loups (le Fou compris), personne, ou un joueur sauvé des flammes par le Loup salamandre.",
    "Un vote racheté avec l'or ne compte pas : seul le vote final décide.",
    "La mort du maire suit les règles habituelles : chagrin des amoureux, tir du Chasseur, invulnérabilité du Loup vampire."
  ],
  rappelVote: "Jugement d'Inti : si le village n'élimine pas un loup, le maire meurt.",

  apresVote(partie, elimine) {
    const unLoupEstTombe = elimine !== undefined && partie.roleDe(elimine).camp === "loups";
    if (unLoupEstTombe) return;

    const maire = partie.joueursAvecTag("maire")[0];
    if (!maire) return;
    return {
      donner: [{ tag: "mort", a: maire.id, meta: { cause: "ultimatum" } }],
      infos: [{ pour: "tous", texte: `Le village n'a pas éliminé de loup : ${maire.nom}, le maire, subit le jugement d'Inti.` }]
    };
  }
};

export default ultimatum;
