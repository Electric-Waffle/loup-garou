/* =====================================================================================
 *  TEMPLATE DE RÔLE
 * =====================================================================================
 *
 *  Ce fichier n'est PAS enregistré dans roles/index.ts : il ne sert que de modèle.
 *  Pour créer un nouveau rôle :
 *
 *    1. Copier ce fichier en  src/moteur/roles/<alias>.ts   (ex. corbeau.ts)
 *    2. Remplir les champs d'identité (alias, titre, image, camp, description).
 *    3. Garder uniquement les méthodes dont le rôle a besoin, supprimer les autres.
 *    4. L'enregistrer dans src/moteur/roles/index.ts (import + ajout dans LISTE_ROLES).
 *    5. Vérifier la liste "AUTRES FICHIERS À MODIFIER" plus bas.
 *    6. Écrire un test dans src/moteur/scenario.test.ts, puis lancer `npm test`.
 *
 *  Le rôle apparaît alors automatiquement :
 *    - dans la page Options (titre, image et activation modifiables) ;
 *    - dans la distribution des cartes (un exemplaire, s'il est activé) ;
 *    - dans la file de la nuit, s'il a `appelNuit: true` et une méthode `decision()`.
 *
 * -------------------------------------------------------------------------------------
 *  RAPPEL : LE CYCLE DONNER / RECEVOIR
 * -------------------------------------------------------------------------------------
 *
 *    1. Carte montrée       → le moteur appelle  decision()   (ce que voit le meneur)
 *    2. Décision du meneur  → le meneur choisit une option et ses cibles
 *    3. DONNER              → le moteur appelle  agir()       (tags donnés + infos)
 *    4. RECEVOIR            → pour chaque tag donné, le moteur appelle donnerTag() :
 *                               a. recevoir() du rôle du RECEVEUR (peut intercepter)
 *                               b. sinon, le switch des règles générales (recevoir.ts)
 *                               c. si le tag est accepté : reagir() du rôle du receveur
 *
 *  Ensuite, à l'aube, aube.ts transforme certains tags en conséquences
 *  (ex. "mordu" → "mort"), en repassant par le MÊME donnerTag().
 *
 * -------------------------------------------------------------------------------------
 *  OÙ METTRE UNE RÈGLE ?
 * -------------------------------------------------------------------------------------
 *
 *  | La règle dépend de…                         | Où l'écrire                         |
 *  |---------------------------------------------|-------------------------------------|
 *  | ce que CE rôle décide de faire              | agir() de ce rôle                   |
 *  | la carte du joueur qui REÇOIT un tag        | recevoir() du rôle qui reçoit       |
 *  | ce qui se passe APRÈS qu'un tag est accepté | reagir() du rôle qui reçoit         |
 *  | les tags déjà présents sur le receveur      | un `case` dans recevoir.ts          |
 *  | le passage de la nuit au jour               | le tableau CONSEQUENCES de aube.ts  |
 *
 * -------------------------------------------------------------------------------------
 *  AUTRES FICHIERS À MODIFIER (selon les besoins du rôle)
 * -------------------------------------------------------------------------------------
 *
 *  OBLIGATOIRE
 *    src/moteur/roles/index.ts
 *        → importer le rôle et l'ajouter dans LISTE_ROLES.
 *
 *  SI LE RÔLE INVENTE UN NOUVEAU TAG
 *    src/moteur/recevoir.ts
 *        → ajouter un `case "<tag>":` dans le switch de donnerTag() si le tag a une règle
 *          générale (il peut être bloqué, il dure plus longtemps, il déclenche une chaîne…).
 *          Sans `case`, le tag est simplement accepté (branche `default`).
 *    src/moteur/aube.ts
 *        → ajouter une ligne dans CONSEQUENCES si le tag doit devenir autre chose à l'aube.
 *          L'ORDRE DES LIGNES COMPTE : elles sont traitées de haut en bas.
 *    src/ui/PartieVue.tsx
 *        → ajouter un libellé lisible dans le dictionnaire TAGS (ex. corbeau: "🐦‍⬛ +2 voix").
 *          Sans libellé, l'interface affiche le nom brut du tag.
 *
 *  SI LE TAG DOIT DURER AU-DELÀ DE L'AUBE
 *    src/moteur/types.ts
 *        → ajouter le moment d'expiration dans Meta.expire (ex. "aube" | "fin_vote").
 *    src/moteur/partie.ts
 *        → retirer les tags qui expirent à ce moment (ex. au début de nuitSuivante()).
 *
 *  SI LE RÔLE A BESOIN D'UN NOUVEAU TYPE DE CIBLE
 *    src/moteur/types.ts
 *        → ajouter une valeur à TypeCible (ex. "un_mort" pour une nécromancienne).
 *    src/moteur/partie.ts
 *        → ajouter le `case` correspondant dans ciblesPossibles() (qui peut être choisi ?)
 *          et dans la fonction nbCibles() (combien de cibles faut-il ?).
 *
 *  SI LE RÔLE TUE OU FAIT MOURIR AVEC UNE NOUVELLE CAUSE
 *    src/ui/PartieVue.tsx
 *        → ajouter la cause dans le dictionnaire CAUSES, utilisé par le rapport.
 *
 *  SI LE RÔLE APPARTIENT À UN NOUVEAU CAMP OU GAGNE SEUL
 *    src/moteur/types.ts
 *        → ajouter le camp dans le type Camp, si "village" | "loups" | "solo" ne suffit pas.
 *    src/moteur/victoire.ts
 *        → ajouter sa condition de victoire dans verifierVictoire().
 *    src/ui/Options.tsx
 *        → ajouter le libellé du camp dans CAMPS, et une couleur .camp-<camp> dans styles.css.
 *
 *  SI LE RÔLE DOIT EXISTER EN PLUSIEURS EXEMPLAIRES (comme le loup)
 *    src/moteur/distribution.ts
 *        → adapter composer(), qui ne met aujourd'hui qu'un exemplaire de chaque rôle spécial.
 *
 *  SI LE RÔLE CHANGE LE DÉROULÉ D'UNE PHASE (vote, débat…)
 *    src/moteur/partie.ts      → les méthodes de phase (voter(), ouvrirVote()…).
 *    src/ui/PartieVue.tsx      → le composant EtapeDeJour, qui affiche chaque phase.
 *
 * ===================================================================================== */

