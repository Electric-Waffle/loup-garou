/* =====================================================================================
 *  PartieVue.tsx — l'écran de jeu du meneur
 * =====================================================================================
 *
 *  À gauche : la table, avec chaque joueur, sa carte et ses tags.
 *  À droite : un panneau qui affiche, selon le moment :
 *    - la DÉCISION en cours (une carte appelée la nuit, ou une décision urgente comme le
 *      Chasseur), avec ses options et le choix des cibles ;
 *    - sinon, l'ÉTAPE DU JOUR correspondant à la phase (rapport, événement, débat, vote, fin) ;
 *    - toujours, le journal du meneur.
 *
 *  Organisation du fichier :
 *    1. dictionnaires de libellés (TAGS, CAUSES, PHASES) ;
 *    2. selectionApresClic() : la règle de sélection des cibles (fonction pure) ;
 *    3. <PartieVue>   : le composant principal ;
 *    4. <EtapeDeJour> : le panneau quand aucune décision n'est en cours ;
 *    5. <Minuteur>    : le compte à rebours du débat ;
 *    6. decrire() et <Journal> : l'affichage du journal.
 *
 *  FLUX d'un tour de carte (détaillé dans la note fonctionnement-du-code, parties 4 et 6) :
 *    1. à chaque rendu, on demande au moteur : partie.decisionCourante() ;
 *    2. le meneur clique une option (choisirOption), puis ses cibles (cliquerJoueur) ;
 *       ces choix sont gardés dans l'état local `option` et `cibles` ;
 *    3. "Valider" appelle agir(() => partie.jouer(...)) : le moteur applique le choix,
 *       puis rafraichir() demande à React de redessiner ;
 *    4. au rendu suivant, decisionCourante() renvoie la carte suivante, et le useEffect
 *       sur `cle` vide la sélection.
 *
 *  POURQUOI ce composant ne contient aucune règle du jeu : il ne fait que LIRE l'état de
 *  `partie` et APPELER ses méthodes. Toute la logique est dans src/moteur.
 * ===================================================================================== */

import { useEffect, useState } from "react";
import { nbCibles, type Partie } from "../moteur/partie";
import type { Entree, Joueur, OptionChoix } from "../moteur/types";
import { Table, type Siege } from "./Table";
import { Visuel } from "./Visuel";

/* =====================================================================================
 *  1. Libellés
 *  POURQUOI des dictionnaires plutôt que des if : ajouter un tag ou une cause de mort,
 *  c'est ajouter UNE ligne ici, sans toucher au code d'affichage.
 * ===================================================================================== */

/** Libellé affiché sur la table pour chaque tag. Un tag absent d'ici s'affiche avec son nom brut. */
const TAGS: Record<string, string> = {
  mordu: "🩸 mordu",
  protege: "🛡️ protégé",
  protege_hier: "⏳ protégé hier",
  empoisonne: "☠️ empoisonné",
  amoureux: "💘 amoureux",
  vie_perdue: "💔 vie perdue",
  agonisant: "🐀 agonisant",
  peste: "🦠 peste (4 aubes)",
  peste_active: "🦠 peste (3 aubes)",
  peste_imminente: "🦠 peste (2 aubes)",
  peste_mortelle: "🦠 peste (dernière aube)",
  maire: "🎖️ maire",
  enchante: "✨ enchanté",
  lie: "🎭 lié",
  or: "💰 or",
  blesse: "🩹 blessé",
  renforce: "🧱 maison renforcée",
  invulnerable: "🦇 invulnérable",
  pur: "🕊️ pur",
  impur: "🩸 impur",
  mort: "⚰️ mort"
};

/** Explication affichée dans le rapport pour chaque cause de mort (meta.cause du tag "mort"). */
const CAUSES: Record<string, string> = {
  mordu: "dévoré par les loups",
  poison: "empoisonné",
  chagrin: "mort de chagrin",
  chasseur: "abattu par le chasseur",
  vote: "éliminé par le village",
  peste: "emporté par la peste",
  isole: "dernier de la meute, dévoré par la nuit"
};

