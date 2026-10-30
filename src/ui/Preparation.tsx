/* =====================================================================================
 *  Preparation.tsx — la page "Préparer" : qui joue, où, avec quelle carte
 * =====================================================================================
 *
 *  Ce qu'on peut faire ici :
 *    1. cocher les joueurs présents (ils s'assoient à la table, ou la quittent) ;
 *    2. échanger deux joueurs de place, en cliquant sur leurs deux sièges ;
 *    3. distribuer les cartes au hasard (ou redistribuer) ;
 *    4. régler la durée du débat ;
 *    5. lancer la partie (fonction lancer() de App.tsx).
 *
 *  Les réglages viennent de App.tsx (`donnees`) et les changements lui sont demandés via
 *  `modifier`, exactement comme dans Options.tsx. La page n'a que deux états à elle :
 *    - selection : le premier siège cliqué, en attente du second pour l'échange ;
 *    - erreur    : le message affiché si la distribution est impossible.
 *
 *  PATTERN : état dérivé.
 *  POURQUOI : table, actifs, distributionValide, composition... sont RECALCULÉS à chaque
 *  rendu à partir de `donnees`, au lieu d'être rangés dans des useState. Ainsi, ils ne
 *  peuvent jamais être désynchronisés des réglages. Pour quelques dizaines d'éléments, le
 *  coût de ce recalcul est négligeable (sinon, on utiliserait useMemo).
 * ===================================================================================== */

import { useState } from "react";
import { distribuer } from "../moteur/distribution";
import { ROLES } from "../moteur/roles";
import type { Donnees } from "./stockage";
import { Table, type Siege } from "./Table";
import { Visuel } from "./Visuel";

/**
 * @param donnees  tous les réglages actuels
 * @param modifier fonction de App.tsx qui remplace les réglages par un nouvel objet
 * @param lancer   fonction de App.tsx qui crée la partie et affiche l'écran de jeu
 */
