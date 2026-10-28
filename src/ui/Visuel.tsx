import type { ChangeEvent } from "react";
import { lireImage } from "./stockage";

/** Affiche une image (URL / data-URL), un emoji, ou à défaut l'initiale. */
export function Visuel({ src, nom, taille = 48 }: { src?: string; nom: string; taille?: number }) {
  const style = { width: taille, height: taille, fontSize: taille * 0.55 };
  if (src && /^(data:|https?:|blob:|\/)/.test(src)) {
    return <img className="visuel" src={src} alt={nom} style={style} />;
  }
  return (
    <span className="visuel visuel-texte" style={style} aria-label={nom}>
      {src || nom.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Bouton "changer l'image" qui renvoie une data-URL réduite. */
export function ChoixImage({ onImage }: { onImage: (dataUrl: string) => void }) {
  async function choisir(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (fichier) onImage(await lireImage(fichier));
  }
  return (
    <label className="bouton bouton-discret">
      Image…
      <input type="file" accept="image/*" hidden onChange={choisir} />
    </label>
  );
}
