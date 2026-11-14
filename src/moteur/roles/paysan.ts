import { appliquerResultat } from "../donner";
import type { Role } from "../types";

/**
 * PAYSAN : il ne meurt pas sans se défendre.
 *
 * Déroulé :
 *   - Voté par le village : décision URGENTE, il assomme 2 joueurs. Ils reçoivent "enchante"
 *     (le même effet que la Fée : la nuit suivante, ils ne font rien). Posé le jour, le tag
 *     couvre la nuit et disparaît à la fin de l'aube.
 *   - Dévoré par les loups : tous ceux qui votent avec les loups reçoivent "blesse".
 *     La carte Loup lit ce tag et ne propose aucune victime la nuit suivante.
 *
 * ATTENTION : la mort par les loups arrive PENDANT l'aube (mordu → mort). Un tag qui expire
 * à "aube" serait effacé à la fin de cette même aube ; d'où "aube_suivante".
 */
const paysan: Role = {
  alias: "paysan",
  titre: "Paysan",
  image: "🪓",
  camp: "village",
  description: "Un cultivateur des terrasses, solide comme la montagne. Voté, il assomme 2 joueurs qui dorment la nuit suivante. Dévoré, il blesse les loups : ils ne tuent personne la nuit suivante.",
  explication: [
    "Il ne meurt pas sans se défendre.",
    "Éliminé par le vote du village, il assomme 2 joueurs : ils ne feront rien la nuit suivante, comme s'ils étaient enchantés par la Fée.",
    "Dévoré par les loups, il les blesse tous : la nuit suivante, la meute ne mange personne.",
    "Le Loup barbare, qui ne chasse pas avec la meute, n'est pas blessé."
  ],

  reagir(tag, meta, partie, moi) {
    if (tag !== "mort") return;

    if (meta.cause === "vote") {
      partie.mettreEnAttente("paysan", moi);
      return;
    }

    if (meta.cause === "mordu" && meta.source === "loup") {
      if (partie.estEmpeche(moi, "paysan")) return; // sans pouvoir, il ne blesse pas les loups
      // POURQUOI appliquerResultat : reagir ne renvoie rien, mais on garde le chemin commun (journal, recevoir).
      const blessures = partie.porteursDe("loup").map(loup => ({
        tag: "blesse",
        a: loup.id,
        meta: { expire: "aube_suivante" as const }
      }));
      appliquerResultat(partie, { donner: blessures }, moi.role);
    }
  },

  decision: (_partie, moi) => ({
    message: `${moi.nom}, le paysan, est éliminé : il assomme deux joueurs avant de mourir.`,
    choix: [{ id: "assommer", label: "Assommer", cible: "deux_joueurs" }]
  }),

  agir: (choix) => ({
    donner: choix.cibles.map(id => ({ tag: "enchante", a: id, meta: { expire: "aube" as const } }))
  })
};

export default paysan;
