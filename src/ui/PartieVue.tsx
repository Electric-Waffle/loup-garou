/* =====================================================================================
 *  PartieVue.tsx — l'écran de jeu de l'oracle
 * =====================================================================================
 *
 *  La table, avec chaque joueur, sa carte et ses tags ; et le panneau du meneur, qui affiche :
 *    - les infos privées à montrer tout de suite (ce que la Voyante vient de voir…) ;
 *    - la DÉCISION en cours (une carte appelée la nuit, ou une décision urgente comme le
 *      Chasseur), avec ses options et le choix des cibles ;
 *    - sinon, l'ÉTAPE DU JOUR correspondant à la phase (rapport, événement, débat, vote, fin) ;
 *    - le journal de l'oracle : sous le panneau sur grand écran, dans une modale au téléphone.
 *
 *  Mise en page (styles.css) : grand écran, table à gauche et panneau à droite. Téléphone, la
 *  page tient dans l'écran : table en haut, panneau collé en bas sous le pouce, repliable.
 *
 *  Organisation du fichier :
 *    1. dictionnaires de libellés (CAUSES, PHASES) ;
 *    2. selectionApresClic() : la règle de sélection des cibles (fonction pure) ;
 *    3. <PartieVue>   : le composant principal ;
 *    4. <EtapeDeJour> : le panneau quand aucune décision n'est en cours ;
 *    5. <Minuteur>    : le compte à rebours du débat ;
 *    6. decrire() et <Journal> : l'affichage du journal ;
 *    7. <DerniersResultats> et <BlocJoueur> : les infos à montrer, la fiche d'un joueur.
 *
 *  FLUX d'un tour de carte (détaillé dans la note fonctionnement-du-code, parties 4 et 6) :
 *    1. à chaque rendu, on demande au moteur : partie.decisionCourante() ;
 *    2. l'oracle clique une option (choisirOption), puis ses cibles (cliquerJoueur) ;
 *       ces choix sont gardés dans l'état local `option` et `cibles` ;
 *    3. "Valider" appelle agir(() => partie.jouer(...)) : le moteur applique le choix,
 *       puis rafraichir() demande à React de redessiner ;
 *    4. au rendu suivant, decisionCourante() renvoie la carte suivante, et le useEffect
 *       sur `cle` vide la sélection.
 *
 *  POURQUOI ce composant ne contient aucune règle du jeu : il ne fait que LIRE l'état de
 *  `partie` et APPELER ses méthodes. Toute la logique est dans src/moteur.
 * ===================================================================================== */

import { useEffect, useRef, useState } from "react";
import { nbCibles, type Partie } from "../moteur/partie";
import type { Entree, Joueur, OptionChoix } from "../moteur/types";
import { Table, type Siege } from "./Table";
import { Cadran, finDuCadran, TitreDeFin, type FinCadran } from "./Cadran";
import { FicheCarte } from "./FicheCarte";
import { decouperTag } from "./libelles";
import { Modale } from "./Modale";
import { Visuel } from "./Visuel";

/* =====================================================================================
 *  1. Libellés
 *  POURQUOI des dictionnaires plutôt que des if : ajouter un tag ou une cause de mort,
 *  c'est ajouter UNE ligne ici, sans toucher au code d'affichage.
 * ===================================================================================== */


