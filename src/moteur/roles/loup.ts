import type { Role } from "../types";

// Le loup DONNE "mordu". Il ne sait rien du Salvateur ni de l'Ancien :
// c'est le receveur qui décidera du sort de la morsure.
const loup: Role = {
  alias: "loup",
  titre: "Loup-Garou",
  image: "🐺",
  camp: "loups",
  description: "Chaque nuit, les loups désignent ensemble une victime.",
  priorite: 20,
  appelNuit: true,

  decision: () => ({
    message: "Les loups se réveillent et choisissent une victime.",
    choix: [{ id: "devorer", label: "Dévorer", cible: "un_joueur" }]
  }),

  agir: (choix) => ({
    donner: [{ tag: "mordu", a: choix.cibles[0] }]
  })
};

export default loup;
