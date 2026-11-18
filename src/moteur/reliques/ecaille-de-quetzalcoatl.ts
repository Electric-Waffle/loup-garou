import type { Relique } from "../types";
import { estUnLoup, estUneMorsureDeLoup } from "./outils";

/**
 * ÉCAILLE DE QUETZALCOATL [village] : la première victime des loups ne meurt pas : elle devient
 * immunisée contre eux pour toute la partie, comme si le Salvateur la protégeait chaque nuit.
 *
 * Déroulé :
 *   1. recevoir(« mort ») : la première vraie victime d'une morsure de loup (même condition que la
 *      Coupe de Camazotz) reçoit le tag « ecaille » à la place de la mort ;
 *   2. recevoir(« mordu ») : toute morsure de loup sur un joueur « ecaille » est bloquée ;
 *   3. Partie.aTagDe() fait croire aux loups qui lient ou regardent (Loup amoureux, Succube, Voyante,
 *      Hypnotiseur) et au Skinwalker que le joueur est protégé par le Salvateur : « H24 », en continu.
 *
 * POURQUOI pas un vrai tag « protege » du Salvateur : aube.ts le retire chaque matin
 * (« protégé hier »). Une immunité permanente a besoin de son propre tag.
 * ATTENTION : seules les morsures de loups sont arrêtées. Le poison, le Chasseur, le vote ou la peste
 * tuent toujours un joueur « ecaille » : « immunisé aux loups », pas immortel.
 */
const ecailleDeKukulkan: Relique = {
  alias: "ecaille-de-quetzalcoatl",
  titre: "Écaille de Kukulkan",
  image: "🐉",
  camp: "village",
  description: "Kukulkan, le serpent à plumes, couvre de ses écailles la première victime des loups : elle ne meurt pas, et leur est immunisée pour le reste de la partie.",
  explication: [
    "La première fois que les loups tuent vraiment un joueur, il ne meurt pas : une écaille de Kukulkan le recouvre et le protège désormais des loups, comme si le Salvateur le protégeait toutes les nuits.",
    "Plus aucune morsure ne l'atteint, et les loups qui lient ou regardent (Loup amoureux, Loup succube, Loup voyante, Loup hypnotiseur) échouent sur lui, comme face au Salvateur.",
    "Il reste vulnérable au reste : poison, Chasseur, vote du village, peste…",
    "Une morsure bloquée, soignée ou absorbée par la seconde vie de l'Ancien ne compte pas comme « première victime ».",
    "Il est prévenu en secret. Une seule écaille par partie."
  ],

  recevoir(tag, meta, r, partie, joueur) {
    if (estUneMorsureDeLoup(tag, meta) && !partie.etatRelique.ecailleDonnee && partie.roleDe(joueur).camp !== "loups") {
      partie.etatRelique.ecailleDonnee = true;
      partie.ajouterInfo({ pour: joueur.id, texte: "Une écaille de Kukulkan te recouvre : les loups ne pourront plus jamais te mordre." });
      return r.transformer("ecaille");
    }
    if (tag === "mordu" && partie.aTag(joueur, "ecaille") && estUnLoup(meta.source)) {
      return r.bloquer("écaille de Kukulkan : immunisé contre les loups");
    }
  }
};

export default ecailleDeKukulkan;