import type { Partie } from "../partie";
import type {
  ChoixFait,
  Decision,
  Issue,
  Joueur,
  Meta,
  Reponses,
  ResultatAction,
  Role
} from "../types";

/**
 * L'alias est défini une seule fois ici, puis réutilisé partout dans le fichier
 * (champ `alias`, mettreEnAttente(), partie.titre()…) pour éviter les fautes de frappe.
 */
const ALIAS = "template";

const template: Role = {
  /* ===================================================================================
   *  IDENTITÉ
   * =================================================================================== */

  /**
   * Identifiant technique, unique et IMMUABLE.
   * - En minuscules, sans espace ni accent (ex. "loup-blanc", "corbeau").
   * - Il relie ce fichier, le registre (roles/index.ts) et les réglages enregistrés
   *   par la page Options. Le changer plus tard ferait perdre le titre et l'image personnalisés.
   */
  alias: ALIAS,

  /**
   * Titre et image PAR DÉFAUT. La page Options peut les remplacer :
   * dans le code, utiliser partie.titre(alias) et partie.image(alias) pour afficher
   * la version personnalisée, jamais role.titre directement.
   * L'image peut être un emoji, une URL ou une data-URL.
   */
  titre: "Template",
  image: "❓",

  /**
   * Camp du rôle : "village", "loups", "solo", "fou", "aberration" ou "skinwalker".
   * Utilisé par victoire.ts pour compter les loups vivants et décider du vainqueur.
   */
  camp: "village",

  /** Texte affiché sur la carte dans la page Options. */
  description: "Décrire ici la règle du rôle en une ou deux phrases.",

  /* ===================================================================================
   *  APPEL LA NUIT
   * =================================================================================== */

  /**
   * true  → le meneur appelle cette carte pendant la nuit (il faut aussi une méthode decision()).
   * false → la carte n'est jamais appelée la nuit (Villageois, Ancien, Chasseur…).
   *         Elle peut quand même agir via recevoir(), reagir() ou une décision en attente.
   */
  appelNuit: false,

  /**
   * Ordre d'appel la nuit : le plus petit joue en premier.
   * Toujours une dizaine (10, 20, 30…) : un nouveau rôle s'insère entre deux avec un nombre
   * simple (ex. 125), sans décimales. Absente : la carte joue en fin de nuit.
   * Valeurs actuelles, pour situer le nouveau rôle :
   *    10  Fée                     (avant toute carte qu'elle pourrait bloquer)
   *    12  Conciliabule des maudits (étape)
   *    15  Pleureuse               (tôt : le maudit perd son rôle dès cette nuit)
   *    20  Arlequin
   *    25  Aberration
   *    50  Cupidon
   *    60  Réunion des amoureux    (après tous les liens)
   *    70  Prêtre
   *    72  Beau Parleur (nuit 1 : son camp, avant les loups)
   *    80  Voyante
   *    85  Stratège
   *    90  Bâtisseur
   *   100  Salvateur               (doit protéger AVANT que les loups mordent)
   *   102  Loup amoureux           ┐
   *   105  Loup succube            │ APRÈS le Salvateur : sa protection fait échouer
   *   107  Loup voyante            │ le lien, la vision ou le médaillon
   *   108  Loup salamandre
   *   110  Loup savant
   *   115  Loup hypnotiseur        ┘
   *   120  Loup-Garou
   *   124  Loup barbare            (après la meute, avant la Sorcière qui doit voir sa victime)
   *   126  Skinwalker              (après le Salvateur, dont la protection le fait échouer)
   *   125  Corbeau                 (si ajouté)
   *   130  Sorcière                (doit voir les mordus, donc APRÈS les loups)
   * Ignoré si appelNuit vaut false.
   */
  priorite: 140,

  /**
   * Champ optionnel : à quelles nuits le rôle peut agir. Supprimer la ligne = toutes les nuits.
   *   { de: 2 }             → à partir de la nuit 2
   *   { de: 1, a: 1 }       → uniquement la nuit 1 (comme Cupidon)
   *   { de: 3, a: 3 }       → uniquement la nuit 3
   *   { de: 2, chaque: 2 }  → nuits 2, 4, 6…
   * La vérification est faite par peutAgir(), dans tours.ts.
   */
  // tours: { de: 1 },

  /**
   * Cartes de groupe que ce rôle joue AUSSI, en plus de la sienne.
   *   ["loup"] → il se réveille et vote avec les loups (comme le Loup succube).
   * Lu par partie.porteursDe() et commencerNuit().
   */
  // rejoint: ["loup"],

  /**
   * Champ optionnel, pour une ÉTAPE de la nuit qu'aucun joueur ne reçoit (ex. Réunion des amoureux) :
   * renvoie les joueurs qui se réveillent pour elle, recalculés à son tour de jouer (vide = sautée).
   * Une telle carte entre dans la file de chaque nuit. L'enregistrer dans ETAPES (roles/index.ts),
   * pas dans LISTE_ROLES, pour qu'elle n'apparaisse ni dans Options ni dans la distribution.
   */
  // porteurs: (partie) => partie.joueursAvecTag("amoureux"),

  /* ===================================================================================
   *  MÉMOIRE DU RÔLE
   * =================================================================================== */

  /**
   * État propre au rôle, créé au début de la partie et rangé dans joueur.memoire.
   * À utiliser pour tout ce qui doit se souvenir d'une nuit à l'autre :
   * potions déjà utilisées, nombre de vies, dernier joueur ciblé…
   *
   * Lecture / écriture dans les autres méthodes : moi.memoire.<clé>
   *
   * Exemple (Sorcière) : return { potionVie: true, potionMort: true };
   */
  init(): Record<string, any> {
    return {};
  },

  /**
   * Au lancement, avant la nuit 1 : ce que le rôle DONNE, comme agir().
   * Différence avec init() : un TAG est visible de tous les rôles et peut changer de main.
   *
   * Exemple (Marchand) : return { donner: [{ tag: "or", a: moi.id }] };
   */
  debut(partie: Partie, moi: Joueur): ResultatAction | void {
    // Par défaut : rien.
  },

  /* ===================================================================================
   *  ÉTAPES 1-2 : decision()
   *  Appelée quand la carte est montrée (la nuit, ou pour une décision en attente).
   *  Elle ne modifie RIEN : elle décrit seulement ce que le meneur voit et peut choisir.
   * =================================================================================== */

  /**
   * @param partie  l'état complet de la partie (voir la boîte à outils en bas du fichier)
   * @param moi     le joueur qui porte ce rôle (pour les loups : le premier loup vivant)
   * @returns       un message pour le meneur et la liste des choix possibles
   *
   * Types de cible disponibles (champ `cible` d'un choix) :
   *   "aucune"        → pas de cible, le choix est validé dès le clic
   *   "un_joueur"     → un joueur vivant, y compris soi-même
   *   "un_autre"      → un joueur vivant, sauf soi-même
   *   "un_mordu"      → un joueur vivant qui porte le tag "mordu"
   *   "deux_joueurs"  → deux joueurs vivants distincts
   *   "n_importe_qui" → n'importe quel joueur, MORTS COMPRIS
   *
   * L'interface ajoute d'elle-même un bouton "Passer" pour les cartes appelées la nuit.
   */
  decision(partie: Partie, moi: Joueur): Decision {
    // Exemple : construire les choix selon la mémoire du rôle.
    //   const choix = [];
    //   if (moi.memoire.chargesRestantes > 0) choix.push({ id: "agir", label: "Agir", cible: "un_autre" });
    //   choix.push({ id: "rien", label: "Ne rien faire", cible: "aucune" });

    // Exemple : montrer une information au meneur dans le message.
    //   const mordus = partie.joueursAvecTag("mordu").map(j => j.nom).join(", ");

    return {
      message: `${partie.titre(ALIAS)} (${moi.nom}) se réveille.`,
      choix: [
        { id: "agir", label: "Agir", cible: "un_autre" },
        { id: "rien", label: "Ne rien faire", cible: "aucune" }
      ]
    };
  },

  /* ===================================================================================
   *  ÉTAPE 3 : agir()  —  DONNER
   *  Appelée quand le meneur valide un choix.
   *  Elle renvoie ce que le rôle DONNE (des tags) et ce qu'il APPREND (des infos).
   *  C'est le moteur (donner.ts) qui distribue ensuite les tags via donnerTag().
   * =================================================================================== */

  /**
   * @param choix   { id: l'id du choix cliqué, cibles: les ids des joueurs sélectionnés }
   *                Le nombre de cibles est déjà vérifié par le moteur selon le type de cible.
   * @param partie  l'état de la partie
   * @param moi     le joueur qui porte ce rôle
   * @returns       { donner?: [...], infos?: [...] }  — ou {} pour ne rien faire
   *
   * Format d'un tag donné :
   *   { tag: "nom_du_tag", a: "<id du joueur>", meta: { ...métadonnées libres } }
   *   - `source` est ajoutée automatiquement (= l'alias de ce rôle).
   *   - `cause` est la métadonnée lue pour expliquer une mort (rapport, Ancien…).
   *   - Pour tuer directement : { tag: "mort", a: id, meta: { cause: "<cause>" } }
   *
   * Format d'une info :
   *   { pour: "<id du joueur>", texte: "..." }  → info privée (voyante…)
   *   { pour: "tous",           texte: "..." }  → info publique, affichée le jour
   */
  agir(choix: ChoixFait, partie: Partie, moi: Joueur): ResultatAction {
    switch (choix.id) {
      case "agir": {
        const idCible = choix.cibles[0];
        const cible = partie.joueur(idCible);

        // Exemple de mémoire : se souvenir de la dernière cible.
        moi.memoire.derniereCible = idCible;

        return {
          donner: [{ tag: "exemple", a: idCible, meta: { cause: ALIAS } }],
          infos: [{ pour: moi.id, texte: `Tu as agi sur ${cible.nom}.` }]
        };
      }

      default:
        // "rien" ou tout autre choix : on ne donne rien.
        return {};
    }
  },

  /* ===================================================================================
   *  ÉTAPE 4a : recevoir()  —  QUAND LE JOUEUR QUI A CE RÔLE REÇOIT UN TAG
   *  Appelée AVANT les règles générales de recevoir.ts.
   *  - Renvoyer une Issue (via r.xxx()) : le tag est traité ici, les règles générales
   *    ne s'exécutent PAS (ni la chaîne des amoureux, ni le blocage par protection…).
   *  - Ne rien renvoyer : on laisse les règles générales décider.
   *
   *  ⚠️ Pour simplement déclencher quelque chose APRÈS une mort ou un tag accepté,
   *     utiliser reagir() plutôt que recevoir() : sinon on court-circuite les règles générales.
   * =================================================================================== */

  /**
   * @param tag     le nom du tag reçu (ex. "mordu", "mort", "corbeau")
   * @param meta    ses métadonnées (source, cause, et tout ce que le donneur a ajouté)
   * @param r       les cinq réponses possibles :
   *                  r.accepter(opts?)           → le tag est posé (opts : expire…)
   *                  r.bloquer("raison")         → le tag n'est pas posé
   *                  r.consommer("raison")       → le tag est "utilisé" sans être posé
   *                  r.transformer("autre", m?)  → on pose un autre tag à la place
   *                  r.rediriger(autreJoueur)    → le même tag part vers un autre joueur
   *                Chaque réponse écrit une entrée dans le journal.
   * @param partie  l'état de la partie
   * @param moi     le joueur qui reçoit (celui qui porte ce rôle)
   */
  recevoir(tag: string, meta: Meta, r: Reponses, partie: Partie, moi: Joueur): Issue | void {
    // Exemple (Ancien) : survivre une fois à une mort par morsure.
    //   if (tag === "mort" && meta.cause === "mordu" && !partie.aTag(moi, "vie_perdue")) {
    //     return r.transformer("vie_perdue");
    //   }

    // Exemple : renvoyer une morsure vers un voisin.
    //   if (tag === "mordu") {
    //     const autre = partie.auHasard(partie.vivants().filter(j => j.id !== moi.id));
    //     if (autre) return r.rediriger(autre);
    //   }

    // Exemple : être immunisé au poison.
    //   if (tag === "empoisonne") return r.bloquer("immunisé au poison");

    // Par défaut : ne rien renvoyer, les règles générales s'appliquent.
    return undefined;
  },

  /* ===================================================================================
   *  APRÈS COUP : reagir()  —  UN TAG A ÉTÉ ACCEPTÉ SUR LE JOUEUR QUI A CE RÔLE
   *  Appelée juste après qu'un tag a été posé (r.accepter()).
   *  Elle ne peut plus empêcher le tag : elle sert à déclencher une suite.
   * =================================================================================== */

  /**
   * @param tag     le tag qui vient d'être accepté
   * @param meta    ses métadonnées
   * @param partie  l'état de la partie
   * @param moi     le joueur qui a reçu le tag
   *
   * Outil principal : partie.mettreEnAttente(ALIAS, moi)
   *   → crée une DÉCISION URGENTE : l'interface affiche aussitôt la carte de ce rôle,
   *     avec les choix renvoyés par decision(), et le choix validé passe par agir().
   *     Elle passe avant tout le reste, quelle que soit la phase (nuit, aube, vote…).
   */
  reagir(tag: string, meta: Meta, partie: Partie, moi: Joueur): void {
    // Exemple (Chasseur) : en mourant, ouvrir une décision pour tirer sur quelqu'un.
    //   if (tag === "mort") partie.mettreEnAttente(ALIAS, moi);
    // Par défaut : rien ne se déclenche.
  },

  /* ===================================================================================
   *  À L'AUBE : aube()  —  APRÈS LES CONSÉQUENCES DES TAGS DE LA NUIT
   *  Appelée pour chaque joueur VIVANT qui a ce rôle, une fois les morts de l'aube connus.
   *  Sert aux règles qui dépendent de l'état de la partie, pas d'un tag reçu.
   * =================================================================================== */

  /**
   * Comme agir() : renvoie ce que le rôle DONNE, sans rien modifier lui-même.
   * Exemple (Rat-garou) : s'il est le dernier à voter avec les loups, il se donne "mort".
   */
  aube(partie: Partie, moi: Joueur): ResultatAction | void {
    // Par défaut : rien.
  },

  /* ===================================================================================
   *  APRÈS LE VOTE : apresVote()  —  LE VILLAGE VIENT D'ÉLIMINER QUELQU'UN
   *  Appelée pour chaque joueur VIVANT qui a ce rôle, seulement si la mort par vote a eu lieu.
   * =================================================================================== */

  /**
   * Comme reagir() : ne renvoie rien, agit via partie.mettreEnAttente() ou appliquerResultat().
   * Exemple (Fêtard) : si l'éliminé est un loup, le meneur indique s'il a voté contre lui.
   */
  apresVote(partie: Partie, moi: Joueur, elimine: Joueur): void {
    // Par défaut : rien.
  }
};

