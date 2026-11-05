import type { OptionChoix, Role } from "../types";

// La sorcière REGARDE (qui est mordu) ET DONNE ("sauve" ou "empoisonne").
const sorciere: Role = {
  alias: "sorciere",
  titre: "Sorcière",
  image: "🧪",
  camp: "village",
  description: "Une potion de vie et une potion de mort, chacune utilisable une fois.",
  priorite: 130,
  appelNuit: true,

  init: () => ({ potionVie: true, potionMort: true }),

  decision(partie, moi) {
    const mordus = partie.joueursAvecTag("mordu");
    const choix: OptionChoix[] = [];
    if (moi.memoire.potionVie && mordus.length) choix.push({ id: "sauver", label: "Potion de vie", cible: "un_mordu" });
    if (moi.memoire.potionMort) choix.push({ id: "tuer", label: "Potion de mort", cible: "un_autre" });
    choix.push({ id: "rien", label: "Ne rien faire", cible: "aucune" });

    const victimes = mordus.map(j => j.nom).join(", ") || "personne";
    return {
      message: `La sorcière se réveille. Victime(s) de la nuit : ${victimes}.`,
      choix
    };
  },

  // Marché noir (événement) : les deux potions reviennent. Le rôle décide seul de ce que veut
  // dire « recharger » ; l'événement ne touche jamais sa memoire.
  recevoir(tag, _meta, r, _partie, moi) {
    if (tag !== "recharge") return;
    moi.memoire.potionVie = true;
    moi.memoire.potionMort = true;
    return r.consommer("potions rechargées");
  },

  agir(choix, _partie, moi) {
    switch (choix.id) {
      case "sauver":
        moi.memoire.potionVie = false;
        return { donner: [{ tag: "sauve", a: choix.cibles[0] }] };

      case "tuer":
        moi.memoire.potionMort = false;
        return { donner: [{ tag: "empoisonne", a: choix.cibles[0] }] };

      default:
        return {};
    }
  }
};

export default sorciere;
