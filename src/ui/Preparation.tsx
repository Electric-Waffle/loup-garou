import { useState } from "react";
import { distribuer } from "../moteur/distribution";
import { ROLES } from "../moteur/roles";
import type { Donnees } from "./stockage";
import { Table } from "./Table";
import { Visuel } from "./Visuel";

export function Preparation({
  donnees,
  modifier,
  lancer
}: {
  donnees: Donnees;
  modifier: (d: Donnees) => void;
  lancer: () => void;
}) {
  const [selection, setSelection] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const parId = new Map(donnees.joueurs.map(j => [j.id, j]));
  const table = donnees.table.filter(id => parId.has(id));
  const actifs = Object.entries(donnees.cartes).filter(([alias, c]) => c.active && ROLES[alias]).map(([a]) => a);
  const distributionValide = table.length > 0 && table.every(id => donnees.distribution[id]);

  const titre = (alias: string) => donnees.cartes[alias]?.titre || ROLES[alias].titre;
  const image = (alias: string) => donnees.cartes[alias]?.image || ROLES[alias].image;

  function basculer(id: string) {
    const assis = table.includes(id);
    modifier({ ...donnees, table: assis ? table.filter(t => t !== id) : [...table, id], distribution: {} });
  }

  // Clic sur un siège puis un autre : les deux joueurs échangent leur place (et gardent leur carte).
  function cliquerSiege(id: string) {
    if (!selection) return setSelection(id);
    if (selection !== id) {
      const t = [...table];
      const a = t.indexOf(selection), b = t.indexOf(id);
      [t[a], t[b]] = [t[b], t[a]];
      modifier({ ...donnees, table: t });
    }
    setSelection(null);
  }

  function lancerDistribution() {
    try {
      setErreur(null);
      modifier({ ...donnees, distribution: distribuer(table, actifs) });
    } catch (e) {
      setErreur((e as Error).message);
    }
  }

  const composition = Object.entries(
    table.reduce<Record<string, number>>((acc, id) => {
      const a = donnees.distribution[id];
      if (a) acc[a] = (acc[a] ?? 0) + 1;
      return acc;
    }, {})
  );

  return (
    <div className="page preparation">
      <aside className="panneau">
        <h2>Qui joue ?</h2>
        <ul className="liste-cochable">
          {donnees.joueurs.map(j => (
            <li key={j.id}>
              <label>
                <input type="checkbox" checked={table.includes(j.id)} onChange={() => basculer(j.id)} />
                <Visuel src={j.image} nom={j.nom} taille={28} />
                {j.nom}
              </label>
            </li>
          ))}
        </ul>
        <p className="aide">Clique sur deux sièges pour échanger leur place.</p>

        <div className="actions-colonne">
          <button className="bouton" onClick={lancerDistribution} disabled={table.length < 3}>
            {distributionValide ? "Redistribuer" : "Distribuer les cartes"}
          </button>
          <button className="bouton bouton-principal" onClick={lancer} disabled={!distributionValide}>
            Lancer la partie
          </button>
          <label className="champ-ligne">
            Débat (minutes)
            <input
              className="champ champ-court"
              type="number"
              min={1}
              max={20}
              value={donnees.dureeDebat}
              onChange={e => modifier({ ...donnees, dureeDebat: Math.max(1, Number(e.target.value) || 1) })}
            />
          </label>
        </div>
        {erreur && <p className="erreur">{erreur}</p>}
        {composition.length > 0 && (
          <p className="aide">
            Composition : {composition.map(([a, n]) => `${n} × ${titre(a)}`).join(", ")}
          </p>
        )}
      </aside>

      <Table
        centre={<span className="table-titre">{table.length} joueurs</span>}
        sieges={table.map(id => {
          const j = parId.get(id)!;
          const carte = donnees.distribution[id];
          return {
            id,
            classe: selection === id ? "siege-selection" : "",
            onClick: () => cliquerSiege(id),
            contenu: (
              <>
                <Visuel src={j.image} nom={j.nom} taille={44} />
                <span className="siege-nom">{j.nom}</span>
                {carte && (
                  <span className="siege-carte">
                    <Visuel src={image(carte)} nom={titre(carte)} taille={18} /> {titre(carte)}
                  </span>
                )}
              </>
            )
          };
        })}
      />
    </div>
  );
}
