/* =====================================================================================
 *  stockage.ts — le seul fichier qui sait OÙ sont rangés les réglages
 * =====================================================================================
 *
 *  Rôle : lire et écrire les réglages de l'application (joueurs, cartes, table,
 *  distribution, durée du débat). Aucun composant ne touche au localStorage directement.
 *
 *  Déroulé :
 *    1. Au démarrage, App.tsx appelle charger() une seule fois (useState(charger)).
 *    2. À chaque modification des réglages, App.tsx appelle sauver() (dans un useEffect).
 *    3. Options.tsx appelle lireImage() quand l'utilisateur choisit une image.
 *
 *  PATTERN : Dépôt (Repository), proche du DAO que tu connais.
 *  POURQUOI : aujourd'hui les données sont dans le navigateur ; demain elles seront dans
 *  SQLite derrière une API Express. Grâce à ce fichier, ce changement ne touchera que
 *  charger() et sauver(), sans modifier une seule page.
 *  ATTENTION : un appel réseau est asynchrone (fetch renvoie une promesse). Le jour où
 *  charger() appellera l'API, il faudra adapter App.tsx pour attendre la réponse
 *  (un état "chargement en cours", puis l'appel dans un useEffect).
 * ===================================================================================== */

import { LISTE_ROLES, ROLES } from "../moteur/roles";

/* -------------------------------------------------------------------------------------
 *  Les formes des données enregistrées
 * ------------------------------------------------------------------------------------- */

/** Un joueur tel qu'il est enregistré dans les réglages (sans rôle : le rôle est tiré à chaque partie). */
export interface JoueurProfil {
  id: string;
  nom: string;
  image: string; // emoji, URL, data-URL, ou chaîne vide (l'initiale du nom sera affichée)
}

/**
 * Les réglages COSMÉTIQUES d'une carte. La logique de la carte, elle, est dans
 * src/moteur/roles/<alias>.ts et ne peut pas être modifiée depuis l'interface.
 * titre et image sont optionnels : absents (ou vides), on affiche les valeurs du code.
 */
export interface CarteReglage {
  titre?: string;
  image?: string;
  active: boolean;
}

/** Tout ce qui est enregistré. Un seul objet, pour pouvoir le sauver d'un bloc en JSON. */
export interface Donnees {
  joueurs: JoueurProfil[];
  cartes: Record<string, CarteReglage>;   // clé = alias du rôle, ex. cartes["sorciere"]
  table: string[];                        // ids des joueurs assis, dans l'ordre autour de la table
  distribution: Record<string, string>;   // clé = id du joueur, valeur = alias de sa carte
  dureeDebat: number;                     // en minutes
  nbLoups: number;                        // cartes du camp des loups à distribuer
  cartesFantomes: boolean;                // la nuit, appeler aussi les cartes activées non distribuées
}

/**
 * Les alias des cartes activées ET connues du code.
 * Utilisée par Preparation.tsx (distribution) et App.tsx (cartes hors jeu de la partie).
 *
 * Transformation en chaîne, étape par étape :
 *   Object.entries(donnees.cartes) → [["loup", { active: true }], ["voyante", { active: false }], ...]
 *   .filter(...)                   → on ne garde que les paires activées ET connues du code
 *   .map(...)                      → on ne garde que l'alias : ["loup", ...]
 */
export function cartesActives(donnees: Donnees): string[] {
  const toutesLesCartes = Object.entries(donnees.cartes);
  const cartesActivees = toutesLesCartes.filter(([alias, reglage]) => {
    const existeDansLeCode = ROLES[alias] !== undefined;
    // POURQUOI vérifier l'existence : les réglages enregistrés peuvent contenir un rôle
    // supprimé du code depuis. Le distribuer ferait planter le moteur ("Rôle inconnu").
    return reglage.active && existeDansLeCode;
  });
  return cartesActivees.map(([alias]) => alias);
}

/**
 * Nom de l'entrée dans le localStorage.
 * POURQUOI le suffixe ":v1" : si un jour la forme de Donnees change au point que les
 * anciennes données deviennent illisibles, il suffira de passer à ":v2" pour repartir
 * de zéro sans planter sur les vieilles données.
 */
const CLE = "loup-garou:donnees:v1";

/* -------------------------------------------------------------------------------------
 *  Valeurs par défaut
 * ------------------------------------------------------------------------------------- */

/**
 * Réglages d'une toute première utilisation : 8 joueurs, toutes les cartes activées.
 * Sert aussi de base pour compléter des données enregistrées incomplètes (voir charger()).
 */
