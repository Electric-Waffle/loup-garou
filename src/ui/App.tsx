import { useEffect, useReducer, useState } from "react";
import { Partie, type Apparence } from "../moteur/partie";
import { Options } from "./Options";
import { PartieVue } from "./PartieVue";
import { Preparation } from "./Preparation";
import { charger, sauver, type Donnees } from "./stockage";

type Page = "options" | "preparation" | "partie";

export function App() {
  const [donnees, setDonnees] = useState<Donnees>(charger);
  const [page, setPage] = useState<Page>("preparation");
  const [partie, setPartie] = useState<Partie | null>(null);
  // Le moteur modifie son état en place : on force simplement un nouveau rendu après chaque action.
  const [, rafraichir] = useReducer((x: number) => x + 1, 0);

  useEffect(() => sauver(donnees), [donnees]);

  function lancer() {
    const apparence: Apparence = Object.fromEntries(
      Object.entries(donnees.cartes).map(([alias, c]) => [alias, { titre: c.titre, image: c.image }])
    );
    const joueurs = donnees.table.map(id => {
      const j = donnees.joueurs.find(p => p.id === id)!;
      return { id, nom: j.nom, image: j.image, role: donnees.distribution[id] };
    });
    setPartie(new Partie(joueurs, { apparence }));
    setPage("partie");
  }

  function quitter() {
    setPartie(null);
    setPage("preparation");
  }

  return (
    <div className="app">
      <header className="barre">
        <h1>🐺 Loup-Garou</h1>
        <nav>
          <button className={`onglet ${page === "options" ? "onglet-actif" : ""}`} onClick={() => setPage("options")}>
            Options
          </button>
          <button className={`onglet ${page === "preparation" ? "onglet-actif" : ""}`} onClick={() => setPage("preparation")}>
            Préparer
          </button>
          {partie && (
            <button className={`onglet ${page === "partie" ? "onglet-actif" : ""}`} onClick={() => setPage("partie")}>
              Partie en cours
            </button>
          )}
        </nav>
      </header>

      <main>
        {page === "options" && <Options donnees={donnees} modifier={setDonnees} />}
        {page === "preparation" && <Preparation donnees={donnees} modifier={setDonnees} lancer={lancer} />}
        {page === "partie" && partie && (
          <PartieVue partie={partie} rafraichir={rafraichir} dureeDebat={donnees.dureeDebat} quitter={quitter} />
        )}
      </main>
    </div>
  );
}
