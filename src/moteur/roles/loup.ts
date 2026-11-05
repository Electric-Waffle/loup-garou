import type { Role } from "../types";

// Le loup DONNE "mordu". Il ne sait rien du Salvateur ni de l'Ancien :
// c'est le receveur qui décidera du sort de la morsure.
const loup: Role = {
  alias: "loup",
  titre: "Loup-Garou",
  image: "🐺",
  camp: "loups",
  description: "Chaque nuit, les loups désignent ensemble une victime.",
  priorite: 120,
  appelNuit: true,

  decision: (partie) => {
    // Blessés par le Paysan qu'ils ont dévoré : ils se réveillent, mais ne chassent pas.
    // POURQUOI ici et pas avec "enchante" : seule la chasse est bloquée, pas les autres cartes
    // de ceux qui votent avec les loups (Loup savant, Loup succube).
    const tousBlesses = partie.porteursDe("loup").every(j => partie.aTag(j, "blesse"));
    if (tousBlesses) {
      return { message: "Les loups se réveillent, blessés par le paysan : ils ne chassent pas cette nuit.", choix: [] };
    }
    // Horrifiés par l'Aberration : même règle (tous les porteurs), mais pour toujours.
    const tousHorrifies = partie.porteursDe("loup").every(j => partie.aTag(j, "horrifie"));
    if (tousHorrifies) {
      return { message: "Les loups se réveillent, horrifiés par l'aberration : ils ne peuvent plus manger.", choix: [] };
    }
    return {
      message: "Les loups se réveillent et choisissent une victime.",
      choix: [{ id: "devorer", label: "Dévorer", cible: "un_joueur" }]
    };
  },

  agir: (choix) => ({
    donner: [{ tag: "mordu", a: choix.cibles[0] }]
  })
};

export default loup;