function parDefaut(): Donnees {
  const noms = ["Alice", "Bob", "Chloé", "David", "Emma", "Hugo", "Inès", "Jules"];

  // Chaque nom devient un objet joueur avec un identifiant unique.
  // CONCEPT : map() renvoie un NOUVEAU tableau de même longueur, où chaque élément est
  // le résultat de la fonction. Ici : ["Alice", ...] → [{ id, nom: "Alice", image: "" }, ...]
  const joueurs: JoueurProfil[] = noms.map(nom => {
    const joueur: JoueurProfil = { id: nouvelId(), nom: nom, image: "" };
    return joueur;
  });

  // Une entrée de réglage par rôle connu du code, toutes activées.
  // CONCEPT : Object.fromEntries() fait l'inverse de Object.entries() :
  // il transforme une liste de paires [clé, valeur] en objet.
  //   étape 1 : LISTE_ROLES.map(...) → [["loup", { active: true }], ["voyante", { active: true }], ...]
  //   étape 2 : Object.fromEntries   → { loup: { active: true }, voyante: { active: true }, ... }
  const pairesAliasReglage = LISTE_ROLES.map(role => {
    const reglage: CarteReglage = { active: true };
    return [role.alias, reglage] as const; // "as const" : TypeScript garde le type exact de la paire
  });
  const cartes: Record<string, CarteReglage> = Object.fromEntries(pairesAliasReglage);

  // Au départ, tous les joueurs sont assis, dans l'ordre de la liste.
  const table = joueurs.map(joueur => joueur.id);

  return {
    joueurs: joueurs,
    cartes: cartes,
    table: table,
    distribution: {}, // aucune carte distribuée tant qu'on n'a pas cliqué "Distribuer"
    dureeDebat: 3,
    // ATTENTION : des réglages enregistrés avant ce champ n'ont pas de nbLoups.
    // charger() le complète avec cette valeur grâce à la fusion « ...defaut, ...lu ».
    nbLoups: 2,
    cartesFantomes: false
  };
}

/* -------------------------------------------------------------------------------------
 *  Lecture et écriture
 * ------------------------------------------------------------------------------------- */

/**
 * Lit les réglages enregistrés et les complète avec les valeurs par défaut.
 * Appelée UNE fois par App.tsx, au premier rendu.
 * Garantit de toujours renvoyer un objet Donnees complet, même si le stockage est vide,
 * corrompu ou inaccessible.
 */
export function charger(): Donnees {
  const defaut = parDefaut();

  // POURQUOI un try/catch : localStorage peut lever une erreur (navigation privée,
  // stockage bloqué) et JSON.parse lève une erreur si le texte enregistré est abîmé.
  // Dans les deux cas, on repart des valeurs par défaut plutôt que de planter la page.
  try {
    const texteEnregistre = localStorage.getItem(CLE);

    // Rien d'enregistré : première visite.
    if (!texteEnregistre) {
      return defaut;
    }

    // ATTENTION : "as Partial<Donnees>" ne vérifie RIEN à l'exécution. C'est une promesse
    // faite à TypeScript ("fais-moi confiance, ça a cette forme"). Si le JSON contient
    // n'importe quoi, TypeScript ne le saura pas. Pour une vraie validation, on utiliserait
    // une bibliothèque comme Zod.
    const lu = JSON.parse(texteEnregistre) as Partial<Donnees>;

    // FLUX : fusion en trois couches, de la moins prioritaire à la plus prioritaire.
    //   1. ...defaut : toutes les valeurs par défaut ;
    //   2. ...lu     : écrasées par ce qui a été enregistré (joueurs, table, durée...) ;
    //   3. cartes    : fusionnées À PART, une clé à la fois.
    // POURQUOI fusionner les cartes à part : avec seulement "...lu", lu.cartes remplacerait
    // ENTIÈREMENT defaut.cartes. Un rôle ajouté dans le code après le dernier enregistrement
    // n'existerait alors pas dans les réglages. En fusionnant clé par clé, il garde sa
    // valeur par défaut (activé) et apparaît tout seul dans la page Options.
    const cartesFusionnees = { ...defaut.cartes, ...lu.cartes };

    const donnees: Donnees = {
      ...defaut,
      ...lu,
      cartes: cartesFusionnees
    };
    return donnees;
  } catch {
    return defaut;
  }
}

/**
 * Enregistre tous les réglages d'un bloc.
 * Appelée par App.tsx à chaque changement de `donnees`.
 */
export function sauver(donnees: Donnees): void {
  try {
    const texte = JSON.stringify(donnees);
    localStorage.setItem(CLE, texte);
  } catch {
    // Stockage plein (images trop lourdes) ou indisponible : on n'interrompt pas l'utilisateur.
    // Le prototype continue à fonctionner en mémoire ; seul le prochain rechargement perdra les changements.
  }
}

/**
 * Fabrique un identifiant court, du genre "k3j9x0qa".
 * Appelée pour chaque nouveau joueur (ici et dans Options.tsx).
 */
