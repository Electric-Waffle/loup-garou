import type { OptionChoix, Role } from "../types";

// La sorcière REGARDE (qui est mordu) ET DONNE ("sauve" ou "empoisonne").
const sorciere: Role = {
  alias: "sorciere",
  titre: "Sorcière",
  image: "🧪",
  camp: "village",
  description: "Une potion de vie et une potion de mort, chacune utilisable une fois.",
  explication: [
    "Elle a deux potions pour toute la partie : une potion de vie et une potion de mort.",
    "Chaque nuit, elle joue la dernière (rang 130) : le meneur lui montre qui a été mordu.",
    "Potion de vie : elle soigne un joueur mordu, qui ne mourra pas à l'aube. Elle ne voit ni un joueur déjà condamné (Rat qui a mordu), ni une victime dont la morsure a été bloquée.",
    "Potion de mort : elle empoisonne n'importe quel autre joueur, qui meurt à l'aube.",
    "Une seule action par nuit : soigner, empoisonner, ou ne rien faire.",
    "L'événement Marché noir lui rend ses deux potions."
  ],
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
