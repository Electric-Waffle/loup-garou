/* =====================================================================================
 *  App.tsx — le composant racine : garde l'état global et choisit la page à afficher
 * =====================================================================================
 *
 *  Ce que App garde en mémoire (son état) :
 *    - donnees : les réglages (joueurs, cartes, table, distribution), lus et sauvés via stockage.ts ;
 *    - page    : l'onglet affiché ("options", "preparation", "partie" ou "explications") ;
 *    - partie  : l'objet Partie du moteur pendant une partie, null sinon.
 *
 *  Déroulé :
 *    1. Premier rendu : les réglages sont chargés depuis le navigateur (useState(charger)).
 *    2. Les pages Options et Préparer modifient les réglages via la fonction `modifier`
 *       qu'on leur passe en props (c'est setDonnees).
 *    3. Chaque changement de réglages est sauvegardé automatiquement (useEffect).
 *    4. "Lancer la partie" (dans Préparer) appelle lancer() : création de l'objet Partie.
 *    5. PartieVue pilote la partie et appelle rafraichir() après chaque action.
 *    6. "Nouvelle partie" appelle quitter() : retour à la préparation.
 *
 *  PATTERN : état remonté ("lifting state up").
 *  POURQUOI : les réglages sont modifiés par Options, lus par Préparer, et utilisés ici au
 *  lancement. Le seul endroit qui voit les trois est leur parent commun : App. Les pages ne
 *  gardent donc pas leur propre copie des réglages, elles reçoivent `donnees` (pour lire) et
 *  `modifier` (pour demander un changement). Ce sont des composants "contrôlés".
 *  Alternative écartée : un Context React. Il évite de passer des props à travers de nombreux
 *  niveaux, mais ici il n'y a qu'un niveau (App → page) : les props restent plus lisibles.
 * ===================================================================================== */

import { useEffect, useReducer, useState } from "react";
import { Partie, type Apparence, type JoueurInitial } from "../moteur/partie";
import { Explications } from "./Explications";
import { Intro } from "./Intro";
import { FINS_CADRAN, type FinCadran } from "./Cadran";
import { Options } from "./Options";
import { PartieVue } from "./PartieVue";
import { Preparation } from "./Preparation";
import { cartesActives, charger, sauver, type CarteReglage, type Donnees } from "./stockage";

/** Les onglets possibles. Une union de chaînes : TypeScript refuse toute autre valeur. */
type Page = "options" | "preparation" | "partie" | "explications";

/* -------------------------------------------------------------------------------------
 *  Fonctions de préparation du lancement (en dehors du composant)
 *  POURQUOI en dehors : elles n'utilisent aucun état React, seulement leurs paramètres.
 *  Les sortir du composant les rend plus courtes à lire, testables seules, et évite de les
 *  recréer à chaque rendu.
 * ------------------------------------------------------------------------------------- */

/**
 * Extrait des réglages des cartes ce dont le moteur a besoin pour l'affichage :
 * le titre et l'image personnalisés de chaque carte (sans le champ "active").
 *
 * CONCEPT : transformation en chaîne objet → tableau → tableau → objet.
 *   cartes                 { loup: { titre: "Garou", image: "", active: true }, ... }
 *   Object.entries(...)    [ ["loup", { titre: "Garou", image: "", active: true }], ... ]
 *   .map(...)              [ ["loup", { titre: "Garou", image: "" }], ... ]
 *   Object.fromEntries(..) { loup: { titre: "Garou", image: "" }, ... }
 * Chaque étape crée un NOUVEL objet ou tableau : `cartes` n'est jamais modifié.
 */
function construireApparence(cartes: Record<string, CarteReglage>): Apparence {
  const pairesAliasReglage = Object.entries(cartes);

  // CONCEPT : ([alias, reglage]) est une déstructuration de la paire [clé, valeur]
  // directement dans les paramètres de la fonction.
  const pairesAliasApparence = pairesAliasReglage.map(([alias, reglage]) => {
    const apparenceDeLaCarte = { titre: reglage.titre, image: reglage.image };
    return [alias, apparenceDeLaCarte] as const;
  });

  const apparence: Apparence = Object.fromEntries(pairesAliasApparence);
  return apparence;
}