/** Explication affichée dans le rapport pour chaque cause de mort (meta.cause du tag "mort"). */
const CAUSES: Record<string, string> = {
  horreur: "a vu la carte de l'aberration",
  ultimatum: "frappé par le jugement d'Inti",
  mordu: "dévoré par les loups",
  poison: "empoisonné",
  chagrin: "mort de chagrin",
  chasseur: "abattu par le chasseur",
  vote: "éliminé par le village",
  peste: "emporté par la peste",
  isole: "dernier de la meute, dévoré par la nuit",
  conquistador: "abattu par le conquistador",
  skinwalker: "mort dans la nuit"
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
 * @param ficheAuClic réglage : un clic sur un joueur sans cible à choisir ouvre la fiche de sa carte
 * @param quitter    fonction de App.tsx qui ferme la partie
 */
export function PartieVue({
  partie,
  rafraichir,
  dureeDebat,
  ficheAuClic,
  quitter,
  finTest
}: {
  partie: Partie;
  rafraichir: () => void;
  dureeDebat: number;
  ficheAuClic: boolean;
  quitter: () => void;
  /** Boutons de test (soleil du titre) : une fin à montrer sur le cadran, sans toucher à la partie. */
  finTest?: { fin: FinCadran; n: number } | null;
}) {
  // La décision à prendre maintenant, ou undefined s'il n'y en a pas.
  // FLUX : cette question est reposée à CHAQUE rendu. Il n'y a pas de boucle "pour chaque
  // carte" : c'est la succession des rendus (un par clic) qui fait avancer la nuit.
  const courante = partie.decisionCourante();

  // État local : ce que l'oracle est en train de sélectionner pour la décision en cours.
  const [option, setOption] = useState<OptionChoix | null>(null); // l'option cliquée (Dévorer, Protéger...)
  const [cibles, setCibles] = useState<string[]>([]);             // les ids des joueurs sélectionnés
  const [erreur, setErreur] = useState<string | null>(null);      // le message si le moteur refuse
  const [joueurOuvert, setJoueurOuvert] = useState<string | null>(null); // id du joueur dont la fiche est ouverte
  // Vote et élection en DEUX temps : un appui désigne, un bouton du panneau confirme.
  // POURQUOI : au téléphone, un pouce qui glisse sur la table éliminerait le mauvais joueur, sans
  // retour possible (il n'y a pas de bouton « annuler »).
  const [designe, setDesigne] = useState<string | null>(null);
  // Téléphone : le panneau du meneur se replie pour laisser toute la place à la table.
  const [panneauReplie, setPanneauReplie] = useState(false);
  const [journalOuvert, setJournalOuvert] = useState(false);

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
    setDesigne(null);
    // Une nouvelle étape réclame l'attention du meneur : le panneau se rouvre de lui-même.
    setPanneauReplie(false);
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
  // "Bob + Chloé" : les cibles choisies, dans l'ordre des clics.
  const nomsDesCibles = cibles.map(id => partie.joueur(id).nom).join(" + ");

  const enVote = partie.phase === "vote";
  const enElection = partie.phase === "election";
  const estNuit = partie.phase === "nuit";

  /* -----------------------------------------------------------------------------------
   *  Clics
   * ----------------------------------------------------------------------------------- */

  /**
   * Clic sur un joueur (un siège de la table, ou un bouton de la liste de cibles).
   * Pendant le vote ou l'élection : le désigne (re-cliquer le retire) ; le panneau confirme.
   * Sinon : l'ajoute à la sélection ou l'en retire.
   */
  function cliquerJoueur(idJoueur: string) {
    if (enVote || enElection) {
      setDesigne(dejaDesigne => (dejaDesigne === idJoueur ? null : idJoueur));
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
   * Avec cible(s) : on la retient, et l'oracle doit maintenant choisir les cibles.
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
    if (cibles.includes(joueur.id) || designe === joueur.id) {
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
    // Sauf-conduit (événement) : impossible à éliminer aujourd'hui, son siège n'est pas cliquable au vote.
    const protegeParSaufConduit = enVote && partie.aTag(joueur, "sauf_conduit");
    // Aberration : si tous les villageois sont horrifiés, aucun siège n'est cliquable au vote.
    const voteInterdit = enVote && partie.voteImpossible() !== undefined;
    const cliquablePourLeVote = (enVote || enElection) && joueur.vivant && !protegeParSaufConduit && !voteInterdit;
    const cliquableCommeCible = possibles.includes(joueur.id);
    const estCliquable = cliquablePourLeVote || cliquableCommeCible;

    // Sans onClick, Table affiche le siège comme un simple <div> non cliquable.
    let auClic: (() => void) | undefined = undefined;
    if (estCliquable) {
      auClic = () => cliquerJoueur(joueur.id);
    } else if (ficheAuClic && !enVote && !enElection && possibles.length === 0) {
      // Aucun joueur à désigner en ce moment : le clic ouvre la fiche de sa carte (la vraie,
      // même celle d'un Skinwalker déguisé : c'est l'écran de l'oracle).
      // POURQUOI seulement dans ce cas : sinon un clic hors des cibles ouvrirait une fiche
      // au lieu d'être ignoré, et l'oracle croirait avoir choisi quelqu'un.
      auClic = () => setJoueurOuvert(joueur.id);
    }

    const siege: Siege = {
      id: joueur.id,
      classe: classesDuSiege(joueur, estPorteur, estCliquable),
      onClick: auClic,
      contenu: (
        <>
          <Visuel src={joueur.image} nom={joueur.nom} taille={44} />
          <span className="siege-nom">{joueur.nom}</span>
          {/* L'oracle voit toutes les cartes : c'est l'écran du maître du jeu. */}
          <span className="siege-carte">
            <Visuel src={partie.image(joueur.role)} nom={partie.titre(joueur.role)} taille={16} />
            <span className="siege-carte-titre">{partie.titre(joueur.role)}</span>
          </span>
          {joueur.tags.length > 0 && (
            <span className="siege-tags">
              {/* key={tag.type} : un joueur ne porte jamais deux fois le même tag
                  (r.accepter() retire le doublon), le type est donc une clé unique.
                  Sur téléphone, styles.css cache .tag-texte : il ne reste que l'icône. */}
              {joueur.tags.map(tag => {
                const { icone, texte } = decouperTag(tag.type);
                return (
                  <span key={tag.type} className={`tag tag-${tag.type}`} title={texte}>
                    {icone && <span aria-hidden="true">{icone}</span>}
                    {/* Sans icône (tag sans libellé), le texte reste visible partout. */}
                    <span className={icone ? "tag-texte" : undefined}>{texte}</span>
                  </span>
                );
              })}
            </span>
          )}
        </>
      )
    };
    return siege;
  });

  const classesPage = estNuit ? "page partie theme-nuit" : "page partie theme-jour";
  // La fin montrée par le cadran : celle des boutons de test, sinon la vraie (si la partie est finie).
  const enFin = !!finTest || partie.phase === "fin";
  const finCadran = finTest?.fin ?? finDuCadran(partie.vainqueur);
  const survivants = partie.vivants().length; // autant de villageois en fête sur le cadran
  const ouvert = joueurOuvert ? partie.joueur(joueurOuvert) : undefined;
  // Ce que montre la barre du panneau, même replié : la carte appelée, sinon l'étape du jour.
  const titreDuPanneau = courante ? courante.titre : PHASES[partie.phase];

  return (
    <div className={classesPage}>
      {partie.phase === "fin" && <RecapEntete partie={partie} />}
      <Table
        centre={
          <>
            {/* Le cadran occupe la moitié haute du plateau ; le texte passe en dessous de l'horizon. */}
            <Cadran phase={enFin ? "fin" : partie.phase} fin={finCadran} rejouer={finTest?.n} survivants={survivants} />
            {enFin ? (
              // Même key que le dessin du cadran : un test rejoué relance aussi la bascule du titre.
              <TitreDeFin key={`${finCadran}-${finTest?.n ?? 0}`} fin={finCadran} vainqueur={partie.vainqueur} survivants={survivants} />
            ) : (
              <div className="table-centre table-centre-partie">
                <span className="table-tour">Tour {partie.tour}</span>
                <span className="table-titre">{PHASES[partie.phase]}</span>
              </div>
            )}
          </>
        }
        sieges={sieges}
      />

      {/* RÉUTILISABLE : la même fiche que la page Explications, avec l'apparence de la partie,
          précédée du joueur lui-même (ses tags en toutes lettres, illisibles sur le siège au téléphone). */}
      {ouvert && (
        <FicheCarte
          role={partie.role(ouvert.role)}
          titre={partie.titre(ouvert.role)}
          image={partie.image(ouvert.role)}
          fermer={() => setJoueurOuvert(null)}
          joueur={<BlocJoueur partie={partie} joueur={ouvert} />}
        />
      )}

      {journalOuvert && (
        <Modale fermer={() => setJournalOuvert(false)}>
          <Journal partie={partie} />
        </Modale>
      )}

      {/* FLUX (téléphone) : la page fait exactement la hauteur de l'écran. La table prend l'espace
          libre en haut, ce panneau se colle en bas, sous le pouce ; seul son contenu défile.
          Sur grand écran, c'est la colonne de droite, comme avant (voir styles.css). */}
      <aside className={panneauReplie ? "panneau panneau-replie" : "panneau"}>
        <div className="panneau-barre">
          {/* La poignée : un appui replie ou déplie le panneau. Replié, il ne reste que cette barre. */}
          <button className="panneau-poignee" onClick={() => setPanneauReplie(etait => !etait)} aria-expanded={!panneauReplie}>
            {/* Déplié, le titre ferait doublon avec celui de la décision juste en dessous. */}
            <span className="panneau-titre">{panneauReplie ? titreDuPanneau : "Réduire"}</span>
            <span aria-hidden="true">{panneauReplie ? "▲" : "▼"}</span>
          </button>
          <button className="bouton bouton-petit" onClick={() => setJournalOuvert(true)}>📜 Journal</button>
        </div>

        <div className="panneau-corps">
          <DerniersResultats partie={partie} />

          {/* Une décision est en cours : on l'affiche. Sinon : l'étape du jour. */}
          {courante ? (
            <section className={courante.urgente ? "decision decision-urgente" : "decision"}>
              <div className="decision-carte">
                {/* POURQUOI courante.titre et pas partie.titre(alias) : un événement n'est pas un rôle. */}
                <Visuel src={courante.image} nom={courante.titre} taille={72} />
                <div>
                  <h2>{courante.titre}</h2>
                  {/* Les noms des joueurs qui portent cette carte (le maire, pour un événement). */}
                  <p className="aide">
                    {courante.evenement ? "Le maire désigne : " : ""}
                    {courante.porteurs.map(porteur => porteur.nom).join(", ")}
                  </p>
                </div>
              </div>

              {courante.decision.message && <p>{courante.decision.message}</p>}

              {/* Compte à rebours demandé par la carte (Réunion des amoureux).
                  POURQUOI key : une nouvelle réunion la nuit suivante doit repartir à zéro ; sans
                  key, React garderait le même Minuteur, avec son temps déjà écoulé. */}
              {courante.decision.minuteur !== undefined && (
                <Minuteur key={`${courante.alias}-${partie.tour}`} minutes={courante.decision.minuteur / 60} />
              )}

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
                    {courante.evenement ? "Passer (Inti rayonne)" : "Passer"}
                  </button>
                )}
                {courante.evenement && (
                  <button className="bouton bouton-discret" onClick={() => agir(() => partie.autreEvenement())}>
                    Un autre
                  </button>
                )}
              </div>

              {/* Choix des cibles : seulement quand l'option choisie en demande. */}
              {option && attendu > 0 && (
                <>
                  <p className="aide">
                    Touche {attendu === 2 ? "deux joueurs" : "un joueur"} sur la table
                    <span className="grand-ecran-seulement"> ou ici</span>.
                  </p>
                  {/* Grand écran seulement : au téléphone, la table est juste au-dessus et cette liste
                      doublait sa hauteur dans le panneau, au point d'écraser la table. */}
                  <div className="actions grand-ecran-seulement">
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
                    {/* Le bouton redit qui est choisi : sans la liste ci-dessus, c'est le seul rappel au téléphone. */}
                    Valider{nomsDesCibles ? ` : ${nomsDesCibles}` : ""}
                  </button>
                </>
              )}
            </section>
          ) : (
            <EtapeDeJour partie={partie} agir={agir} dureeDebat={dureeDebat} quitter={quitter} designe={designe} />
          )}

          {erreur && <p className="erreur">{erreur}</p>}
        </div>

        {/* Grand écran seulement : le journal sous le panneau. Au téléphone, il s'ouvre par le bouton 📜. */}
        <div className="journal-en-ligne">
          <Journal partie={partie} />
        </div>
      </aside>

      {partie.phase === "fin" && <RecapJournal partie={partie} />}
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
  quitter,
  designe
}: {
  partie: Partie;
  agir: (action: () => void) => void;
  dureeDebat: number;
  quitter: () => void;
  /** Vote ou élection : le joueur touché sur la table, en attente de confirmation. */
  designe: string | null;
}) {
  const nomDuDesigne = designe ? partie.joueur(designe).nom : undefined;

  // PATTERN : useRef pour une valeur qu'on lit sans qu'elle redessine l'écran.
  // POURQUOI : le Minuteur la met à jour chaque seconde ; avec useState, EtapeDeJour serait
  // redessinée à chaque seconde pour rien. On ne la lit qu'au clic « Passer au vote ».
  // ATTENTION : déclaré AVANT le switch. Un hook doit être appelé à chaque rendu, dans le même
  // ordre ; dans un case, il ne le serait que pendant le débat.
  const secondesRestantes = useRef<number | undefined>(undefined);

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

    // FLUX : un événement AVEC choix s'affiche d'abord dans le panneau de décision (le maire désigne).
    // On arrive ici pour un événement sans choix, ou une fois l'événement appliqué.
    case "evenement": {
      const evenement = partie.evenement;
      const applique = partie.evenementApplique;
      // Les infos publiques de l'événement (aucun événement actuel n'en donne à la validation, mais un futur événement le pourra), affichées l'une sous l'autre.
      // Celles de la nuit ont déjà été lues au rapport de l'aube.
      const infosPubliques = partie.infosPubliques(["evenement"]);
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
          {applique ? (
            <button className="bouton bouton-principal bouton-large" onClick={() => agir(() => partie.ouvrirDebat())}>
              Ouvrir le débat
            </button>
          ) : (
            <div className="actions">
              <button className="bouton bouton-principal" onClick={() => agir(() => partie.appliquerEvenement())}>
                Valider l'événement
              </button>
              {/* La suite du Sablier est imposée : ni remplacée, ni passée. */}
              {!evenement?.force && (
                <>
                  <button className="bouton" onClick={() => agir(() => partie.autreEvenement())}>Un autre</button>
                  <button className="bouton bouton-discret" onClick={() => agir(() => partie.passerEvenement())}>
                    Passer (Soleil)
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      );
    }

    // L'élu se désigne en touchant un siège (voir cliquerJoueur dans PartieVue), puis se confirme ici.
    case "election":
      return (
        <section>
          <h2>Élection du maire</h2>
          {designe ? (
            <button className="bouton bouton-principal bouton-large" onClick={() => agir(() => partie.elire(designe))}>
              Élire {nomDuDesigne}
            </button>
          ) : (
            <p>Touche sur la table le joueur élu maire par le village.</p>
          )}
        </section>
      );

    case "debat": {
      // Second débat payé avec l'or : le moteur dit qui parle seul.
      const accuse = partie.plaidoirie ? partie.joueur(partie.plaidoirie) : undefined;
      // shortcut : l'interface connaît les alias des deux prêtres ; à remplacer par un champ de Role si d'autres rappels arrivent.
      // Un prêtre « sans pouvoir » (Ancien éliminé par le village) ne chuchote plus, même mort.
      const pretreMort = partie.joueurs.some(j =>
        !j.vivant && (j.role === "pretre" || j.role === "pretre-impur") && !partie.aTag(j, "impuissant"));
      const rappelPretre = pretreMort && !partie.aBesoinDUnMaire();
      const duree = partie.dureeDuDebat(dureeDebat);
      return (
        <section>
          <h2>{accuse ? `Plaidoirie de ${accuse.nom}` : "Débat"}</h2>
          {accuse && <p className="info-publique">{accuse.nom} a payé avec son or : lui seul a la parole, puis le village revote.</p>}
          {rappelPretre && <p className="aide">⛪ Le prêtre, mort, peut chuchoter au maire.</p>}
          {/* Le minuteur garde son propre état. Il est détruit (et son intervalle arrêté)
              dès qu'on quitte la phase de débat, puisque ce JSX n'est plus rendu.
              Durée : celle de l'événement du jour (Sablier, Urgence…) ou le réglage ; null = pas de minuteur. */}
          {duree !== null && (
            <Minuteur minutes={duree} surChangement={secondes => { secondesRestantes.current = secondes; }} />
          )}
          <button
            className="bouton bouton-principal bouton-large"
            onClick={() => agir(() => partie.ouvrirVote(duree === null ? undefined : secondesRestantes.current))}
          >
            Passer au vote
          </button>
        </section>
      );
    }

    // L'éliminé se désigne en touchant un siège (voir cliquerJoueur dans PartieVue), puis se confirme ici.
    case "vote":
      return (
        <section>
          <h2>Vote</h2>
          {/* Rappels du Loup hypnotiseur : affichés seulement maintenant, jamais pendant le débat. */}
          {partie.rappelsDuVote().map((rappel, index) => (
            <p key={index} className="aide">⚠️ {rappel}</p>
          ))}
          {designe ? (
            <button className="bouton bouton-principal bouton-large" onClick={() => agir(() => partie.voter(designe))}>
              Éliminer {nomDuDesigne}
            </button>
          ) : (
            <p>Touche sur la table le joueur éliminé par le village.</p>
          )}
          <button className="bouton bouton-discret bouton-large" onClick={() => agir(() => partie.voter(null))}>
            Personne n'est éliminé
          </button>
        </section>
      );

    case "fin":
      return (
        <section className="fin">
          <h2>🏆 Partie terminée</h2>
          <p>La partie est terminée après {partie.tour} tour(s).</p>
          <button className="bouton bouton-large" onClick={imprimerRecap}>Télécharger le récap (PDF)</button>
          <button className="bouton bouton-principal bouton-large" onClick={quitter}>Nouvelle partie</button>
        </section>
      );
  }
}

/**
 * Le récap PDF de la partie : on passe par l'impression du navigateur (« Enregistrer au format PDF »).
 * POURQUOI pas une librairie qui fabrique le PDF (html2canvas + jsPDF) : elles redessinent la page
 * en image et ne savent pas rendre clip-path, backdrop-filter ni les dégradés coniques : le cadran,
 * la pancarte et la table perdraient leur aspect. L'impression, elle, utilise le vrai moteur du
 * navigateur ; la mise en page du récap est dans styles.css (section « Récap imprimable »).
 * ATTENTION : le nom du fichier PDF proposé par le navigateur est le titre de la page : on le
 * change le temps de l'impression. window.print() bloque jusqu'à la fermeture de la fenêtre.
 */
function imprimerRecap() {
  const titre = document.title;
  document.title = `Paqari - récap du ${new Date().toISOString().slice(0, 10)}`;
  window.print();
  document.title = titre;
}

/**
 * Pour le récap imprimé : l'en-tête (titre du jeu, date, durée), puis la table finale s'imprime
 * telle qu'elle est à l'écran, puis le journal complet, tour par tour.
 * Invisible à l'écran (classe « imprimer-seulement »).
 */
function RecapEntete({ partie }: { partie: Partie }) {
  return (
    <header className="imprimer-seulement recap-entete">
      <h1><span className="logo">☀️</span> Paqari</h1>
      <p>
        Récapitulatif de partie · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        {" · "}{partie.joueurs.length} joueurs · {partie.tour} tour(s)
      </p>
    </header>
  );
}

function RecapJournal({ partie }: { partie: Partie }) {
  // CONCEPT : regrouper une liste par clé. Map garde l'ordre d'insertion : les tours sortent dans
  // l'ordre où ils ont été joués. Les entrées de la fin portent le numéro du dernier tour.
  const parTour = new Map<number, Entree[]>();
  for (const entree of partie.journal) {
    parTour.set(entree.tour, [...(parTour.get(entree.tour) ?? []), entree]);
  }
  return (
    <section className="imprimer-seulement recap-journal">
      <h2>Journal de l'oracle</h2>
      {[...parTour].map(([tour, entrees]) => (
        <section key={tour} className="recap-tour">
          <h3>Tour {tour}</h3>
          <ol>
            {entrees.map((entree, index) => (
              <li key={index} className={`entree entree-${entree.type}`} style={{ paddingLeft: `${(entree.profondeur ?? 0) * 1.2}rem` }}>
                {decrire(entree, partie)}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
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
  let libelleBouton = "La nuit tombe";
  if (estLAube) libelleBouton = partie.aBesoinDUnMaire() ? "Élire le maire" : "Événement du jour";

  /** Passe à la phase suivante. Les deux méthodes vérifient d'abord la victoire. */
  function passerALaSuite() {
    if (estLAube) {
      partie.suiteDeLAube();
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
              {/* Victime du Skinwalker : sa carte n'est pas révélée. */}
              <strong>{joueur.nom}</strong> {cause === "skinwalker" ? "(carte non révélée)" : `(${partie.titre(joueur.role)})`} — {expliquerCause(cause)}
            </li>
          ))}
        </ul>
      )}
      {/* Annonces publiques de la phase : la nuit au rapport de l'aube ; Ultimatum ou Coup double
          au résultat du vote. */}
      {partie.infosPubliques(estLAube ? ["nuit", "aube"] : ["resultat_vote"]).map((texte, index) => (
        <p key={index} className="info-publique">{texte}</p>
      ))}
      {/* Coup double : l'oracle peut rouvrir le vote (le débat se fait de tête). */}
      {!estLAube && partie.peutRevoter && (
        <button className="bouton bouton-large" onClick={() => agir(() => partie.revoter())}>
          Voter quelqu'un d'autre (Chasse du puma)
        </button>
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
 * @param minutes durée de départ (peut être fractionnaire : la suite du Sablier)
 * @param surChangement appelée avec le temps restant à chaque changement (Sablier)
 */
function Minuteur({ minutes, surChangement }: { minutes: number; surChangement?: (secondes: number) => void }) {
  // Math.round : 125 / 60 * 60 peut donner 124,99999… en virgule flottante.
  const [secondesRestantes, setSecondesRestantes] = useState(Math.round(minutes * 60));
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

  // FLUX : le temps restant ne vit QUE dans ce composant. Pour que « Passer au vote » le lise,
  // on le remonte au parent par une fonction de rappel, après chaque changement.
  // ATTENTION : surChangement n'est pas dans les dépendances : le parent la recrée à chaque rendu,
  // et l'effet repartirait sans raison. Seul le temps compte.
  useEffect(() => {
    surChangement?.(secondesRestantes);
  }, [secondesRestantes]);

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
 *  6. Le journal de l'oracle
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
      <summary>Journal de l'oracle (tour {partie.tour})</summary>
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

/* =====================================================================================
 *  7. Ce que le meneur doit montrer maintenant
 * ===================================================================================== */

/** Types d'entrée qui ouvrent un nouveau « moment » : ce qui suit leur appartient. */
const DEBUTS_DE_MOMENT = new Set(["action", "passe", "phase"]);

/**
 * Les infos PRIVÉES produites depuis la dernière action (ou le dernier changement de phase) :
 * la carte vue par la Voyante, les rôles des amoureux pour Cupidon, la possession du Loup-démon…
 *
 * POURQUOI : ces infos n'étaient lisibles que dans le journal. Le journal étant replié au
 * téléphone, le meneur les aurait perdues ; elles s'affichent donc en tête du panneau, le temps
 * de les montrer au joueur, et disparaissent dès l'action suivante.
 * FLUX : rien n'est stocké. Le composant relit le journal à chaque rendu (même principe que
 * partie.morts() pour le rapport de l'aube) : c'est un état DÉRIVÉ, jamais désynchronisé.
 * POURQUOI seulement les privées : les publiques (Hurleur, flammes de la salamandre…) sont lues
 * à voix haute au rapport de l'aube ou au résultat du vote, déjà affichés.
 */
function DerniersResultats({ partie }: { partie: Partie }) {
  const journal = partie.journal;

  // L'index du dernier début de moment, en partant de la fin (-1 si aucun).
  // POURQUOI une boucle et pas journal.findLastIndex(...) : cette méthode date d'ES2023, et le
  // projet cible ES2022 (tsconfig). La boucle à rebours fait la même chose.
  let debut = journal.length - 1;
  while (debut >= 0 && !DEBUTS_DE_MOMENT.has(journal[debut].type)) debut--;

  //   journal.slice(debut + 1)  → les entrées écrites APRÈS ce début (nouveau tableau, journal intact)
  //   .filter(info privée)      → seulement celles qui ont un destinataire
  const infosPrivees = journal
    .slice(debut + 1)
    .filter(entree => entree.type === "info" && entree.joueur !== undefined);
  if (infosPrivees.length === 0) return null;

  // Le titre : l'action qui a produit ces infos (« Voyante : sonder → Bob »), sinon un titre générique.
  const origine = journal[debut];
  const titre = origine?.type === "action" ? origine.texte : "Nouvelles infos";

  return (
    <section className="derniers-resultats">
      <p className="aide">{titre}</p>
      {infosPrivees.map((entree, index) => (
        <p key={index} className="info-privee">{decrire(entree, partie)}</p>
      ))}
    </section>
  );
}

/**
 * Le joueur ouvert depuis la table : son nom, puis chacun de ses tags en toutes lettres.
 * Affiché en tête de la fiche de sa carte (FicheCarte, prop `joueur`).
 */
function BlocJoueur({ partie, joueur }: { partie: Partie; joueur: Joueur }) {
  return (
    <div className="fiche-joueur">
      <div className="fiche-joueur-entete">
        <Visuel src={joueur.image} nom={joueur.nom} taille={48} />
        <h2>{joueur.nom}{!joueur.vivant && " ⚰️"}</h2>
      </div>
      {joueur.tags.length === 0 ? (
        <p className="aide">Aucun tag.</p>
      ) : (
        <ul className="fiche-joueur-tags">
          {joueur.tags.map(tag => {
            const { icone, texte } = decouperTag(tag.type);
            return (
              <li key={tag.type}>
                <span aria-hidden="true">{icone ?? "•"}</span> {texte}
                <span className="aide">{precisionDuTag(partie, joueur, tag.type)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Un complément pour les tags qui désignent d'autres joueurs (« de Hugo »), sinon "".
 * shortcut : seulement les liens (amoureux, Arlequin) ; à étendre si d'autres tags pointent vers quelqu'un.
 */
function precisionDuTag(partie: Partie, joueur: Joueur, type: string): string {
  if (type === "amoureux") {
    const noms = partie.partenairesDe(joueur).map(partenaire => partenaire.nom);
    return noms.length ? ` — de ${noms.join(", ")}` : "";
  }
  if (type === "lie") {
    const partenaire = partie.partenaireLie(joueur);
    return partenaire ? ` — avec ${partenaire.nom}` : "";
  }
  return "";
}
