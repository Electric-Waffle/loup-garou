import { appliquerResultat } from "../donner";
import type { Partie } from "../partie";
import type { Joueur, Role } from "../types";

/**
 * RAT : s'il est dévoré, il choisit en silence entre répandre la peste et rejoindre les loups.
 *
 * Déroulé :
 *   1. Les loups le mordent → reagir("mordu") ouvre une décision URGENTE (comme le Chasseur),
 *      jouée avant la Sorcière.
 *   2a. « Mordre » : il devient "agonisant" (mort certaine à l'aube, invisible pour la Sorcière)
 *       et un participant au vote des loups, tiré au hasard, attrape la "peste" (mort 3 nuits plus tard).
 *   2b. « Se transformer » : "sauve" annule la morsure, puis "devient" change sa carte en rat-garou.
 *   3. S'il est éliminé par le vote, le maire attrape la peste.
 *
 * POURQUOI aucune info : personne, ni loups ni village, ne doit savoir ce que le Rat a choisi.
 * Les loups le devineront seuls : le Rat meurt au matin, ou il est encore vivant.
 */
const rat: Role = {
  alias: "rat",
  titre: "Rat",
  image: "🐀",
  camp: "village",
  hybride: true,
  description: "Un rat des greniers à maïs. Dévoré par les loups, il mord un loup qui mourra de la peste 3 nuits plus tard, ou rejoint la meute. Éliminé par le village, il contamine le maire.",
  explication: [
    "Un villageois qui ne se laisse pas dévorer sans réagir.",
    "Mordu par les loups, il choisit en silence, juste après leur tour : mordre un loup, ou rejoindre la meute.",
    "Mordre : il meurt à l'aube, sans que la Sorcière puisse le sauver, et un des loups attrape la peste : il mourra 3 nuits plus tard.",
    "Rejoindre la meute : la morsure est annulée, et il devient Rat-garou.",
    "Éliminé par le vote du village, il contamine le maire, qui attrape la peste.",
    "Personne ne sait ce qu'il a choisi : les loups le devineront en voyant s'il est encore en vie.",
    "Carte hybride : à sa mort, l'oracle annonce « Rat », sans jamais révéler le camp que le joueur avait choisi."
  ],

  reagir(tag, meta, partie, moi) {
    if (tag === "mordu") partie.mettreEnAttente("rat", moi);
    if (tag === "mort" && meta.cause === "vote") contaminerLeMaire(partie, moi);
  },

  // Pas de « ne rien faire » : une décision urgente doit être jouée, et le Rat doit choisir.
  decision: (_partie, moi) => ({
    message: `Les loups se rendorment. ${moi.nom}, le rat, a été dévoré : touchez-lui la tête pour qu'il choisisse en silence.`,
    choix: [
      { id: "mordre", label: "Mordre un loup", cible: "aucune" },
      { id: "transformer", label: "Rejoindre la meute", cible: "aucune" }
    ]
  }),

  agir(choix, partie, moi) {
    if (choix.id === "mordre") {
      // FLUX : tous ceux qui votent avec les loups (y compris un rôle qui « rejoint » leur carte).
      const loupMordu = partie.auHasard(partie.porteursDe("loup"));
      const donner = [{ tag: "agonisant", a: moi.id }];
      if (loupMordu) donner.push({ tag: "peste", a: loupMordu.id });
      return { donner };
    }
    if (choix.id === "transformer") {
      // ATTENTION : l'ordre compte. "sauve" retire la morsure tant que c'est encore un Rat ;
      // sans lui, le rat-garou mourrait à l'aube de la morsure qu'il vient de survivre.
      return {
        donner: [
          { tag: "sauve", a: moi.id },
          { tag: "devient", a: moi.id, meta: { role: "rat-garou" } }
        ]
      };
    }
  }
};

/**
 * Le maire vivant attrape la peste.
 * POURQUOI appliquerResultat et pas un return : reagir() ne renvoie rien, il agit directement
 * (comme le Chasseur appelle mettreEnAttente). On passe quand même par le chemin commun.
 * ATTENTION : loup-garou n'a qu'un maire vivant ; si le Rat était le maire, il est déjà mort
 * et joueursAvecTag (vivants seulement) ne le trouve plus.
 */
function contaminerLeMaire(partie: Partie, moi: Joueur): void {
  const maire = partie.joueursAvecTag("maire")[0];
  if (!maire) return;
  appliquerResultat(partie, { donner: [{ tag: "peste", a: maire.id }] }, moi.role);
}

export default rat;