export function Preparation({
  donnees,
  modifier,
  lancer
}: {
  donnees: Donnees;
  modifier: (d: Donnees) => void;
  lancer: () => void;
}) {
  // Premier siège cliqué (id du joueur), ou null si aucun siège n'est en attente.
  const [selection, setSelection] = useState<string | null>(null);
  // Message d'erreur de la distribution, ou null.
  const [erreur, setErreur] = useState<string | null>(null);

  /* -----------------------------------------------------------------------------------
   *  Valeurs dérivées : recalculées à chaque rendu à partir de `donnees`.
   * ----------------------------------------------------------------------------------- */

  // PATTERN : index par clé.
  // POURQUOI : la table ne contient que des ids ; pour dessiner chaque siège, il faut
  // retrouver le joueur complet (nom, image). On range les joueurs dans un dictionnaire
  // id → joueur une fois, puis chaque recherche se fait avec get() ou has(), sans
  // parcourir la liste. C'est l'équivalent de array_column($joueurs, null, 'id') en PHP.
  // CONCEPT : deux étapes.
  //   donnees.joueurs.map(...) → un TABLEAU de paires : [["a1", {Alice}], ["b2", {Bob}], ...]
  //   new Map(paires)          → un DICTIONNAIRE :     Map { "a1" => {Alice}, "b2" => {Bob} }
  // .map() (méthode de tableau) et Map (structure de données) n'ont rien à voir malgré le nom.
  const joueursParId = new Map(donnees.joueurs.map(joueur => [joueur.id, joueur]));

  // Les ids assis à la table, en retirant ceux qui ne correspondent plus à aucun joueur
  // (un joueur supprimé dans Options pendant qu'il était assis).
  const table = donnees.table.filter(idJoueur => joueursParId.has(idJoueur));

  // Les alias des cartes activées, qui servent à la distribution.
  // Transformation en chaîne, étape par étape :
  //   Object.entries(donnees.cartes) → [["loup", { active: true }], ["voyante", { active: false }], ...]
  //   .filter(...)                   → on ne garde que les paires activées ET connues du code
  //   .map(...)                      → on ne garde que l'alias : ["loup", ...]
  const toutesLesCartes = Object.entries(donnees.cartes);
  const cartesActivees = toutesLesCartes.filter(([alias, reglage]) => {
    const existeDansLeCode = ROLES[alias] !== undefined;
    // POURQUOI vérifier l'existence : les réglages enregistrés peuvent contenir un rôle
    // supprimé du code depuis. Le distribuer ferait planter le moteur ("Rôle inconnu").
    return reglage.active && existeDansLeCode;
  });
  const actifs = cartesActivees.map(([alias]) => alias);

  // La distribution est utilisable si au moins un joueur est assis ET que chaque joueur
  // assis a reçu une carte.
  // CONCEPT : every() renvoie true si la fonction renvoie true pour TOUS les éléments
  // (et s'arrête au premier false). Sa sœur some() renvoie true si AU MOINS UN élément convient.
  // ATTENTION : every() sur un tableau vide renvoie true ("tous les éléments d'une liste vide
  // conviennent", par convention). D'où le test table.length > 0 en plus.
  const auMoinsUnJoueur = table.length > 0;
  const chacunASaCarte = table.every(idJoueur => Boolean(donnees.distribution[idJoueur]));
  const distributionValide = auMoinsUnJoueur && chacunASaCarte;

  // Combien de cartes de chaque sorte ont été distribuées, pour la phrase "Composition : ...".
  const composition = compterLesCartes(table, donnees.distribution);

  /* -----------------------------------------------------------------------------------
   *  Titre et image d'une carte, en tenant compte des réglages
   * ----------------------------------------------------------------------------------- */

  /** Le titre personnalisé d'une carte s'il existe, sinon celui du code. */
  function titre(alias: string): string {
    // CONCEPT : "?." (chaînage optionnel). Si donnees.cartes[alias] est undefined, l'expression
    // s'arrête et vaut undefined, au lieu de planter sur ".titre".
    const titrePersonnalise = donnees.cartes[alias]?.titre;
    // ATTENTION : "||" et pas "??" : un titre vide ("", champ effacé) doit aussi revenir au
    // titre du code. "??" ne remplace que null et undefined, il garderait la chaîne vide.
    return titrePersonnalise || ROLES[alias].titre;
  }

  /** L'image personnalisée d'une carte si elle existe, sinon celle du code. */
  function image(alias: string): string {
    const imagePersonnalisee = donnees.cartes[alias]?.image;
    return imagePersonnalisee || ROLES[alias].image;
  }

  /* -----------------------------------------------------------------------------------
   *  Actions de l'utilisateur
   * ----------------------------------------------------------------------------------- */

  /** Case "Qui joue ?" cochée ou décochée : le joueur s'assoit ou quitte la table. */
  function basculer(idJoueur: string) {
    const estAssis = table.includes(idJoueur);

    let nouvelleTable: string[];
    if (estAssis) {
      // Il quitte la table : on garde tous les autres.
      nouvelleTable = table.filter(idAssis => idAssis !== idJoueur);
    } else {
      // Il s'assoit : on l'ajoute à la dernière place.
      nouvelleTable = [...table, idJoueur];
    }

    // POURQUOI vider la distribution : le nombre de joueurs a changé, l'ancienne
    // distribution n'a plus le bon nombre de cartes.
    modifier({ ...donnees, table: nouvelleTable, distribution: {} });
  }

  /**
   * Clic sur un siège de la table.
   * Premier clic : le siège est mis en attente (surligné).
   * Second clic sur un AUTRE siège : les deux joueurs échangent leur place.
   * Second clic sur le MÊME siège : annule la sélection.
   */
  function cliquerSiege(idJoueur: string) {
    // Premier clic : on retient ce siège et on attend le second.
    if (selection === null) {
      setSelection(idJoueur);
      return;
    }

    // Second clic sur un autre siège : échange.
    if (selection !== idJoueur) {
      // On travaille sur une COPIE de la table, pour ne pas modifier celle des réglages.
      const nouvelleTable = [...table];
      const placeDuPremier = nouvelleTable.indexOf(selection);
      const placeDuSecond = nouvelleTable.indexOf(idJoueur);

      // CONCEPT : échange par déstructuration. À droite, on fabrique un tableau
      // temporaire [second, premier] ; à gauche, on range ses deux valeurs aux deux places.
      // C'est l'équivalent de : tmp = a; a = b; b = tmp; sans variable temporaire.
      [nouvelleTable[placeDuPremier], nouvelleTable[placeDuSecond]] =
        [nouvelleTable[placeDuSecond], nouvelleTable[placeDuPremier]];

      // La distribution n'est PAS vidée : chaque joueur garde sa carte en changeant de place.
      modifier({ ...donnees, table: nouvelleTable });
    }

    // Dans les deux cas (échange ou re-clic sur le même siège), la sélection est terminée.
    setSelection(null);
  }

  /** Bouton "Distribuer les cartes" / "Redistribuer". */
  function lancerDistribution() {
    // POURQUOI un try/catch : le moteur lève une Error si la distribution est impossible
    // (moins de 3 joueurs, trop de loups, pas assez de cartes loups ou de cartes...). On transforme
    // cette erreur en message affiché, au lieu de laisser l'application planter.
    try {
      setErreur(null);
      const nouvelleDistribution = distribuer(table, donnees.nbLoups, actifs);
      modifier({ ...donnees, distribution: nouvelleDistribution });
    } catch (e) {
      // En TypeScript, ce qui est attrapé est de type "unknown" (on peut lancer n'importe quoi
      // avec throw). "as Error" affirme que c'est une Error ; c'est le cas pour le moteur.
      const message = (e as Error).message;
      setErreur(message);
    }
  }

  /** Champ "Débat (minutes)". */
  function changerDureeDebat(texteSaisi: string) {
    // Un <input type="number"> donne quand même du TEXTE. Number("") vaut 0 et
    // Number("abc") vaut NaN : dans les deux cas, "|| 1" donne 1.
    const nombreSaisi = Number(texteSaisi) || 1;
    // Et jamais moins d'une minute (un nombre négatif saisi au clavier, par exemple).
    const duree = Math.max(1, nombreSaisi);
    modifier({ ...donnees, dureeDebat: duree });
  }

  /** Champ "Loups". */
  function changerNbLoups(texteSaisi: string) {
    // Même lecture que la durée du débat : jamais moins d'un loup.
    // Le maximum (moins de loups que de joueurs) est vérifié par le moteur à la distribution.
    const nombreSaisi = Number(texteSaisi) || 1;
    const nbLoups = Math.max(1, nombreSaisi);
    // POURQUOI vider la distribution : elle ne respecte plus le nombre de loups demandé.
    modifier({ ...donnees, nbLoups: nbLoups, distribution: {} });
  }

  /* -----------------------------------------------------------------------------------
   *  Préparation de l'affichage
   * ----------------------------------------------------------------------------------- */

  // La phrase "Composition : 2 × Loup-Garou, 1 × Voyante, ..."
  // composition est un tableau de paires [alias, nombre] ; chaque paire devient un morceau de texte.
  const morceauxComposition = composition.map(([alias, nombre]) => `${nombre} × ${titre(alias)}`);
  const texteComposition = morceauxComposition.join(", ");

  // Un siège par joueur assis, dans l'ordre de la table.
  const sieges: Siege[] = table.map(idJoueur => {
    // ATTENTION : get() renvoie "joueur | undefined" (la clé pourrait ne pas exister).
    // Le "!" est sûr ici parce que `table` a été filtrée avec has() plus haut.
    const joueur = joueursParId.get(idJoueur)!;
    const aliasDeSaCarte = donnees.distribution[idJoueur]; // undefined avant la distribution
    const estSelectionne = selection === idJoueur;

    const siege: Siege = {
      id: idJoueur,
      classe: estSelectionne ? "siege-selection" : "",
      onClick: () => cliquerSiege(idJoueur),
      // CONCEPT : <>...</> est un "fragment" : il regroupe plusieurs éléments sans ajouter
      // de balise autour (un composant ou une prop ne peut contenir qu'UN élément racine).
      contenu: (
        <>
          <Visuel src={joueur.image} nom={joueur.nom} taille={44} />
          <span className="siege-nom">{joueur.nom}</span>
          {aliasDeSaCarte && (
            <span className="siege-carte">
              <Visuel src={image(aliasDeSaCarte)} nom={titre(aliasDeSaCarte)} taille={18} /> {titre(aliasDeSaCarte)}
            </span>
          )}
        </>
      )
    };
    return siege;
  });

  const libelleBoutonDistribution = distributionValide ? "Redistribuer" : "Distribuer les cartes";

  return (
    <div className="page preparation">
      <aside className="panneau">
        <h2>Qui joue ?</h2>
        <ul className="liste-cochable">
          {/* On parcourt TOUS les joueurs des réglages ; la case est cochée s'il est assis. */}
          {donnees.joueurs.map(joueur => (
            <li key={joueur.id}>
              <label>
                <input type="checkbox" checked={table.includes(joueur.id)} onChange={() => basculer(joueur.id)} />
                <Visuel src={joueur.image} nom={joueur.nom} taille={28} />
                {joueur.nom}
              </label>
            </li>
          ))}
        </ul>
        <p className="aide">Clique sur deux sièges pour échanger leur place.</p>

        <div className="actions-colonne">
          {/* Le moteur exige au moins 3 joueurs : le bouton est désactivé en dessous. */}
          <button className="bouton" onClick={lancerDistribution} disabled={table.length < 3}>
            {libelleBoutonDistribution}
          </button>

          {/* POURQUOI désactiver tant que la distribution n'est pas valide : lancer() (App.tsx)
              suppose que chaque joueur assis existe et a une carte. Ce bouton est ce qui
              garantit cette hypothèse. */}
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
              onChange={evenement => changerDureeDebat(evenement.target.value)}
            />
          </label>

          <label className="champ-ligne">
            Loups
            <input
              className="champ champ-court"
              type="number"
              min={1}
              max={Math.max(1, table.length - 1)}
              value={donnees.nbLoups}
              onChange={evenement => changerNbLoups(evenement.target.value)}
            />
          </label>
        </div>

        {erreur && <p className="erreur">{erreur}</p>}

        {composition.length > 0 && (
          <p className="aide">Composition : {texteComposition}</p>
        )}
      </aside>

      <Table
        centre={<span className="table-titre">{table.length} joueurs</span>}
        sieges={sieges}
      />
    </div>
  );
}