export default template;

/* =====================================================================================
 *  BOÎTE À OUTILS : CE QUE L'OBJET `partie` MET À DISPOSITION
 * =====================================================================================
 *
 *  LIRE L'ÉTAT
 *    partie.tour                         numéro du tour en cours (la nuit 1 = tour 1)
 *    partie.phase                        "nuit" | "aube" | "evenement" | "debat" | "vote" | "resultat_vote" | "fin"
 *    partie.joueurs                      tous les joueurs, morts compris
 *    partie.vivants()                    les joueurs vivants
 *    partie.joueur(id)                   un joueur par son id (erreur si inconnu)
 *    partie.joueursAvecRole(alias)       les joueurs VIVANTS qui ont ce rôle
 *    partie.porteursDe(alias)            idem, plus ceux dont le rôle rejoint cette carte
 *    partie.joueursAvecTag(tag)          les joueurs VIVANTS qui portent ce tag
 *    partie.aTag(joueur, tag)            vrai si le joueur porte ce tag
 *    partie.partenairesDe(joueur)        ses amoureux (tag "amoureux", réseau), liste vide sinon
 *    partie.roleDe(joueur)               l'objet Role de sa carte (pour lire son camp…)
 *    partie.titre(alias) / image(alias)  titre et image, en tenant compte des Options
 *    partie.ciblesPossibles(type, moi)   les joueurs sélectionnables pour un type de cible (restreints si moi est lié par l'Arlequin)
 *    partie.auHasard(liste)              un élément tiré au sort (undefined si liste vide)
 *    partie.journal                      toutes les entrées du journal
 *
 *  AGIR (à utiliser avec prudence)
 *    partie.mettreEnAttente(alias, moi)  ouvre une décision urgente (voir reagir())
 *    partie.ajouterInfo({ pour, texte }) ajoute une info, comme le ferait agir()
 *    partie.retirerTag(joueur, tag)      retire un tag SANS passer par donner/recevoir.
 *                                        Préférer donner un tag qui le retire (comme "sauve"),
 *                                        pour que le receveur ait son mot à dire et que
 *                                        l'opération soit tracée dans le journal.
 *
 *  TAGS EXISTANTS (pour s'en servir ou réagir dessus)
 *    mordu         posé par le Loup ; devient "mort" (cause "mordu") à l'aube
 *    protege       posé par le Salvateur ou un événement ; bloque "mordu" ; expire à l'aube
 *    protege_hier  posé à l'aube si le Salvateur avait protégé ; bloque "protege" une nuit
 *    sauve         donné par la Sorcière ; retire "mordu" puis est consommé
 *    empoisonne    donné par la Sorcière ; devient "mort" (cause "poison") à l'aube
 *    amoureux      Cupidon, Loup amoureux, Loup succube ; meta.partenaires (liste, réseau) meurent de chagrin avec le porteur ; liste absente = sens unique
 *    vie_perdue    posé sur l'Ancien qui a survécu à une morsure
 *    impuissant    donné par l'Ancien éliminé au vote à tous les non-loups vivants ; bloquant, sans expiration
 *    horrifie      Aberration ; loups tous horrifiés = pas de chasse, villageois tous horrifiés = pas de vote ;
 *                  retiré à tous à la mort de l'Aberration
 *    ignifuge      Loup salamandre ; une mort par vote est bloquée, APRÈS l'or (recevoir.ts) ; expire "aube_suivante"
 *    possede       Loup-démon brûlé au vote ; marque le villageois qui devient Loup-Garou ("devient")
 *    catatonique   voyante qui a vu l'Aberration ; bloquant, devient "mort" (cause "horreur") à l'aube
 *    mort          tue le joueur (joueur.vivant = false) ; meta.cause explique pourquoi
 *    or            donné au Marchand ; rachète un vote, passe au tueur à la mort (recevoir.ts)
 *    blesse        posé sur les loups par le Paysan dévoré ; la carte Loup ne chasse pas
 *    silence       Loup hypnotiseur (meta.par) ; au vote, son vote ne compte pas ; expire "aube_suivante"
 *    dirige        Loup hypnotiseur (meta.par) ; au vote, il vote comme l'hypnotiseur ; expire "aube_suivante"
 *    imite         Skinwalker ; meta.role = la carte volée, qu'il joue en plus de la sienne
 *    fete          Fêtard ; bloque "mordu" (son recevoir) ; posé le jour, expire à l'aube
 *    benediction   événement ; retire "protege_hier" et donne "protege" au nom du Salvateur
 *    recharge      événement Marché noir ; un rôle à charges le reçoit dans son recevoir()
 *    sauf_conduit  événement ; ne peut pas être éliminé au vote du jour (voter() refuse)
 *    soupcon       événement ; rappel au vote : 2 voix contre lui, le maire ne vote pas
 *    eclaire       événement ; la Voyante et le Loup voyante ne voient que ce joueur cette nuit
 *    maudit        Pleureuse ; le porteur ne fait plus son rôle (TAGS_BLOQUANTS, partie.ts), sans expiration
 *    delivre       Conciliabule ; retire "maudit" puis est consommé (comme "sauve" pour "mordu")
 *    apaisee       Conciliabule, sur la Pleureuse démasquée ; elle ne marque plus personne
 *    renforce      posé par le Bâtisseur ; toutes les maisons villageoises vivantes = victoire
 *    invulnerable  donné au Loup vampire ; bloque toute mort sauf le vote du village (recevoir.ts)
 *
 *  CAUSES DE MORT EXISTANTES
 *    "mordu", "poison", "chagrin", "chasseur", "vote"
 * ===================================================================================== */
