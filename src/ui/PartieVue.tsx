import { useEffect, useState } from "react";
import { nbCibles, type Partie } from "../moteur/partie";
import type { Entree, OptionChoix } from "../moteur/types";
import { Table } from "./Table";
import { Visuel } from "./Visuel";

const TAGS: Record<string, string> = {
  mordu: "🩸 mordu",
  protege: "🛡️ protégé",
  protege_hier: "⏳ protégé hier",
  empoisonne: "☠️ empoisonné",
  amoureux: "💘 amoureux",
  vie_perdue: "💔 vie perdue",
  mort: "⚰️ mort"
};

const CAUSES: Record<string, string> = {
  mordu: "dévoré par les loups",
  poison: "empoisonné",
  chagrin: "mort de chagrin",
  chasseur: "abattu par le chasseur",
  vote: "éliminé par le village"
};

const PHASES: Record<string, string> = {
  nuit: "Nuit",
  aube: "Aube",
  evenement: "Événement",
  debat: "Débat",
  vote: "Vote",
  resultat_vote: "Résultat du vote",
  fin: "Fin de partie"
};

export function PartieVue({
  partie,
  rafraichir,
  dureeDebat,
  quitter
}: {
  partie: Partie;
  rafraichir: () => void;
  dureeDebat: number;
  quitter: () => void;
}) {
  const courante = partie.decisionCourante();
  const [option, setOption] = useState<OptionChoix | null>(null);
  const [cibles, setCibles] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  // Nouvelle décision → on réinitialise la sélection.
  const cle = `${partie.journal.length}-${partie.phase}`;
  useEffect(() => {
    setOption(null);
    setCibles([]);
    setErreur(null);
  }, [cle]);

  function agir(fn: () => void) {
    try {
      fn();
      rafraichir();
    } catch (e) {
      setErreur((e as Error).message);
    }
  }

  const possibles = option && courante ? partie.ciblesPossibles(option.cible, courante.moi).map(j => j.id) : [];
  const attendu = nbCibles(option?.cible);
  const enVote = partie.phase === "vote";

  function cliquerJoueur(id: string) {
    if (enVote) return agir(() => partie.voter(id));
    if (!possibles.includes(id)) return;
    setCibles(c => (c.includes(id) ? c.filter(x => x !== id) : [...c, id].slice(-attendu)));
  }

  function choisirOption(o: OptionChoix) {
    if (nbCibles(o.cible) === 0) return agir(() => partie.jouer({ id: o.id, cibles: [] }));
    setOption(o);
    setCibles([]);
  }

  const estNuit = partie.phase === "nuit";

  return (
    <div className={`page partie ${estNuit ? "theme-nuit" : "theme-jour"}`}>
      <Table
        centre={
          <div className="table-centre">
            <span className="table-tour">{estNuit ? "🌙" : "☀️"} Tour {partie.tour}</span>
            <span className="table-titre">{PHASES[partie.phase]}</span>
          </div>
        }
        sieges={partie.joueurs.map(j => {
          const porteur = courante?.porteurs.some(p => p.id === j.id);
          const cliquable = (enVote && j.vivant) || possibles.includes(j.id);
          return {
            id: j.id,
            classe: [
              !j.vivant && "siege-mort",
              porteur && "siege-actif",
              cliquable && "siege-cible",
              cibles.includes(j.id) && "siege-selection"
            ].filter(Boolean).join(" "),
            onClick: cliquable ? () => cliquerJoueur(j.id) : undefined,
            contenu: (
              <>
                <Visuel src={j.image} nom={j.nom} taille={44} />
                <span className="siege-nom">{j.nom}</span>
                <span className="siege-carte">
                  <Visuel src={partie.image(j.role)} nom={partie.titre(j.role)} taille={16} /> {partie.titre(j.role)}
                </span>
                {j.tags.length > 0 && (
                  <span className="siege-tags">
                    {j.tags.map(t => (
                      <span key={t.type} className={`tag tag-${t.type}`}>{TAGS[t.type] ?? t.type}</span>
                    ))}
                  </span>
                )}
              </>
            )
          };
        })}
      />

      <aside className="panneau">
        {courante ? (
          <section className={`decision ${courante.urgente ? "decision-urgente" : ""}`}>
            <div className="decision-carte">
              <Visuel src={partie.image(courante.alias)} nom={partie.titre(courante.alias)} taille={72} />
              <div>
                <h2>{partie.titre(courante.alias)}</h2>
                <p className="aide">{courante.porteurs.map(p => p.nom).join(", ")}</p>
              </div>
            </div>
            {courante.decision.message && <p>{courante.decision.message}</p>}

            <div className="actions">
              {courante.decision.choix.map(o => (
                <button
                  key={o.id}
                  className={`bouton ${option?.id === o.id ? "bouton-principal" : ""}`}
                  onClick={() => choisirOption(o)}
                >
                  {o.label}
                </button>
              ))}
              {!courante.urgente && (
                <button className="bouton bouton-discret" onClick={() => agir(() => partie.passer())}>Passer</button>
              )}
            </div>

            {option && attendu > 0 && (
              <>
                <p className="aide">
                  Choisis {attendu === 2 ? "deux joueurs" : "un joueur"} sur la table ou ici :
                </p>
                <div className="actions">
                  {possibles.map(id => (
                    <button
                      key={id}
                      className={`bouton bouton-petit ${cibles.includes(id) ? "bouton-principal" : ""}`}
                      onClick={() => cliquerJoueur(id)}
                    >
                      {partie.joueur(id).nom}
                    </button>
                  ))}
                </div>
                <button
                  className="bouton bouton-principal bouton-large"
                  disabled={cibles.length !== attendu}
                  onClick={() => agir(() => partie.jouer({ id: option.id, cibles }))}
                >
                  Valider
                </button>
              </>
            )}
          </section>
        ) : (
          <EtapeDeJour partie={partie} agir={agir} dureeDebat={dureeDebat} quitter={quitter} />
        )}

        {erreur && <p className="erreur">{erreur}</p>}

        <Journal partie={partie} />
      </aside>
    </div>
  );
}