/**
 * Compte les cartes distribuées, par alias.
 *
 * @param table        les ids des joueurs assis
 * @param distribution id du joueur → alias de sa carte
 * @returns une liste de paires [alias, nombre], ex. [["loup", 2], ["voyante", 1], ...]
 *
 * CONCEPT : reduce() parcourt un tableau en faisant "grossir" une valeur unique,
 * appelée l'accumulateur.
 *   - Le second argument ({}) est la valeur de départ de l'accumulateur.
 *   - Pour chaque élément, la fonction reçoit (accumulateur, élément) et RENVOIE le nouvel
 *     accumulateur, qui sera passé à l'élément suivant.
 *   - reduce() renvoie l'accumulateur final.
 * Déroulé avec 3 joueurs (loup, voyante, loup) :
 *   départ             {}
 *   après le joueur 1  { loup: 1 }
 *   après le joueur 2  { loup: 1, voyante: 1 }
 *   après le joueur 3  { loup: 2, voyante: 1 }
 *
 * ATTENTION : ici, l'accumulateur est MODIFIÉ (compteurs[alias] = ...). Ce n'est pas un
 * problème, car c'est un objet neuf créé pour ce reduce (le {} de départ) : aucune donnée
 * existante n'est touchée.
 */
function compterLesCartes(table: string[], distribution: Record<string, string>): [string, number][] {
  // CONCEPT : reduce<Record<string, number>> précise à TypeScript le type de l'accumulateur.
  // Sans cela, il déduirait le type de {} (un objet vide, sans propriétés).
  const compteurs = table.reduce<Record<string, number>>((compteursEnCours, idJoueur) => {
    const alias = distribution[idJoueur];

    // Joueur sans carte (distribution pas encore faite) : on ne compte rien.
    if (!alias) {
      return compteursEnCours;
    }

    // Première carte de cette sorte : le compteur n'existe pas encore, "?? 0" part de zéro.
    const nombreActuel = compteursEnCours[alias] ?? 0;
    compteursEnCours[alias] = nombreActuel + 1;
    return compteursEnCours;
  }, {});

  // { loup: 2, voyante: 1 } → [["loup", 2], ["voyante", 1]], plus facile à parcourir dans le JSX.
  return Object.entries(compteurs);
}