/**
 * Nom affiché de chaque phase.
 * Typé Record<string, string> (et non Record<Phase, string>) parce que decrire() le lit
 * aussi avec le texte d'une entrée du journal, qui est une simple chaîne.
 */
const PHASES: Record<string, string> = {
  nuit: "Nuit",
  aube: "Aube",
  evenement: "Événement",
  election: "Élection du maire",
  debat: "Débat",
  vote: "Vote",
  resultat_vote: "Résultat du vote",
  fin: "Fin de partie"
};

/* =====================================================================================
 *  2. La règle de sélection des cibles
 * ===================================================================================== */

/**
 * Calcule la nouvelle liste de cibles sélectionnées après un clic sur un joueur.
 *
 * @param selectionActuelle les ids déjà sélectionnés
 * @param idClique          l'id du joueur qu'on vient de cliquer
 * @param nombreAttendu     combien de cibles l'option demande (1, ou 2 pour Cupidon)
 * @returns une NOUVELLE liste ; selectionActuelle n'est jamais modifiée
 *
 * Exemples avec nombreAttendu = 1 :
 *   []        + clic B → [B]
 *   [A]       + clic B → [B]        (B remplace A)
 *   [B]       + clic B → []         (re-cliquer désélectionne)
 * Exemples avec nombreAttendu = 2 :
 *   [A]       + clic B → [A, B]
 *   [A, B]    + clic C → [B, C]     (le plus ancien sort)
 *   [A, B]    + clic A → [B]
 *
 * POURQUOI une fonction à part, en dehors du composant : elle ne dépend que de ses
 * paramètres (fonction "pure"). On peut la lire et la tester sans React.
 */
function selectionApresClic(selectionActuelle: string[], idClique: string, nombreAttendu: number): string[] {
  const dejaSelectionne = selectionActuelle.includes(idClique);

  // Cas 1 : le joueur était déjà sélectionné → on le retire.
  if (dejaSelectionne) {
    const sansCeJoueur = selectionActuelle.filter(id => id !== idClique);
    return sansCeJoueur;
  }

  // Cas 2 : nouveau joueur → on l'ajoute à la fin de la liste...
  const avecCeJoueur = [...selectionActuelle, idClique];

  // ... puis on ne garde que les `nombreAttendu` DERNIERS.
  // CONCEPT : slice() avec un nombre négatif compte depuis la fin.
  //   ["A", "B", "C"].slice(-2) → ["B", "C"]
  //   ["A", "B"].slice(-1)      → ["B"]
  // ATTENTION : slice(-0) vaut slice(0), qui garde TOUT le tableau. Avec nombreAttendu = 0,
  // la limite ne jouerait donc plus. Ça n'arrive pas ici : on ne peut cliquer une cible que
  // si l'option choisie en demande au moins une (voir cliquerJoueur).
  const lesPlusRecents = avecCeJoueur.slice(-nombreAttendu);
  return lesPlusRecents;
}

/* =====================================================================================
 *  3. Le composant principal
 * ===================================================================================== */

