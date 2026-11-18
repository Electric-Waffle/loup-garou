import type { Relique } from "../types";
import { estUneMorsureDeLoup } from "./outils";

/**
 * GRAAL DE SANG [loups] : la première victime des loups ne meurt pas : elle devient Loup-Garou.
 *
 * Déroulé :
 *   1. recevoir() : le premier tag « mort » par morsure de loup sur un joueur qui n'est PAS un loup ;
 *   2. r.transformer("devient", { role: "loup" }) remplace la mort par le changement de carte (même
 *      chemin que le Loup-démon qui possède un villageois) ; tags et mémoire sont conservés ;
 *   3. le converti est prévenu en privé ; le village, lui, voit seulement que personne n'est mort.
 *
 * POURQUOI sur le tag « mort » et pas sur « mordu » : à l'aube, la morsure a déjà passé tous les
 * obstacles (Salvateur, potion de la Sorcière, fête du Fêtard, seconde vie de l'Ancien). Seule une
 * VRAIE victime est convertie, et la relique n'est consommée que dans ce cas.
 * ATTENTION : l'oracle doit réveiller le nouveau loup et le présenter à la meute : le moteur change
 * sa carte, pas les yeux ouverts.
 */
const graalDeSang: Relique = {
  alias: "graal-de-sang",
  titre: "Coupe de Camazotz",
  image: "🍷",
  camp: "loups",
  description: "Dans la coupe de Camazotz, le dieu-chauve-souris du sacrifice, coule le sang des loups : leur première victime ne meurt pas, elle se transforme en Loup-Garou.",
  explication: [
    "La première fois que les loups tuent vraiment un joueur, il ne meurt pas : il boit à la coupe de Camazotz, devient un Loup-Garou ordinaire et rejoint la meute.",
    "Une morsure bloquée (Salvateur, Fêtard), soignée (Sorcière) ou absorbée (seconde vie de l'Ancien) ne compte pas : la relique attend une vraie victime.",
    "Le converti garde ses liens (amoureux, or…) mais perd son pouvoir de départ. Il est prévenu en secret ; pour le village, personne n'est mort cette nuit-là.",
    "Une seule fois par partie. Sans effet sur un joueur qui est déjà du camp des loups."
  ],

  recevoir(tag, meta, r, partie, joueur) {
    if (!estUneMorsureDeLoup(tag, meta)) return;
    if (partie.etatRelique.graalUtilise) return;
    if (partie.roleDe(joueur).camp === "loups") return;

    partie.etatRelique.graalUtilise = true;
    partie.ajouterInfo({ pour: joueur.id, texte: `La coupe de Camazotz te transforme : tu es maintenant ${partie.titre("loup")}. Rejoins la meute.` });
    return r.transformer("devient", { role: "loup" });
  }
};

export default graalDeSang;
