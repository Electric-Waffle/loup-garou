/* =====================================================================================
 *  Options.tsx — la page "Options" : réglages des cartes et liste des joueurs
 * =====================================================================================
 *
 *  Ce qu'on peut faire ici :
 *    - pour chaque carte : changer son titre, son image, l'activer ou la désactiver ;
 *    - pour les joueurs : en ajouter, en supprimer, changer leur nom et leur image.
 *  Ce qu'on NE peut PAS faire ici : changer la logique d'une carte (elle est dans
 *  src/moteur/roles/<alias>.ts).
 *
 *  Organisation du fichier :
 *    1. libelleTours()     : transforme le champ `tours` d'un rôle en texte lisible ;
 *    2. <Options>          : la page. Elle possède les fonctions qui modifient les réglages ;
 *    3. <CarteReglable>    : l'affichage d'UNE carte ;
 *    4. <LigneJoueur>      : l'affichage d'UN joueur.
 *
 *  FLUX d'une modification (ex. décocher "Activée") :
 *    CarteReglable appelle regler({ active: false })
 *      → Options.reglerCarte() fabrique un NOUVEL objet de réglages
 *      → modifier(nouvellesDonnees), qui est setDonnees de App.tsx
 *      → App se redessine avec les nouvelles données et les sauvegarde (useEffect)
 *      → Options et CarteReglable se redessinent avec la case décochée.
 *
 *  PATTERN : composants contrôlés. Options ne garde AUCUN état : elle affiche `donnees`
 *  et demande les changements à son parent via `modifier`.
 *  PATTERN : composition. <CarteReglable> et <LigneJoueur> ne savent pas comment les
 *  réglages sont rangés : ils reçoivent une fonction `regler(patch)` et l'appellent.
 *  Seule la page Options sait construire le nouvel objet `donnees`.
 * ===================================================================================== */

import { LISTE_ROLES } from "../moteur/roles";
import type { Camp, Role, Tours } from "../moteur/types";
import type { CarteReglage, Donnees, JoueurProfil } from "./stockage";
import { nouvelId } from "./stockage";
import { ChoixImage, Visuel } from "./Visuel";

/**
 * Libellé affiché pour chaque camp.
 * POURQUOI typé Record<Camp, string> : si un nouveau camp est ajouté dans types.ts,
 * TypeScript signalera ici qu'il manque son libellé.
 */
const LIBELLES_CAMPS: Record<Camp, string> = {
  village: "Village",
  loups: "Loups",
  solo: "Solo",
  fou: "Fou"
};

/**
 * Transforme le champ `tours` d'un rôle en phrase pour le badge de la carte.
 *   undefined                 → "toutes les nuits"
 *   { de: 1, a: 1 }           → "nuit 1 uniquement"
 *   { de: 2 }                 → "dès la nuit 2"
 *   { de: 2, chaque: 2 }      → "dès la nuit 2, une nuit sur 2"
 */
function libelleTours(tours?: Tours): string {
  // Pas de restriction : le rôle agit toutes les nuits.
  if (!tours) {
    return "toutes les nuits";
  }

  // Début et fin identiques : une seule nuit.
  const uneSeuleNuit = tours.de !== undefined && tours.de === tours.a;
  if (uneSeuleNuit) {
    return `nuit ${tours.de} uniquement`;
  }

  // Sinon, on assemble un morceau de phrase par champ renseigné.
  const morceaux: string[] = [];
  if (tours.de) {
    morceaux.push(`dès la nuit ${tours.de}`);
  }
  if (tours.a) {
    morceaux.push(`jusqu'à la nuit ${tours.a}`);
  }
  if (tours.chaque) {
    morceaux.push(`une nuit sur ${tours.chaque}`);
  }

  // join(", ") : ["dès la nuit 2", "une nuit sur 2"] → "dès la nuit 2, une nuit sur 2"
  return morceaux.join(", ");
}

/* =====================================================================================
 *  La page
 * ===================================================================================== */

/**
 * @param donnees  tous les réglages actuels (lecture seule pour ce composant)
 * @param modifier fonction de App.tsx qui remplace les réglages par un nouvel objet
 */