function EtapeDeJour({
  partie,
  agir,
  dureeDebat,
  quitter
}: {
  partie: Partie;
  agir: (fn: () => void) => void;
  dureeDebat: number;
  quitter: () => void;
}) {
  switch (partie.phase) {
    case "nuit":
      return (
        <section>
          <h2>Fin de la nuit</h2>
          <p>Toutes les cartes ont joué.</p>
          <button className="bouton bouton-principal bouton-large" onClick={() => agir(() => partie.leverLeJour())}>
            Le village se réveille
          </button>
        </section>
      );

    case "aube":
    case "resultat_vote": {
      const morts = partie.morts();
      return (
        <section>
          <h2>{partie.phase === "aube" ? "Rapport de la nuit" : "Résultat du vote"}</h2>
          {morts.length === 0 ? (
            <p>Personne n'est mort.</p>
          ) : (
            <ul className="rapport">
              {morts.map(({ joueur, cause }) => (
                <li key={joueur.id}>
                  <strong>{joueur.nom}</strong> ({partie.titre(joueur.role)}) — {CAUSES[cause ?? ""] ?? cause}
                </li>
              ))}
            </ul>
          )}
          <button
            className="bouton bouton-principal bouton-large"
            onClick={() => agir(() => (partie.phase === "aube" ? partie.ouvrirEvenement() : partie.nuitSuivante()))}
          >
            {partie.phase === "aube" ? "Événement du jour" : "La nuit tombe"}
          </button>
        </section>
      );
    }

    case "evenement":
      return (
        <section>
          <h2>Événement</h2>
          {partie.evenement && (
            <div className="decision-carte">
              <Visuel src={partie.evenement.image} nom={partie.evenement.titre} taille={56} />
              <div>
                <h3>{partie.evenement.titre}</h3>
                <p className="aide">{partie.evenement.description}</p>
              </div>
            </div>
          )}
          {partie.infosPubliques().map((t, i) => <p key={i} className="info-publique">{t}</p>)}
          <button className="bouton bouton-principal bouton-large" onClick={() => agir(() => partie.ouvrirDebat())}>
            Ouvrir le débat
          </button>
        </section>
      );

    case "debat":
      return (
        <section>
          <h2>Débat</h2>
          <Minuteur minutes={dureeDebat} />
          <button className="bouton bouton-principal bouton-large" onClick={() => agir(() => partie.ouvrirVote())}>
            Passer au vote
          </button>
        </section>
      );

    case "vote":
      return (
        <section>
          <h2>Vote</h2>
          <p>Clique sur le joueur éliminé par le village.</p>
          <button className="bouton bouton-discret" onClick={() => agir(() => partie.voter(null))}>
            Personne n'est éliminé
          </button>
        </section>
      );

    case "fin":
      return (
        <section className="fin">
          <h2>🏆 {partie.vainqueur}</h2>
          <p>La partie est terminée après {partie.tour} tour(s).</p>
          <button className="bouton bouton-principal bouton-large" onClick={quitter}>Nouvelle partie</button>
        </section>
      );
  }
}

