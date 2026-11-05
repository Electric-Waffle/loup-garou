import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Hors ligne : on installe le service worker (public/sw.js), qui garde une copie du jeu.
// POURQUOI seulement en production (build) : en `npm run dev`, Vite sert les fichiers à la volée
// et la copie gardée par le service worker masquerait tes modifications.
// "./sw.js" est relatif : sur GitHub Pages, il couvre /loup-garou/ et rien d'autre.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}