/**
 * Construit la liste des joueurs de la partie, dans l'ordre de la table, chacun avec
 * l'alias de la carte qu'il a reçue.
 *
 * FLUX : la table ne contient que des ids ; on va chercher le profil complet de chaque joueur
 * (nom, image) dans donnees.joueurs, et sa carte dans donnees.distribution.
 */
function construireJoueursDeLaPartie(donnees: Donnees): JoueurInitial[] {
  const joueursDeLaPartie = donnees.table.map(idJoueur => {
    const profil = donnees.joueurs.find(joueur => joueur.id === idJoueur)!;
    const aliasDeSaCarte = donnees.distribution[idJoueur];

    const joueurInitial: JoueurInitial = {
      id: idJoueur,
      nom: profil.nom,
      image: profil.image,
      role: aliasDeSaCarte
    };
    return joueurInitial;
  });
  return joueursDeLaPartie;
}

/** Classe CSS d'un onglet : "onglet", plus "onglet-actif" si c'est la page affichée. */
function classeOnglet(pageDeLOnglet: Page, pageAffichee: Page): string {
  if (pageDeLOnglet === pageAffichee) {
    return "onglet onglet-actif";
  }
  return "onglet";
}

/* -------------------------------------------------------------------------------------
 *  Le composant
 * ------------------------------------------------------------------------------------- */

