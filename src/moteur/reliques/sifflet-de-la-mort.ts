import { appliquerResultat } from "../donner";
import type { Relique } from "../types";
import { estUneMorsureDeLoup } from "./outils";

/** Combien de victimes des loups déclenchent le sifflet. */
const VICTIMES_CONCERNEES = 2;

/**
 * SIFFLET DE LA MORT [loups] : les voisins des deux premières victimes des loups ne peuvent pas
 * parler pendant le vote.
 *
 * Déroulé :
 *   1. reagir() : chaque mort par morsure de loup est comptée (état dans partie.etatRelique) ;
 *   2. pour les deux premières, les voisins VIVANTS de la victime reçoivent le tag « muet » ;
 *   3. le tag dure jusqu'à l'aube suivante (« aube_suivante », comme les blessures du Paysan : posé
 *      pendant l'aube, il couvre tout le vote du jour). partie.rappelsDuVote() le rappelle à l'oracle.
 *
 * POURQUOI un tag « muet » et pas « silence » : « silence » est celui du Loup hypnotiseur, et son
 * rappel dit « ne pas compter le vote ». Ici c'est la PAROLE qui est coupée, pas la voix.
 * ATTENTION : les voisins sont ceux de la table au moment de la mort. Si l'un d'eux est mort aussi
 * cette nuit-là, c'est le vivant suivant qui est atteint (voir Partie.voisinsVivants).
 */
const siffletDeLaMort: Relique = {
  alias: "sifflet-de-la-mort",
  titre: "Sifflet d'Ah Puch",
  image: "💀",
  camp: "loups",
  description: "Le sifflet d'Ah Puch, seigneur de la mort chez les Mayas, glace les voisins des deux premières victimes des loups : ils ne peuvent pas parler pendant le vote.",
  explication: [
    "Pour chacune des deux premières victimes des loups, les deux joueurs vivants assis juste à côté d'elle entendent le sifflet d'Ah Puch : ils ne peuvent pas parler pendant le vote du jour.",
    "Ils peuvent voter, mais plus se défendre ni accuser. Le village est prévenu de qui est muet, et pas du pourquoi.",
    "Après la deuxième victime, le sifflet se tait : il n'agit plus.",
    "Seules comptent les victimes d'une morsure de loup qui meurent vraiment : une morsure bloquée ou soignée ne compte pas."
  ],

  reagir(tag, meta, partie, joueur) {
    if (!estUneMorsureDeLoup(tag, meta)) return;
    const victimesDejaComptees: number = partie.etatRelique.victimes ?? 0;
    if (victimesDejaComptees >= VICTIMES_CONCERNEES) return;
    partie.etatRelique.victimes = victimesDejaComptees + 1;

    const voisins = partie.voisinsVivants(joueur);
    if (voisins.length === 0) return;
    const noms = voisins.map(voisin => voisin.nom).join(" et ");
    appliquerResultat(partie, {
      donner: voisins.map(voisin => ({ tag: "muet", a: voisin.id, meta: { expire: "aube_suivante" as const } })),
      infos: [{ pour: "tous", texte: `Le sifflet d'Ah Puch retentit : ${noms} ne pourr${voisins.length > 1 ? "ont" : "a"} pas parler pendant le vote.` }]
    }, "relique:sifflet-de-la-mort");
  }
};

export default siffletDeLaMort;
