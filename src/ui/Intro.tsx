import { useEffect, useRef } from "react";

/**
 * L'écran de la cinématique d'ouverture : un canvas plein écran, un voile pour les fondus,
 * et un bouton « Passer ». Un clic n'importe où, Échap, Entrée ou Espace passent aussi.
 *
 * PATTERN : chargement différé (import() dynamique).
 * POURQUOI : three.js pèse lourd. Avec import("./intro3d"), Vite le met dans un fichier à part,
 * téléchargé pendant l'intro : le reste du jeu n'attend pas, et ne grossit pas.
 * Si WebGL est indisponible (vieux téléphone), l'erreur part dans catch → on passe l'intro.
 */
export function Intro({ fin }: { fin: () => void }) {
  const toile = useRef<HTMLCanvasElement>(null);
  const voile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let arreter = () => {};
    let annule = false; // ATTENTION : en StrictMode, React monte, démonte puis remonte : le 1er import arrive trop tard
    import("./intro3d")
      .then(module => {
        if (!annule) arreter = module.lancerIntro(toile.current!, voile.current!, fin);
      })
      .catch(fin);
    const touche = (evenement: KeyboardEvent) => {
      if (["Escape", "Enter", " "].includes(evenement.key)) fin();
    };
    window.addEventListener("keydown", touche);
    return () => {
      annule = true;
      arreter();
      window.removeEventListener("keydown", touche);
    };
  }, []);

  return (
    <div className="intro" onClick={fin}>
      <canvas ref={toile} />
      <div ref={voile} className="intro-voile" />
      <button className="intro-passer" onClick={fin}>Passer ›</button>
    </div>
  );
}