export function Options({ donnees, modifier }: { donnees: Donnees; modifier: (d: Donnees) => void }) {
  /* -----------------------------------------------------------------------------------
   *  Fonctions qui modifient les réglages.
   *
   *  CONCEPT : mise à jour immuable. On ne modifie JAMAIS `donnees` directement
   *  (pas de donnees.cartes[alias].titre = "..."). On fabrique une copie qui contient
   *  le changement, et on la passe à modifier().
   *  POURQUOI : React décide de redessiner en comparant l'ANCIEN objet et le NOUVEAU
   *  (est-ce le même objet en mémoire ?). Si on modifiait l'objet existant, React verrait
   *  "même objet" et n'afficherait pas le changement. De plus, le useEffect de sauvegarde
   *  dans App.tsx ne se déclencherait pas.
   *
   *  CONCEPT : la syntaxe de décomposition { ...objet } copie toutes les propriétés
   *  d'un objet dans un nouvel objet. Les propriétés écrites APRÈS remplacent celles
   *  de la copie : { ...a, x: 1 } = "une copie de a, mais avec x = 1".
   *  ATTENTION : c'est une copie SUPERFICIELLE. Les objets imbriqués ne sont pas copiés,
   *  seulement leur référence. C'est pour ça qu'il faut recopier chaque niveau qu'on
   *  modifie (voir reglerCarte, qui copie trois niveaux).
   * ----------------------------------------------------------------------------------- */

  /**
   * Modifie un ou plusieurs champs du réglage d'une carte.
   * @param alias la carte à modifier
   * @param patch les champs à changer, ex. { active: false } ou { titre: "Garou" }
   *              (Partial<CarteReglage> : un CarteReglage dont tous les champs sont facultatifs)
   */
  function reglerCarte(alias: string, patch: Partial<CarteReglage>) {
    // Niveau 3 : le réglage de cette carte, avec le changement.
    const ancienReglage = donnees.cartes[alias];
    const nouveauReglage = { ...ancienReglage, ...patch };

    // Niveau 2 : toutes les cartes, avec ce réglage remplacé.
    // CONCEPT : [alias] entre crochets est une "clé calculée" : la clé de la propriété est
    // la VALEUR de la variable alias ("sorciere"), et non le mot "alias".
    const nouvellesCartes = { ...donnees.cartes, [alias]: nouveauReglage };

    // Niveau 1 : tous les réglages, avec les cartes remplacées.
    const nouvellesDonnees = { ...donnees, cartes: nouvellesCartes };

    modifier(nouvellesDonnees);
  }

  /**
   * Modifie un ou plusieurs champs d'un joueur.
   * @param id    le joueur à modifier
   * @param patch les champs à changer, ex. { nom: "Alice" }
   */
  function reglerJoueur(id: string, patch: Partial<JoueurProfil>) {
    // On reconstruit la liste des joueurs : le joueur concerné est remplacé par une copie
    // modifiée, les autres sont repris tels quels (mêmes objets).
    // CONCEPT : map() garde la longueur et l'ordre de la liste : c'est l'outil pour
    // "remplacer un élément" sans modifier le tableau d'origine.
    const nouveauxJoueurs = donnees.joueurs.map(joueur => {
      if (joueur.id !== id) {
        return joueur;
      }
      const joueurModifie = { ...joueur, ...patch };
      return joueurModifie;
    });

    modifier({ ...donnees, joueurs: nouveauxJoueurs });
  }

  /** Ajoute un joueur en fin de liste, et l'assoit à la table. */
  function ajouterJoueur() {
    const numero = donnees.joueurs.length + 1;
    const nouveauJoueur: JoueurProfil = { id: nouvelId(), nom: `Joueur ${numero}`, image: "" };

    // [...liste, element] : une nouvelle liste avec l'élément ajouté à la fin
    // (l'équivalent immuable de liste.push(element)).
    const nouveauxJoueurs = [...donnees.joueurs, nouveauJoueur];
    const nouvelleTable = [...donnees.table, nouveauJoueur.id];

    modifier({
      ...donnees,
      joueurs: nouveauxJoueurs,
      table: nouvelleTable,
      // POURQUOI vider la distribution : le nouveau joueur n'a pas de carte. Garder l'ancienne
      // distribution laisserait croire qu'elle est complète.
      distribution: {}
    });
  }

  /** Supprime un joueur des réglages ET de la table. */
  function supprimerJoueur(id: string) {
    // CONCEPT : filter() garde les éléments pour lesquels la fonction renvoie true.
    // Ici : tous les joueurs SAUF celui qu'on supprime (l'équivalent immuable de splice).
    const joueursRestants = donnees.joueurs.filter(joueur => joueur.id !== id);
    const tableSansLui = donnees.table.filter(idAssis => idAssis !== id);

    modifier({
      ...donnees,
      joueurs: joueursRestants,
      table: tableSansLui,
      distribution: {} // une carte était peut-être distribuée à ce joueur : on redistribuera
    });
  }

  return (
    <div className="page">
      <section>
        <h2>Cartes</h2>
        <p className="aide">
          Les règles de chaque carte sont dans <code>src/moteur/roles/</code>. Ici, on ne change que le titre, l'image et l'activation.
        </p>

        <div className="grille-cartes">
          {/* On parcourt les rôles du CODE (et non les réglages enregistrés) : ainsi un rôle
              ajouté dans roles/index.ts apparaît ici même s'il n'a jamais été réglé. */}
          {LISTE_ROLES.map(role => {
            // "??" : si cette carte n'a pas encore de réglage, on utilise { active: true }.
            const reglage = donnees.cartes[role.alias] ?? { active: true };

            // CONCEPT : closure. La fonction fléchée passée en `regler` "se souvient" de
            // role.alias : quand CarteReglable l'appellera avec un simple patch, c'est la
            // bonne carte qui sera modifiée. CarteReglable n'a pas besoin de connaître l'alias.
            return (
              <CarteReglable
                key={role.alias}
                role={role}
                reglage={reglage}
                regler={patch => reglerCarte(role.alias, patch)}
              />
            );
          })}
        </div>
      </section>

      <section>
        <h2>Joueurs</h2>
        <ul className="liste-joueurs">
          {donnees.joueurs.map(joueur => (
            <LigneJoueur
              key={joueur.id}
              joueur={joueur}
              regler={patch => reglerJoueur(joueur.id, patch)}
              supprimer={() => supprimerJoueur(joueur.id)}
            />
          ))}
        </ul>
        <button className="bouton" onClick={ajouterJoueur}>+ Ajouter un joueur</button>
      </section>
    </div>
  );
}