export function nouvelId(): string {
  // Décomposition de l'astuce :
  //   Math.random()       → 0.7281374029...        un nombre au hasard entre 0 et 1
  //   .toString(36)       → "0.q7x3m2kd9..."        écrit en base 36 (chiffres 0-9 + lettres a-z)
  //   .slice(2, 10)       → "q7x3m2kd"              on retire "0." et on garde 8 caractères
  // ATTENTION : ce n'est pas un identifiant garanti unique, seulement très probablement
  // unique. Pour une dizaine de joueurs, le risque de collision est négligeable.
  // Alternative plus solide disponible dans les navigateurs récents : crypto.randomUUID().
  const nombreAuHasard = Math.random();
  const enBase36 = nombreAuHasard.toString(36);
  const identifiant = enBase36.slice(2, 10);
  return identifiant;
}

/* -------------------------------------------------------------------------------------
 *  Images choisies par l'utilisateur
 * ------------------------------------------------------------------------------------- */

/**
 * Lit un fichier image choisi par l'utilisateur et le réduit à `taille` pixels maximum
 * (sur son plus grand côté), puis renvoie l'image sous forme de data-URL
 * ("data:image/png;base64,iVBOR...") : une image entière écrite en texte, qu'on peut
 * mettre directement dans un <img src> ET enregistrer en JSON.
 *
 * Appelée par ChoixImage (Visuel.tsx).
 *
 * POURQUOI réduire : une photo de téléphone fait plusieurs Mo. Le localStorage est limité
 * à environ 5 Mo pour tout le site : sans réduction, deux ou trois photos suffiraient à le
 * remplir et sauver() échouerait silencieusement.
 *
 * FLUX : trois opérations asynchrones à la suite, chacune signalée par un "événement" :
 *   1. FileReader lit le fichier         → onload : on a une data-URL de l'image d'origine
 *   2. Image décode cette data-URL       → onload : on connaît sa largeur et sa hauteur
 *   3. un <canvas> redessine l'image en plus petit, puis on la ré-exporte en data-URL
 *
 * CONCEPT : transformer des "callbacks" en promesse.
 * FileReader et Image ne renvoient pas de promesse : ils appellent une fonction (onload,
 * onerror) quand ils ont fini. En les enveloppant dans `new Promise((resolve, reject) => ...)`,
 * on obtient une fonction qu'on peut attendre avec `await` :
 *   - appeler resolve(valeur) termine la promesse avec succès ;
 *   - appeler reject(erreur) la termine en erreur (le await lèvera alors une exception).
 */
export function lireImage(fichier: File, taille = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();

    // Étape 1 ratée : le fichier n'a pas pu être lu.
    lecteur.onerror = () => {
      reject(lecteur.error);
    };

    // Étape 1 réussie : le fichier est lu, on passe au décodage de l'image.
    lecteur.onload = () => {
      const img = new Image();

      // Étape 2 ratée : le fichier n'est pas une image valide.
      img.onerror = () => {
        reject(new Error("Image illisible"));
      };

      // Étape 2 réussie : on connaît les dimensions, on peut redimensionner.
      img.onload = () => {
        const plusGrandCote = Math.max(img.width, img.height);

        // Facteur de réduction. Math.min(1, ...) : on ne fait que RÉDUIRE.
        // Une petite image de 100 px donnerait 256 / 100 = 2.56 : on garde 1 (taille d'origine).
        const echelle = Math.min(1, taille / plusGrandCote);

        // Étape 3 : on redessine l'image dans un canvas aux nouvelles dimensions.
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * echelle);
        canvas.height = Math.round(img.height * echelle);

        // ATTENTION : getContext("2d") peut renvoyer null (si le navigateur refuse le canvas).
        // Le "!" dit à TypeScript "ce n'est pas null". C'est un pari raisonnable pour un
        // canvas qu'on vient de créer, mais ce serait un plantage si le pari était faux.
        const contexte2d = canvas.getContext("2d")!;
        contexte2d.drawImage(img, 0, 0, canvas.width, canvas.height);

        // On ré-exporte le contenu du canvas en texte, et la promesse se termine avec succès.
        const imageReduite = canvas.toDataURL("image/png");
        resolve(imageReduite);
      };

      // Ce qui déclenche l'étape 2 : donner la data-URL lue à l'objet Image.
      // lecteur.result est typé "string | ArrayBuffer" ; avec readAsDataURL, c'est forcément une string.
      img.src = lecteur.result as string;
    };

    // Ce qui déclenche l'étape 1. Tout le reste se passe dans les onload ci-dessus.
    // ATTENTION : cette ligne est volontairement APRÈS la définition de onload et onerror,
    // pour que les fonctions soient en place avant que la lecture ne commence.
    lecteur.readAsDataURL(fichier);
  });
}
