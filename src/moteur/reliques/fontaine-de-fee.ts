import type { Relique } from "../types";

/**
 * FONTAINE DE FÉE [village] : le premier villageois éliminé par le village est réincarné en simple
 * villageois. Il survit, mais perd son pouvoir.
 *
 * Déroulé :
 *   1. recevoir() : la première mort par VOTE d'un joueur du camp du village est interceptée ;
 *   2. r.transformer("devient", …) remplace la mort par le tag « devient » (le même chemin que le
 *      Rat qui devient Rat-garou) : sa carte devient Villageois, ses tags et son rôle de maire restent ;
 *   3. le village est prévenu, puis la relique est consommée (état dans partie.etatRelique).
 *
 * POURQUOI recevoir() et pas reagir() : reagir() n'est appelé qu'APRÈS que la mort est acceptée, trop
 * tard pour l'empêcher. Mourir accepte le tag : le chagrin des amoureux et le tir du Chasseur seraient
 * déjà partis.
 * ATTENTION : le vote est alors « transformé », pas « accepté » : partie.executerLeVote() le traite
 * comme un vote sans éliminé (les crochets apresVote reçoivent undefined).
 */
const fontaineDeFee: Relique = {
  alias: "fontaine-de-fee",
  titre: "Fontaine de fée",
  image: "⛲",
  camp: "village",
  description: "Le premier villageois éliminé par le village est réincarné en simple villageois : il survit, mais perd son pouvoir.",
  explication: [
    "Le premier joueur du camp du village que le village élimine ne meurt pas : la fontaine le réincarne en simple Villageois.",
    "Il perd donc son pouvoir, mais il garde ses liens et son titre de maire s'il en avait un.",
    "Une seule fois par partie. Le village est prévenu de la réincarnation, sans qu'on dise quelle carte il avait.",
    "Pour la suite du jour, ce vote compte comme « personne n'est éliminé »."
  ],

  recevoir(tag, meta, r, partie, joueur) {
    if (tag !== "mort" || meta.cause !== "vote") return;
    if (partie.etatRelique.fontaineUtilisee) return;
    if (partie.roleDe(joueur).camp !== "village") return;

    partie.etatRelique.fontaineUtilisee = true;
    partie.ajouterInfo({
      pour: "tous",
      texte: `La fontaine de fée réincarne ${joueur.nom} en simple villageois : il survit, mais il a perdu son pouvoir.`
    });
    return r.transformer("devient", { role: "villageois" });
  }
};

export default fontaineDeFee;