/* =====================================================================================
 *  Une carte
 * ===================================================================================== */

/**
 * Affiche une carte et ses réglages modifiables.
 *
 * @param role    le rôle tel qu'il est défini dans le code (titre et image PAR DÉFAUT, camp...)
 * @param reglage les réglages enregistrés de cette carte (titre et image PERSONNALISÉS, active)
 * @param regler  à appeler avec les champs à changer ; c'est la page qui fait la modification
 */
function CarteReglable({
  role,
  reglage,
  regler
}: {
  role: Role;
  reglage: CarteReglage;
  regler: (patch: Partial<CarteReglage>) => void;
}) {
  // L'image personnalisée si elle existe, sinon celle du code.
  // ATTENTION : "||" et pas "??". Avec "??", une image vide ("") serait gardée et la carte
  // n'aurait plus d'image. Avec "||", une chaîne vide est considérée comme "pas d'image"
  // et on revient à l'image du code.
  const imageAffichee = reglage.image || role.image;

  // Le bouton "Réinitialiser" n'apparaît que s'il y a quelque chose à réinitialiser.
  // Boolean(...) transforme la valeur en vrai/faux : "" et undefined deviennent false.
  const estPersonnalisee = Boolean(reglage.image) || Boolean(reglage.titre);

  // Une carte désactivée est grisée.
  const classesCarte = reglage.active ? "carte" : "carte carte-inactive";
  const libelleActivation = reglage.active ? "Activée" : "Désactivée";

  return (
    <article className={classesCarte}>
      <div className="carte-entete">
        <Visuel src={imageAffichee} nom={role.titre} taille={64} />
        <label className="interrupteur">
          {/* CONCEPT : champ contrôlé. `checked` vient des réglages, et onChange demande le
              changement. La case n'est cochée/décochée qu'APRÈS le nouveau rendu : c'est
              l'état React qui fait foi, pas le navigateur. */}
          <input
            type="checkbox"
            checked={reglage.active}
            onChange={evenement => regler({ active: evenement.target.checked })}
          />
          <span>{libelleActivation}</span>
        </label>
      </div>

      {/* Le titre du code est affiché en placeholder (texte grisé) tant que le champ est vide :
          on voit ainsi le titre par défaut sans qu'il soit enregistré comme personnalisé. */}
      <input
        className="champ"
        value={reglage.titre ?? ""}
        placeholder={role.titre}
        onChange={evenement => regler({ titre: evenement.target.value })}
        aria-label={`Titre de ${role.titre}`}
      />

      <p className="carte-description">{role.description}</p>

      {/* Informations du code, en lecture seule. */}
      <div className="badges">
        <span className="badge">alias : {role.alias}</span>
        <span className={`badge camp-${role.camp}`}>{LIBELLES_CAMPS[role.camp]}</span>
        {role.appelNuit && <span className="badge">priorité {role.priorite}</span>}
        {role.appelNuit && <span className="badge">{libelleTours(role.tours)}</span>}
      </div>

      <div className="actions">
        <ChoixImage onImage={image => regler({ image: image })} />
        {estPersonnalisee && (
          // Remettre titre et image à undefined : l'affichage reviendra aux valeurs du code.
          <button
            className="bouton bouton-discret"
            onClick={() => regler({ image: undefined, titre: undefined })}
          >
            Réinitialiser
          </button>
        )}
      </div>
    </article>
  );
}

/* =====================================================================================
 *  Un joueur
 * ===================================================================================== */

/**
 * Une ligne de la liste des joueurs : image, nom modifiable, choix d'image, suppression.
 *
 * @param joueur    le joueur affiché
 * @param regler    à appeler avec les champs à changer
 * @param supprimer à appeler pour retirer le joueur
 */
function LigneJoueur({
  joueur,
  regler,
  supprimer
}: {
  joueur: JoueurProfil;
  regler: (patch: Partial<JoueurProfil>) => void;
  supprimer: () => void;
}) {
  return (
    <li>
      <Visuel src={joueur.image} nom={joueur.nom} taille={44} />
      <input
        className="champ"
        value={joueur.nom}
        onChange={evenement => regler({ nom: evenement.target.value })}
        aria-label="Nom du joueur"
      />
      <ChoixImage onImage={image => regler({ image: image })} />
      <button className="bouton bouton-danger" onClick={supprimer} aria-label={`Supprimer ${joueur.nom}`}>
        ✕
      </button>
    </li>
  );
}