export function App() {
  // CONCEPT : initialisation paresseuse. On passe la FONCTION charger, sans parenthèses.
  // React ne l'appelle qu'au tout premier rendu. Avec useState(charger()), la lecture du
  // localStorage serait refaite à CHAQUE rendu (puis ignorée), pour rien.
  const [donnees, setDonnees] = useState<Donnees>(charger);
  const [page, setPage] = useState<Page>("preparation");
  const [partie, setPartie] = useState<Partie | null>(null);
  // Cinématique à l'ouverture, sauf si le système demande de limiter les animations (accessibilité).
  const [intro, setIntro] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Boutons de test des fins du cadran : ouverts d'un clic sur le soleil du titre, en partie.
  // `n` augmente à chaque clic : rejouer la même fin relance son animation.
  const [testsOuverts, setTestsOuverts] = useState(false);
  const [finTest, setFinTest] = useState<{ fin: FinCadran; n: number } | null>(null);

  // PATTERN : rendu forcé.
  // POURQUOI : l'objet `partie` se modifie LUI-MÊME (this.file.shift(), joueur.tags.push()...).
  // Pour React, c'est toujours le même objet : il ne peut pas savoir qu'il a changé à
  // l'intérieur, donc il ne redessine pas. Ce compteur sert uniquement à prévenir React :
  // chaque appel à rafraichir() fait +1, l'état de App change, React redessine App et tous
  // ses enfants, et PartieVue relit les valeurs à jour de `partie`.
  // On ignore la valeur du compteur (la virgule au début de [, rafraichir]) : seule la
  // fonction nous intéresse.
  // ATTENTION : c'est un compromis. La règle à respecter : appeler rafraichir() après CHAQUE
  // méthode de `partie` qui change quelque chose (PartieVue le fait dans sa fonction agir()).
  // Les alternatives (moteur immuable, useSyncExternalStore) sont comparées dans la note
  // design-patterns, partie 17.
  const [, rafraichir] = useReducer((compteur: number) => compteur + 1, 0);

  // FLUX : chaque fois que `donnees` est remplacé par un nouvel objet (via setDonnees), React
  // redessine App, puis exécute cet effet, qui sauvegarde les réglages.
  // POURQUOI dans un useEffect et pas directement dans le corps du composant : le corps d'un
  // composant doit seulement CALCULER l'affichage. Les actions qui touchent le monde extérieur
  // (le stockage du navigateur, le réseau, un minuteur) vont dans un effet, exécuté APRÈS le rendu.
  // ATTENTION : les accolades autour de sauver(donnees) sont voulues. La version courte
  // `useEffect(() => sauver(donnees), ...)` RENVOIE le résultat de sauver(). React considère
  // ce qu'un effet renvoie comme sa fonction de nettoyage : si sauver() renvoyait un jour
  // quelque chose, React essaierait de l'appeler.
  useEffect(() => {
    sauver(donnees);
  }, [donnees]);

  /** Appelée par Preparation.tsx quand on clique sur "Lancer la partie". */
  function lancer() {
    const apparence = construireApparence(donnees.cartes);
    const joueurs = construireJoueursDeLaPartie(donnees);

    // Le moteur prend le relais : le constructeur prépare les joueurs et commence la nuit 1.
    // POURQUOI passer toutes les cartes actives : le moteur en déduit les cartes hors jeu
    // (Loup savant, Voyante, cartes fantômes) en retirant celles qui ont été distribuées.
    const nouvellePartie = new Partie(joueurs, {
      apparence: apparence,
      cartesActives: cartesActives(donnees),
      cartesFantomes: donnees.cartesFantomes
    });

    setPartie(nouvellePartie);
    setPage("partie");
  }

  /** Appelée par PartieVue.tsx quand on clique sur "Nouvelle partie". */
  function quitter() {
    setPartie(null);       // la partie terminée est oubliée
    setFinTest(null);
    setPage("preparation");
  }

  // CONCEPT : rendu conditionnel avec &&. En JSX, `condition && <Composant />` affiche le
  // composant si la condition est vraie, et rien sinon (false n'est pas affiché par React).
  // ATTENTION : avec un NOMBRE, ça ne marche pas pareil : `0 && <X />` affiche "0".
  // Ici, les conditions sont des booléens ou un objet (partie), donc pas de souci.
  if (intro) return <Intro fin={() => setIntro(false)} />;

  // POURQUOI une classe selon la page : au téléphone, la page de partie tient exactement dans
  // l'écran (table en haut, panneau en bas, aucun défilement de la page). Les autres pages
  // défilent normalement. Voir « Téléphone » dans styles.css.
  const classeApp = page === "partie" ? "app app-partie" : "app";

  return (
    <div className={classeApp}>
      <header className="barre">
        <h1>
          {page === "partie" ? (
            <button className="logo logo-bouton" onClick={() => setTestsOuverts(!testsOuverts)}
              aria-label="Tester les animations de fin" aria-expanded={testsOuverts}>☀️</button>
          ) : (
            <span className="logo" aria-hidden="true">☀️</span>
          )}{" "}
          {/* Le nom s'efface sur un petit écran pour laisser la place aux onglets ; le soleil reste. */}
          <span className="barre-nom">Paqari</span>
        </h1>
        <nav>
          <button className={classeOnglet("options", page)} onClick={() => setPage("options")}>
            Options
          </button>
          <button className={classeOnglet("preparation", page)} onClick={() => setPage("preparation")}>
            Préparer
          </button>
          {/* L'onglet n'existe que pendant une partie. */}
          {partie && (
            <button className={classeOnglet("partie", page)} onClick={() => setPage("partie")}>
              Partie
            </button>
          )}
          {/* En dernier : tout à droite de la barre. Consultable à tout moment, même en partie. */}
          <button className={classeOnglet("explications", page)} onClick={() => setPage("explications")}>
            Explications
          </button>
        </nav>
      </header>

      {/* Outil de test : rejoue une fin sur le cadran. Purement visuel, la partie n'est pas touchée. */}
      {page === "partie" && testsOuverts && (
        <div className="tests-fins">
          <span>Tester une fin :</span>
          {FINS_CADRAN.map(fin => (
            <button key={fin} className="bouton" onClick={() => setFinTest({ fin, n: (finTest?.n ?? 0) + 1 })}>
              {fin}
            </button>
          ))}
          <button className="bouton" onClick={() => setFinTest(null)}>Revenir à la partie</button>
        </div>
      )}

      <main>
        {page === "options" && (
          <Options donnees={donnees} modifier={setDonnees} />
        )}

        {page === "preparation" && (
          <Preparation donnees={donnees} modifier={setDonnees} lancer={lancer} />
        )}

        {/* Les deux conditions sont nécessaires : TypeScript sait ainsi que `partie` n'est
            pas null quand on la passe à PartieVue. */}
        {page === "partie" && partie && (
          <PartieVue partie={partie} rafraichir={rafraichir} dureeDebat={donnees.dureeDebat} ficheAuClic={donnees.ficheAuClic} quitter={quitter} finTest={finTest} />
        )}

        {page === "explications" && <Explications donnees={donnees} />}
      </main>
    </div>
  );
}
