/* =====================================================================================
 *  Visuel.tsx — deux petits composants réutilisables autour des images
 * =====================================================================================
 *
 *  - <Visuel>     : affiche "l'image" d'une carte ou d'un joueur, quelle que soit sa forme
 *                   (fichier, emoji, rien du tout).
 *  - <ChoixImage> : un bouton qui ouvre le sélecteur de fichiers et renvoie l'image réduite.
 *
 *  Utilisés par Options.tsx, Preparation.tsx et PartieVue.tsx.
 *
 *  PATTERN : composants de présentation.
 *  POURQUOI : ils ne savent rien du jeu. Ils reçoivent ce qu'ils doivent afficher en props
 *  et le renvoient en JSX. Changer l'affichage des images partout dans l'application = changer
 *  ce seul fichier.
 *  RÉUTILISABLE : les deux composants peuvent être copiés tels quels dans un autre projet
 *  React (il faut juste reprendre lireImage() de stockage.ts avec ChoixImage).
 * ===================================================================================== */

import type { ChangeEvent } from "react";
import { lireImage } from "./stockage";

/**
 * Reconnaît une valeur qui désigne un VRAI fichier image, par son début :
 *   ^           début du texte
 *   data:       une image écrite en texte (ce que renvoie lireImage)
 *   https?:     une adresse web, "http:" ou "https:" (le "?" rend le "s" facultatif)
 *   blob:       une image temporaire créée par le navigateur
 *   \/          un chemin qui commence par "/" (un fichier du site)
 * Tout le reste (un emoji comme "🐺", un texte) n'est PAS une image.
 */
const DEBUT_D_UNE_ADRESSE_D_IMAGE = /^(data:|https?:|blob:|\/)/;

/**
 * Affiche une image, un emoji, ou à défaut l'initiale du nom, dans un rond de `taille` pixels.
 *
 * @param src    l'image : une adresse d'image, un emoji, ou rien (undefined / "")
 * @param nom    sert de texte alternatif, et d'initiale si src est vide
 * @param taille côté du rond en pixels (48 par défaut)
 */
export function Visuel({ src, nom, taille = 48 }: { src?: string; nom: string; taille?: number }) {
  // Le même style pour les deux cas, pour que l'image et l'emoji aient exactement la même taille.
  // fontSize à 55 % de la taille : l'emoji ou l'initiale remplit le rond sans déborder.
  const style = { width: taille, height: taille, fontSize: taille * 0.55 };

  // Cas 1 : src est l'adresse d'un vrai fichier image → une balise <img>.
  const estUneAdresseDImage = src !== undefined && src !== "" && DEBUT_D_UNE_ADRESSE_D_IMAGE.test(src);
  if (estUneAdresseDImage) {
    return <img className="visuel" src={src} alt={nom} style={style} />;
  }

  // Cas 2 : src est un emoji ou un texte → on l'affiche tel quel.
  // Cas 3 : src est vide → on affiche la première lettre du nom, en majuscule.
  let texteAffiche: string;
  if (src) {
    texteAffiche = src;
  } else {
    const premiereLettre = nom.slice(0, 1);
    texteAffiche = premiereLettre.toUpperCase();
  }

  // aria-label : un lecteur d'écran lira le nom, et non "🐺" ou "A".
  return (
    <span className="visuel visuel-texte" style={style} aria-label={nom}>
      {texteAffiche}
    </span>
  );
}

/**
 * Bouton "Image…" : ouvre le sélecteur de fichiers, réduit l'image choisie,
 * puis la transmet au parent via `onImage`.
 *
 * @param onImage fonction du parent, appelée avec la data-URL de l'image réduite
 *
 * PATTERN : le composant ne sait pas OÙ l'image va être rangée (carte ? joueur ?).
 * Il délègue cette décision au parent via la fonction `onImage` reçue en props :
 * c'est le parent qui décide quoi en faire (voir Options.tsx).
 */
export function ChoixImage({ onImage }: { onImage: (dataUrl: string) => void }) {
  /**
   * Appelée par React quand l'utilisateur a choisi un fichier.
   * CONCEPT : une fonction "async" peut servir de gestionnaire d'événement. React ne l'attend
   * pas : il l'appelle et passe à la suite. La fin de la fonction (après le await) s'exécute
   * plus tard, quand l'image est prête.
   */
  async function choisir(evenement: ChangeEvent<HTMLInputElement>) {
    const champFichier = evenement.target;

    // files peut être null (aucune sélection) ; "?." évite l'erreur et donne undefined.
    const fichier = champFichier.files?.[0];

    // POURQUOI vider le champ : un <input type="file"> ne déclenche onChange que si la valeur
    // CHANGE. Sans cette ligne, choisir deux fois de suite le même fichier (pour l'appliquer
    // à un autre joueur, par exemple) ne ferait rien la deuxième fois.
    champFichier.value = "";

    // L'utilisateur a fermé le sélecteur sans rien choisir.
    if (!fichier) {
      return;
    }

    const imageReduite = await lireImage(fichier);
    onImage(imageReduite);
    // ATTENTION : si lireImage échoue (fichier qui n'est pas une image), le await lève une
    // erreur qui n'est attrapée nulle part : elle apparaît dans la console et l'image ne
    // change pas. Pour afficher un message, il faudrait un try/catch ici.
  }

  // POURQUOI un <label> qui contient un <input hidden> : le vrai champ fichier du navigateur
  // est difficile à styliser. On le cache, et on stylise le <label> comme un bouton. Cliquer
  // sur un <label> active automatiquement le champ qu'il contient : le sélecteur s'ouvre.
  return (
    <label className="bouton bouton-discret">
      Image…
      <input type="file" accept="image/*" hidden onChange={choisir} />
    </label>
  );
}