/**
 * @param partie     l'objet du moteur. Il se modifie lui-même quand on appelle ses méthodes.
 * @param rafraichir fonction de App.tsx qui force un nouveau rendu (voir App.tsx)
 * @param dureeDebat durée du débat en minutes, depuis les réglages
 * @param quitter    fonction de App.tsx qui ferme la partie
 */
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
  // La décision à prendre maintenant, ou undefined s'il n'y en a pas.
  // FLUX : cette question est reposée à CHAQUE rendu. Il n'y a pas de boucle "pour chaque
  // carte" : c'est la succession des rendus (un par clic) qui fait avancer la nuit.
  const courante = partie.decisionCourante();

  // État local : ce que le meneur est en train de sélectionner pour la décision en cours.
  const [option, setOption] = useState<OptionChoix | null>(null); // l'option cliquée (Dévorer, Protéger...)
  const [cibles, setCibles] = useState<string[]>([]);             // les ids des joueurs sélectionnés
  const [erreur, setErreur] = useState<string | null>(null);      // le message si le moteur refuse

  // PATTERN : réinitialisation par clé.
  // POURQUOI : quand une carte a fini de jouer, sa sélection ne doit pas déborder sur la
  // carte suivante. On fabrique une "clé" qui change forcément dès que le moteur avance :
  // chaque action ajoute au moins une ligne au journal, et chaque changement de phase change
  // la phase. Dès que la clé change, l'effet vide la sélection.
  // FLUX : clic "Valider" → le moteur ajoute des lignes au journal → rafraichir() → nouveau
  // rendu avec une nouvelle clé → React exécute l'effet après le rendu → les setState
  // déclenchent un DEUXIÈME rendu, avec une sélection vide.
  // Alternative plus idiomatique en React : extraire le panneau de décision dans un
  // sous-composant et lui donner key={cle}. Quand la key change, React recrée le composant
  // avec un état neuf, en un seul rendu. Voir la note design-patterns, partie 19.
  const cle = `${partie.journal.length}-${partie.phase}`;
  useEffect(() => {
    setOption(null);
    setCibles([]);
    setErreur(null);
  }, [cle]);

  /**
   * Exécute une action du moteur, puis demande à React de redessiner.
   * TOUTES les méthodes de `partie` qui changent quelque chose passent par ici.
   *
   * @param action une fonction qui appelle le moteur, ex. () => partie.jouer(choix)
   *
   * POURQUOI recevoir une fonction plutôt que le résultat : on veut exécuter l'appel
   * DANS le try, pour attraper l'erreur si le moteur refuse.
   * ATTENTION : cette fonction n'a rien à voir avec role.agir() des fichiers de rôles,
   * malgré le même nom.
   */
  function agir(action: () => void) {
    try {
      action();
      // Le moteur s'est modifié en place : sans cet appel, l'écran resterait figé.
      rafraichir();
    } catch (e) {
      // Le moteur lève une Error quand une action est interdite (ex. lever le jour alors
      // qu'une carte doit encore jouer). On affiche son message.
      const message = (e as Error).message;
      setErreur(message);
    }
  }

  /* -----------------------------------------------------------------------------------
   *  Valeurs dérivées pour la décision en cours
   * ----------------------------------------------------------------------------------- */

  // Les ids des joueurs qu'on peut cibler avec l'option choisie.
  // Vide tant qu'aucune option n'est choisie, ou s'il n'y a pas de décision en cours.
  let possibles: string[] = [];
  if (option !== null && courante !== undefined) {
    // Les porteurs servent à la règle de l'Arlequin (seulement quand la carte n'a qu'un porteur).
    const joueursCiblables = partie.ciblesPossibles(option.cible, courante.moi, courante.porteurs);
    possibles = joueursCiblables.map(joueur => joueur.id);
  }

  // Combien de cibles l'option choisie demande (0 si aucune option).
  // option?.cible : si option est null, l'expression vaut undefined, et nbCibles(undefined) = 0.
  const attendu = nbCibles(option?.cible);

  const enVote = partie.phase === "vote";
  const enElection = partie.phase === "election";
  const estNuit = partie.phase === "nuit";

  /* -----------------------------------------------------------------------------------
   *  Clics
   * ----------------------------------------------------------------------------------- */

  /**
   * Clic sur un joueur (un siège de la table, ou un bouton de la liste de cibles).
   * Pendant le vote : élimine directement ce joueur.
   * Sinon : l'ajoute à la sélection ou l'en retire.
   */
  function cliquerJoueur(idJoueur: string) {
    if (enVote) {
      agir(() => partie.voter(idJoueur));
      return;
    }
    if (enElection) {
      agir(() => partie.elire(idJoueur));
      return;
    }

    // Garde-fou : on ignore un clic sur un joueur qui ne peut pas être ciblé.
    if (!possibles.includes(idJoueur)) {
      return;
    }

    // CONCEPT : setState avec une FONCTION. React l'appelle avec la valeur la plus récente
    // de `cibles` et range ce qu'elle renvoie.
    // POURQUOI ne pas écrire setCibles(selectionApresClic(cibles, ...)) : `cibles` est la
    // valeur capturée au moment du rendu (une closure). Si deux mises à jour arrivaient
    // avant le rendu suivant, la seconde partirait d'une valeur périmée et écraserait la
    // première. La forme fonction part toujours de la dernière valeur.
    setCibles(selectionActuelle => selectionApresClic(selectionActuelle, idJoueur, attendu));
  }

  /**
   * Clic sur une option de la décision (Dévorer, Potion de vie, Ne rien faire...).
   * Sans cible : l'option est jouée immédiatement.
   * Avec cible(s) : on la retient, et le meneur doit maintenant choisir les cibles.
   */
  function choisirOption(optionCliquee: OptionChoix) {
    const nombreDeCibles = nbCibles(optionCliquee.cible);

    if (nombreDeCibles === 0) {
      agir(() => partie.jouer({ id: optionCliquee.id, cibles: [] }));
      return;
    }

    setOption(optionCliquee);
    setCibles([]); // changer d'option repart d'une sélection vide
  }

  /** Bouton "Valider" : envoie l'option et les cibles au moteur. */
  function valider() {
    // Le bouton n'est cliquable que si une option est choisie ; ce test rassure TypeScript.
    if (option === null) {
      return;
    }
    const choix = { id: option.id, cibles: cibles };
    agir(() => partie.jouer(choix));
  }

  /* -----------------------------------------------------------------------------------
   *  Préparation de l'affichage
   * ----------------------------------------------------------------------------------- */

  /**
   * Classes CSS d'un siège, selon l'état du joueur.
   * Ex. "siege-actif siege-cible" pour un loup qui peut être ciblé pendant son tour.
   */
  function classesDuSiege(joueur: Joueur, estPorteur: boolean, estCliquable: boolean): string {
    const classes: string[] = [];
    if (!joueur.vivant) {
      classes.push("siege-mort");      // grisé
    }
    if (estPorteur) {
      classes.push("siege-actif");     // c'est sa carte qui joue : bordure dorée
    }
    if (estCliquable) {
      classes.push("siege-cible");     // peut être choisi : bordure en pointillés
    }
    if (cibles.includes(joueur.id)) {
      classes.push("siege-selection"); // déjà choisi
    }
    return classes.join(" ");
  }

  // Un siège par joueur, morts compris (ils restent visibles, grisés).
  const sieges: Siege[] = partie.joueurs.map(joueur => {
    // Le joueur porte-t-il la carte qui joue en ce moment ? (plusieurs loups : tous surlignés)
    // CONCEPT : some() renvoie true dès qu'UN élément vérifie la condition.
    // courante?. : s'il n'y a pas de décision en cours, l'expression vaut undefined.
    const estPorteur = courante?.porteurs.some(porteur => porteur.id === joueur.id) ?? false;

    // Cliquable pendant le vote (s'il est vivant), ou s'il fait partie des cibles possibles.
    // L'élection du maire se joue comme le vote : un clic sur un joueur vivant.
    const cliquablePourLeVote = (enVote || enElection) && joueur.vivant;
    const cliquableCommeCible = possibles.includes(joueur.id);
    const estCliquable = cliquablePourLeVote || cliquableCommeCible;

    // Sans onClick, Table affiche le siège comme un simple <div> non cliquable.
    let auClic: (() => void) | undefined = undefined;
    if (estCliquable) {
      auClic = () => cliquerJoueur(joueur.id);
    }

    const siege: Siege = {
      id: joueur.id,
      classe: classesDuSiege(joueur, estPorteur, estCliquable),
      onClick: auClic,
      contenu: (
        <>
          <Visuel src={joueur.image} nom={joueur.nom} taille={44} />
          <span className="siege-nom">{joueur.nom}</span>
          {/* Le meneur voit toutes les cartes : c'est l'écran du maître du jeu. */}
          <span className="siege-carte">
            <Visuel src={partie.image(joueur.role)} nom={partie.titre(joueur.role)} taille={16} /> {partie.titre(joueur.role)}
          </span>
          {joueur.tags.length > 0 && (
            <span className="siege-tags">
              {/* key={tag.type} : un joueur ne porte jamais deux fois le même tag
                  (r.accepter() retire le doublon), le type est donc une clé unique. */}
              {joueur.tags.map(tag => (
                <span key={tag.type} className={`tag tag-${tag.type}`}>{TAGS[tag.type] ?? tag.type}</span>
              ))}
            </span>
          )}
        </>
      )
    };
    return siege;
  });

  const classesPage = estNuit ? "page partie theme-nuit" : "page partie theme-jour";
  const iconeMoment = estNuit ? "🌙" : "☀️";

  return (
    <div className={classesPage}>
      <Table
        centre={
          <div className="table-centre">
            <span className="table-tour">{iconeMoment} Tour {partie.tour}</span>
            <span className="table-titre">{PHASES[partie.phase]}</span>
          </div>
        }
        sieges={sieges}
      />

      <aside className="panneau">
        {/* Une décision est en cours : on l'affiche. Sinon : l'étape du jour. */}
        {courante ? (
          <section className={courante.urgente ? "decision decision-urgente" : "decision"}>
            <div className="decision-carte">
              <Visuel src={partie.image(courante.alias)} nom={partie.titre(courante.alias)} taille={72} />
              <div>
                <h2>{partie.titre(courante.alias)}</h2>
                {/* Les noms des joueurs qui portent cette carte. */}
                <p className="aide">{courante.porteurs.map(porteur => porteur.nom).join(", ")}</p>
              </div>
            </div>

            {courante.decision.message && <p>{courante.decision.message}</p>}

            {/* Les options proposées par role.decision(). */}
            <div className="actions">
              {courante.decision.choix.map(optionProposee => {
                const estChoisie = option?.id === optionProposee.id;
                return (
                  <button
                    key={optionProposee.id}
                    className={estChoisie ? "bouton bouton-principal" : "bouton"}
                    onClick={() => choisirOption(optionProposee)}
                  >
                    {optionProposee.label}
                  </button>
                );
              })}

              {/* POURQUOI pas de "Passer" pour une décision urgente : la partie ne peut pas
                  avancer tant qu'elle n'est pas jouée. Le rôle doit donc proposer lui-même une
                  option "ne rien faire" (comme "Ne pas tirer" pour le Chasseur). */}
              {!courante.urgente && (
                <button className="bouton bouton-discret" onClick={() => agir(() => partie.passer())}>
                  Passer
                </button>
              )}
            </div>

            {/* Choix des cibles : seulement quand l'option choisie en demande. */}
            {option && attendu > 0 && (
              <>
                <p className="aide">
                  Choisis {attendu === 2 ? "deux joueurs" : "un joueur"} sur la table ou ici :
                </p>
                <div className="actions">
                  {possibles.map(idJoueur => {
                    const estSelectionne = cibles.includes(idJoueur);
                    return (
                      <button
                        key={idJoueur}
                        className={estSelectionne ? "bouton bouton-petit bouton-principal" : "bouton bouton-petit"}
                        onClick={() => cliquerJoueur(idJoueur)}
                      >
                        {partie.joueur(idJoueur).nom}
                      </button>
                    );
                  })}
                </div>
                {/* Le moteur revérifie le nombre de cibles dans jouer(), mais on évite
                    d'envoyer un choix incomplet. */}
                <button
                  className="bouton bouton-principal bouton-large"
                  disabled={cibles.length !== attendu}
                  onClick={valider}
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

/* =====================================================================================
 *  4. Le panneau quand aucune décision n'est en cours
 * ===================================================================================== */

/**
 * Affiche l'étape correspondant à la phase actuelle et le bouton qui passe à la suivante.
 * Chaque bouton appelle UNE méthode de transition du moteur (voir la note
 * fonctionnement-du-code, partie 10).
 *
 * @param agir la fonction de PartieVue : exécute l'action puis rafraîchit l'écran
 *
 * POURQUOI un switch qui renvoie directement du JSX : chaque phase a son propre écran,
 * et TypeScript vérifie que partie.phase ne peut prendre que les valeurs du type Phase.
 */
function EtapeDeJour({
  partie,
  agir,
  dureeDebat,
  quitter
}: {
  partie: Partie;
  agir: (action: () => void) => void;
  dureeDebat: number;
  quitter: () => void;
}) {
  switch (partie.phase) {
    // La file de la nuit est vide (sinon une décision serait affichée à la place).
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

    // Les deux phases affichent la même chose : la liste des morts depuis le début de la phase.
    case "aube":
    case "resultat_vote":
      return <RapportDesMorts partie={partie} agir={agir} />;

    case "evenement": {
      const evenement = partie.evenement;
      // Les infos publiques du tour (ex. la rumeur), affichées l'une sous l'autre.
      const infosPubliques = partie.infosPubliques();
      return (
        <section>
          <h2>Événement</h2>
          {evenement && (
            <div className="decision-carte">
              <Visuel src={evenement.image} nom={evenement.titre} taille={56} />
              <div>
                <h3>{evenement.titre}</h3>
                <p className="aide">{evenement.description}</p>
              </div>
            </div>
          )}
          {/* key={index} est acceptable ici : la liste ne change pas d'ordre pendant la phase. */}
          {infosPubliques.map((texte, index) => (
            <p key={index} className="info-publique">{texte}</p>
          ))}
          {/* POURQUOI le moteur décide (suiteDeLEvenement) : « faut-il un maire ? » est une règle
              du jeu, l'interface se contente d'adapter le libellé. */}
          <button className="bouton bouton-principal bouton-large" onClick={() => agir(() => partie.suiteDeLEvenement())}>
            {partie.aBesoinDUnMaire() ? "Élire le maire" : "Ouvrir le débat"}
          </button>
        </section>
      );
    }

    // L'élu se choisit en cliquant sur un siège (voir cliquerJoueur dans PartieVue).
    case "election":
      return (
        <section>
          <h2>Élection du maire</h2>
          <p>Clique sur le joueur élu maire par le village.</p>
        </section>
      );

    case "debat": {
      // Second débat payé avec l'or : le moteur dit qui parle seul.
      const accuse = partie.plaidoirie ? partie.joueur(partie.plaidoirie) : undefined;
      // shortcut : l'interface connaît l'alias "pretre" ; à remplacer par un champ de Role si d'autres rappels arrivent.
      const pretreMort = partie.joueurs.some(j => !j.vivant && j.role === "pretre");
      const rappelPretre = pretreMort && !partie.aBesoinDUnMaire();
      return (
        <section>
          <h2>{accuse ? `Plaidoirie de ${accuse.nom}` : "Débat"}</h2>
          {accuse && <p className="info-publique">{accuse.nom} a payé avec son or : lui seul a la parole, puis le village revote.</p>}
          {rappelPretre && <p className="aide">⛪ Le prêtre, mort, peut chuchoter au maire.</p>}
          {/* Le minuteur garde son propre état. Il est détruit (et son intervalle arrêté)
              dès qu'on quitte la phase de débat, puisque ce JSX n'est plus rendu. */}
          <Minuteur minutes={dureeDebat} />
          <button className="bouton bouton-principal bouton-large" onClick={() => agir(() => partie.ouvrirVote())}>
            Passer au vote
          </button>
        </section>
      );
    }

    // Le vote se fait en cliquant sur un siège (voir cliquerJoueur dans PartieVue).
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

/**
 * Rapport de l'aube ou du vote : qui est mort, avec quelle carte, et pourquoi.
 * Puis le bouton qui passe à la suite (événement après l'aube, nuit après le vote).
 */
function RapportDesMorts({ partie, agir }: { partie: Partie; agir: (action: () => void) => void }) {
  const estLAube = partie.phase === "aube";

  // FLUX : partie.morts() relit le journal depuis le début de la phase et garde les lignes
  // "recu mort". Il n'y a pas de variable "morts de la nuit" à tenir à jour.
  const morts = partie.morts();

  const titre = estLAube ? "Rapport de la nuit" : "Résultat du vote";
  const libelleBouton = estLAube ? "Événement du jour" : "La nuit tombe";

  /** Passe à la phase suivante. Les deux méthodes vérifient d'abord la victoire. */
  function passerALaSuite() {
    if (estLAube) {
      partie.ouvrirEvenement();
    } else {
      partie.nuitSuivante();
    }
  }

  /** "dévoré par les loups" pour la cause "mordu" ; la cause brute si elle n'a pas de libellé. */
  function expliquerCause(cause: string | undefined): string {
    if (cause === undefined) {
      return "";
    }
    return CAUSES[cause] ?? cause;
  }

  return (
    <section>
      <h2>{titre}</h2>
      {morts.length === 0 ? (
        <p>Personne n'est mort.</p>
      ) : (
        <ul className="rapport">
          {/* CONCEPT : ({ joueur, cause }) déstructure chaque objet { joueur, cause } renvoyé par morts(). */}
          {morts.map(({ joueur, cause }) => (
            <li key={joueur.id}>
              <strong>{joueur.nom}</strong> ({partie.titre(joueur.role)}) — {expliquerCause(cause)}
            </li>
          ))}
        </ul>
      )}
      <button className="bouton bouton-principal bouton-large" onClick={() => agir(passerALaSuite)}>
        {libelleBouton}
      </button>
    </section>
  );
}

/* =====================================================================================
 *  5. Le minuteur du débat
 * ===================================================================================== */

/**
 * Compte à rebours, avec pause et ajout d'une minute.
 * @param minutes durée de départ
 */
function Minuteur({ minutes }: { minutes: number }) {
  const [secondesRestantes, setSecondesRestantes] = useState(minutes * 60);
  const [enMarche, setEnMarche] = useState(true);

  const estTermine = secondesRestantes <= 0;

  // CONCEPT : un effet avec nettoyage.
  // FLUX :
  //   1. après le rendu, React exécute l'effet : on lance un intervalle qui retire une
  //      seconde toutes les 1000 ms ;
  //   2. la fonction RENVOYÉE par l'effet est le nettoyage : React l'appelle avant de
  //      relancer l'effet (quand une dépendance change) et quand le composant disparaît
  //      (on passe au vote). Sans elle, l'intervalle continuerait à tourner dans le vide,
  //      et chaque relance en ajouterait un de plus.
  // POURQUOI ces dépendances : [enMarche, estTermine], et PAS secondesRestantes. On veut
  // recréer l'intervalle seulement quand on met en pause / reprend, ou quand on atteint
  // zéro (pour l'arrêter). Avec secondesRestantes, l'intervalle serait détruit et recréé à
  // chaque seconde.
  // ATTENTION : "+1 min" à 00:00 fait repasser estTermine de true à false : l'effet est
  // relancé et le décompte reprend. C'est voulu.
  useEffect(() => {
    if (!enMarche || estTermine) {
      return; // en pause ou terminé : pas d'intervalle, donc rien à nettoyer
    }

    // La forme fonction de setState lit la DERNIÈRE valeur à chaque tick. Si on écrivait
    // setSecondesRestantes(secondesRestantes - 1), l'intervalle lirait toujours la valeur
    // capturée au lancement de l'effet (closure) et le compteur resterait bloqué.
    const identifiantIntervalle = setInterval(() => {
      setSecondesRestantes(valeurPrecedente => Math.max(0, valeurPrecedente - 1));
    }, 1000);

    return () => {
      clearInterval(identifiantIntervalle);
    };
  }, [enMarche, estTermine]);

  // Affichage "mm:ss". padStart(2, "0") complète à gauche avec des zéros : "7" → "07".
  const minutesAffichees = String(Math.floor(secondesRestantes / 60)).padStart(2, "0");
  const secondesAffichees = String(secondesRestantes % 60).padStart(2, "0");

  const classes = secondesRestantes === 0 ? "minuteur minuteur-fini" : "minuteur";

  return (
    <div className={classes}>
      <span className="minuteur-temps">{minutesAffichees}:{secondesAffichees}</span>
      <div className="actions">
        <button className="bouton bouton-petit" onClick={() => setEnMarche(etait => !etait)}>
          {enMarche ? "Pause" : "Reprendre"}
        </button>
        <button className="bouton bouton-petit" onClick={() => setSecondesRestantes(valeur => valeur + 60)}>
          +1 min
        </button>
      </div>
    </div>
  );
}

/* =====================================================================================
 *  6. Le journal du meneur
 * ===================================================================================== */

/**
 * Transforme une entrée du journal en phrase lisible.
 * Ex. { type: "bloque", joueur: "david", tag: "mordu", raison: "protégé cette nuit" }
 *   → "David bloque « mordu » : protégé cette nuit"
 */
function decrire(entree: Entree, partie: Partie): string {
  // Toutes les entrées ne concernent pas un joueur (ex. les changements de phase).
  let nom = "";
  if (entree.joueur) {
    nom = partie.joueur(entree.joueur).nom;
  }

  switch (entree.type) {
    case "recu": {
      const precisionCause = entree.cause ? ` (${entree.cause})` : "";
      return `${nom} reçoit « ${entree.tag} »${precisionCause}`;
    }

    case "bloque":
      return `${nom} bloque « ${entree.tag} » : ${entree.raison}`;

    case "consomme":
      return `${nom} consomme « ${entree.tag} » : ${entree.raison}`;

    case "transforme":
      return `${nom} transforme « ${entree.tag} » en « ${entree.en} »`;

    case "redirige": {
      // ATTENTION : le "!" suppose qu'une entrée "redirige" a toujours un champ `vers`.
      // C'est garanti par r.rediriger() dans recevoir.ts, qui est le seul à écrire ce type.
      const nomDestinataire = partie.joueur(entree.vers!).nom;
      return `« ${entree.tag} » redirigé de ${nom} vers ${nomDestinataire}`;
    }

    case "retire":
      return `« ${entree.tag} » retiré de ${nom}`;

    case "info": {
      // Info privée (un destinataire) : cadenas + nom. Info publique (aucun) : haut-parleur.
      let prefixe: string;
      if (nom) {
        prefixe = `🔒 pour ${nom} : `;
      } else {
        prefixe = "📢 ";
      }
      return `${prefixe}${entree.texte}`;
    }

    case "phase": {
      // Pour une entrée "phase", le texte contient le nom technique de la phase ("resultat_vote").
      const nomTechnique = entree.texte ?? "";
      const nomAffiche = PHASES[nomTechnique] ?? entree.texte;
      return `— ${nomAffiche} —`;
    }

    // "action", "passe", "evenement" : le moteur a déjà rédigé le texte.
    default:
      return entree.texte ?? entree.type;
  }
}

/** Le journal du tour en cours, repliable. */
function Journal({ partie }: { partie: Partie }) {
  // On n'affiche que le tour en cours (le journal complet garde toute la partie).
  // Les entrées de la phase "fin" sont gardées aussi : elles portent le numéro du tour où
  // la partie s'est terminée, mais on veut les voir sur l'écran de fin.
  const entreesAffichees = partie.journal.filter(entree => {
    const estDuTourEnCours = entree.tour === partie.tour;
    const estLaFin = entree.phase === "fin";
    return estDuTourEnCours || estLaFin;
  });

  return (
    <details className="journal" open>
      <summary>Journal du meneur (tour {partie.tour})</summary>
      <ol>
        {entreesAffichees.map((entree, index) => {
          // L'indentation reflète la profondeur de la chaîne de tags : une mort de chagrin
          // (profondeur 1) apparaît décalée sous la mort qui l'a causée (profondeur 0).
          const profondeur = entree.profondeur ?? 0;
          const style = { paddingLeft: `${profondeur * 1.2}rem` };

          // key={index} : le journal ne fait que grandir par la fin, les index existants
          // désignent donc toujours les mêmes entrées.
          return (
            <li key={index} className={`entree entree-${entree.type}`} style={style}>
              {decrire(entree, partie)}
            </li>
          );
        })}
      </ol>
    </details>
  );
}