function Minuteur({ minutes }: { minutes: number }) {
  const [reste, setReste] = useState(minutes * 60);
  const [actif, setActif] = useState(true);

  useEffect(() => {
    if (!actif || reste <= 0) return;
    const t = setInterval(() => setReste(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [actif, reste <= 0]);

  const mm = String(Math.floor(reste / 60)).padStart(2, "0");
  const ss = String(reste % 60).padStart(2, "0");
  return (
    <div className={`minuteur ${reste === 0 ? "minuteur-fini" : ""}`}>
      <span className="minuteur-temps">{mm}:{ss}</span>
      <div className="actions">
        <button className="bouton bouton-petit" onClick={() => setActif(a => !a)}>{actif ? "Pause" : "Reprendre"}</button>
        <button className="bouton bouton-petit" onClick={() => setReste(r => r + 60)}>+1 min</button>
      </div>
    </div>
  );
}

function decrire(e: Entree, partie: Partie): string {
  const nom = e.joueur ? partie.joueur(e.joueur).nom : "";
  switch (e.type) {
    case "recu": return `${nom} reçoit « ${e.tag} »${e.cause ? ` (${e.cause})` : ""}`;
    case "bloque": return `${nom} bloque « ${e.tag} » : ${e.raison}`;
    case "consomme": return `${nom} consomme « ${e.tag} » : ${e.raison}`;
    case "transforme": return `${nom} transforme « ${e.tag} » en « ${e.en} »`;
    case "redirige": return `« ${e.tag} » redirigé de ${nom} vers ${partie.joueur(e.vers!).nom}`;
    case "retire": return `« ${e.tag} » retiré de ${nom}`;
    case "info": return `${nom ? `🔒 pour ${nom} : ` : "📢 "}${e.texte}`;
    case "phase": return `— ${PHASES[e.texte ?? ""] ?? e.texte} —`;
    default: return e.texte ?? e.type;
  }
}

function Journal({ partie }: { partie: Partie }) {
  const entrees = partie.journal.filter(e => e.tour === partie.tour || e.phase === "fin");
  return (
    <details className="journal" open>
      <summary>Journal du meneur (tour {partie.tour})</summary>
      <ol>
        {entrees.map((e, i) => (
          <li key={i} className={`entree entree-${e.type}`} style={{ paddingLeft: `${(e.profondeur ?? 0) * 1.2}rem` }}>
            {decrire(e, partie)}
          </li>
        ))}
      </ol>
    </details>
  );
}
