# Contexte du projet Loup-Garou (Paqari)

> Ce document résume tout le contexte du projet : ma façon de travailler, l'architecture, les décisions prises et l'état du code. Il est écrit pour être lu par Claude Code au début d'une session (ou placé à la racine du dépôt sous le nom `CLAUDE.md`).
> **Dernière mise à jour : 01/11/2026, branche `remote`.**

---

## 1. Qui je suis et comment je veux travailler

- **Sylvain Favre**, alternant développeur web et logiciel (BTS SIO SLAM), profil backend **PHP / Symfony**. Je fais ce projet pour **apprendre** : architecture, design patterns, React et TypeScript. **L'efficacité n'est pas la priorité, la compréhension l'est.**
- Je tiens un vault Obsidian de notes de compréhension. Les notes que tu me produis doivent être en **Markdown compatible Obsidian** (frontmatter, callouts `> [!note]`, liens `[[...]]`, diagrammes Mermaid).
- **Langue** : français, pour les réponses, les commentaires et les messages de commit.

### Règles de réponse
- Pas de compliments génériques. Si un contenu est bon, dis simplement qu'aucune erreur notable n'a été détectée.
- **Commente beaucoup.** Ne passe pas par des raccourcis : préfère une compréhension explicite à la place gagnée.
- Si un de mes choix est mauvais, conteste-le et propose deux meilleures alternatives. S'il est bon, valide-le.

### Style de code attendu : du code « d'étude »
- **Clean Code d'abord** : noms explicites, fonctions courtes. On ne compense jamais un mauvais nom par un commentaire.
- **On commente le POURQUOI, pas le QUOI.** Pas de paraphrase d'une ligne triviale.
- Un **en-tête « carte »** en haut de chaque fichier : son rôle, le déroulé en étapes numérotées, les patterns utilisés.
- Des **commentaires étiquetés** aux points clés :
  - `PATTERN :` nom du pattern et son rôle ici ;
  - `POURQUOI :` justification d'un choix, avec l'alternative écartée ;
  - `FLUX :` comment les éléments s'enchaînent ;
  - `ATTENTION :` piège, cas limite, effet de bord ;
  - `CONCEPT :` mécanisme du langage ou du framework (commentaire pédagogique, à retirer en production) ;
  - `RÉUTILISABLE :` bloc à reprendre ailleurs ;
  - `shortcut :` un raccourci assumé, à revoir si le besoin grandit.
- **Décomposer les one-liners** : les transformations en chaîne (`map` / `filter` / `reduce`…) et les ternaires imbriqués deviennent des étapes nommées. Indiquer ce que renvoie chaque étape.
- Après le code, une courte section **« Points d'étude »** : 3 à 5 notions à retenir, plus un petit exercice.
- Intensité réglable : léger / standard (« moyen ») / profond / production. Le dernier niveau demandé reste actif. **Niveau actuel : standard.**

### Mon niveau
- **Acquis, à nommer sans expliquer** :
  - POO, MVC, DAO, Adapter, Singleton, inversion de dépendance, Clean Code ;
  - Symfony : services, autowiring, events, subscribers, Doctrine ;
  - Git ;
  - React de base : composants, props, `useState`, `useEffect`, `useReducer`, contextes, `useCallback` / `useMemo`, `useRef`, closures.
- **En cours d'apprentissage, à expliquer en profondeur** :
  - les transformations en chaîne en JS (ce que renvoie chaque étape, immutabilité) ;
  - React avancé : cycle de rendu, re-renders, effets et leurs pièges (dépendances, nettoyage), état dérivé, composition, custom hooks ;
  - TypeScript : typage des props, génériques, unions ;
  - Next.js.
- **Pont utile** : je pense souvent en PHP. Une comparaison du type « c'est l'équivalent de `array_column($x, null, 'id')` » m'aide.

---

## 2. Le projet

Un site **local, en full JavaScript / TypeScript**, pour **préparer et animer des parties de Loup-Garou** du point de vue du **meneur** (une seule application, pilotée par le meneur, qui voit toutes les cartes).

- **Dépôt** : `Electric-Waffle/loup-garou` (privé).
  - `main` : le premier prototype (8 rôles).
  - `explication` : l'interface réécrite en version d'étude (commentaires, décompositions), puis toutes les nouvelles cartes et mécaniques.
  - `remote` : branche créée à partir de `explication`. Elle contient ce document à jour, et la vision des rôles par Cupidon et le Loup succube déplacée à la nuit 3.
- **Stack** : React 18, TypeScript (mode strict), Vite 8, `tsx` pour les tests (`node:test`, pas de Vitest).
- **Commandes** :
  - `npm run dev` : serveur de développement, accessible aussi depuis le téléphone via l'adresse réseau ;
  - `npm test` : scénarios du moteur (`src/moteur/scenario.test.ts`) ;
  - `npm run scenario` : affiche le journal du cas particulier ;
  - `npm run build` : `tsc --noEmit` puis `vite build`.
- **Stockage actuel** : `localStorage`, via un seul fichier, `src/ui/stockage.ts`. **Prévu plus tard** : une API Express + SQLite qui remplacera uniquement `charger()` et `sauver()`. Attention : ces fonctions deviendront asynchrones.

### Deux pages
1. **Options** : pour chaque carte, on peut modifier **seulement** le titre, l'image et l'activation. On gère aussi les joueurs (nom, image).
2. **Préparer** :
   - les joueurs présents autour d'une table ronde (échange de places par deux clics) ;
   - le **nombre de loups** ;
   - la case **« cartes fantômes »** ;
   - la distribution aléatoire des cartes activées : dans le camp des loups, loups spéciaux et Loups-Garous en proportion aléatoire ; un exemplaire de chaque autre rôle spécial ; complété par des villageois. Un bouton Redistribuer permet de recommencer ;
   - la durée du débat, puis le lancement.

### Le cycle d'une partie
Nuit (les cartes une par une, par priorité) → aube (conséquences des tags, crochets `aube()` des rôles, rapport) → **élection du maire** (seulement s'il n'y a pas de maire vivant) → **événement** (tiré au hasard ; « Un autre », « Passer » = Soleil ; appliqué seulement à la validation) → débat (minuteur, dont la durée peut venir de l'événement) → vote → résultat du vote → nuit suivante.

Si l'éliminé paie avec son or, le vote est annulé : **plaidoirie** (un nouveau débat où il parle seul), puis un nouveau vote.

La victoire est vérifiée après le rapport de l'aube (`suiteDeLAube()`) et au passage à la nuit suivante.

---

## 3. Décisions d'architecture (et pourquoi)

| Décision | Raison | Alternatives écartées |
| --- | --- | --- |
| **Cartes codées en dur**, un fichier par rôle | Simplicité, lisibilité | **Configurateur de comportements** (règles en JSON / mini-langage) : abandonné, trop complexe et code « boîte noire » |
| **Rôles = objets** respectant l'interface `Role`, avec des **crochets optionnels** appelés par le moteur | Un rôle prend juste ce dont il a besoin | **Héritage** `CarteInfo` / `CarteAction` (mon idée de départ) : un rôle rentre rarement dans une seule catégorie |
| **Moteur séparé de l'interface** (`src/moteur/` sans React, `src/ui/` sans règle de jeu) | Moteur testable sans navigateur, et déplaçable côté serveur plus tard | Logique dans les composants ; logique côté Express à chaque clic |
| **Architecture « donner / recevoir »** avec des tags (voir §4) | Aucun rôle ne connaît les autres | Résolveur avec un `switch` par carte (approche A), règles en données (B), intercepteurs portés par les tags (C) |
| **Chaque carte reste indépendante**, même au prix d'un peu de code copié (`contaminerLeMaire` dans Rat / Rat-garou) | Supprimer ou modifier une carte ne casse jamais l'autre | Une fonction partagée entre rôles |
| **Les règles valables pour tous les rôles vivent dans le moteur** (enchantement et malédiction, carte fantôme, lien de l'Arlequin, or) | Un nouveau rôle en profite sans une ligne de code | Les réécrire dans chaque rôle |
| **Journal** en ajout seul ; le rapport est **recalculé** depuis le journal | Rapport, débogage, base pour un futur « annuler » | Comparer l'état avant / après ; variables dédiées |
| **Moteur mutable + rendu forcé** (`rafraichir()`, un compteur `useReducer` dans `App.tsx`) | Moteur simple à écrire | Moteur immuable ; `useSyncExternalStore`. **Compromis assumé** : appeler `rafraichir()` après chaque méthode qui modifie la partie |
| **L'interface tire la décision courante** (`partie.decisionCourante()` à chaque rendu) | Les décisions urgentes (Chasseur, Rat, Paysan, or) s'intercalent à tout moment | Un moteur `async` qui attendrait les clics |

---

## 4. Le moteur : comment ça marche

### Fichiers de `src/moteur/`
- **`types.ts`** : les contrats.
  - Principaux types : `Role`, `Joueur`, `Tag`, `Meta`, `Decision`, `OptionChoix`, `ChoixFait`, `ResultatAction`, `Reponses`, `Entree`.
  - `Phase` : `nuit`, `aube`, `evenement`, `election`, `debat`, `vote`, `resultat_vote`, `fin`.
  - `Camp` : `village`, `loups`, `solo`, `fou`.
  - `Meta.expire` : `"aube"` ou `"aube_suivante"`.
- **`partie.ts`** : la **classe `Partie`**, c'est-à-dire l'état et les transitions de phases.
  - Décisions : `decisionCourante()`, `jouer(choix)`, `passer()`.
  - Phases : `leverLeJour()`, `suiteDeLAube()`, `elire(id)`, `ouvrirEvenement(alias?)`, `autreEvenement()`, `passerEvenement()`, `appliquerEvenement()`, `ouvrirDebat()`, `ouvrirVote(secondesRestantes?)`, `voter(id | null)`, `nuitSuivante()`.
  - Événements : `dureeDuDebat(parDefaut)` (suite du Sablier, puis minuteur de l'événement, puis réglage), `reportDuSablier`. Un événement avec `decision` passe par `decisionCourante()` / `jouer()`, avec le maire comme `moi` (`DecisionCourante.evenement`, et `titre` / `image` fournis par le moteur).
  - Lecture : `morts()`, `infosPubliques(phases?)` (filtrées par phase : la nuit va au rapport de l'aube, l'événement à l'événement), `rappelsDuVote()` (tags `silence` / `dirige`), `ciblesPossibles(type, moi, porteurs)`, `aBesoinDUnMaire()`.
  - Joueurs : `porteursDe(alias)` (les porteurs d'une carte, plus les rôles qui la « rejoignent »), `joueursAvecRole()`, `joueursAvecTag()`, `partenairesDe()` (tous les amoureux d'un joueur, réseau), `partenaireLie()` (Arlequin).
  - Champs : `cartesHorsJeu` (activées mais non distribuées), `cartesDuSavant` (3 cartes hors jeu, tirées au lancement si le Loup savant est activé), `plaidoirie`.
  - Autres : `mettreEnAttente()` (ignorée pour un joueur enchanté ou maudit), `aTag()`, `aTagDe(j, tag, source)` (ex. protégé PAR le Salvateur), `retirerTag()`, `auHasard()`.
  - Le hasard est injectable via l'option `aleatoire`.
  - Options du constructeur : `apparence`, `aleatoire`, `cartesActives`, `cartesFantomes`.
- **`donner.ts`** : `tourDeCarte()` appelle `role.agir()`, puis `appliquerResultat()` distribue les tags et les infos. Les événements, le vote, l'élection, `debut()` et `aube()` passent aussi par là.
- **`recevoir.ts`** : **`donnerTag()`, le point d'entrée unique** de tout tag posé sur un joueur. Il contient aussi `transmettreLOr()`.
- **`aube.ts`** :
  1. retire `protege_hier` ;
  2. applique le tableau ordonné `CONSEQUENCES` ;
  3. appelle le crochet `aube()` de chaque rôle vivant ;
  4. fait expirer les tags (`aube` est retiré, `aube_suivante` devient `aube`).
  - **L'ordre des lignes de `CONSEQUENCES` est une règle du jeu** : `mordu`, `agonisant`, `empoisonne`, `protege`, puis la peste **écrite à l'envers** (`peste_mortelle`, `peste_imminente`, `peste_active`, `peste`), pour qu'un tag posé par une ligne ne soit pas repris par les suivantes dans la même aube.
- **`victoire.ts`**, dans l'ordre :
  1. plus aucun vivant ;
  2. les amoureux (tag `amoureux`, liés entre eux ou pas, quel que soit leur camp) sont en **majorité stricte** parmi les vivants ;
  3. un rat-garou face à un seul non-loup → le village gagne ;
  4. plus de loup → le village gagne ;
  5. toutes les maisons des villageois vivants sont renforcées → le village gagne ;
  6. au moins autant de loups que de non-loups → les loups gagnent, ou **le Fou** s'il est vivant.
  - **Prêtre impur** : il est compté comme un villageois (son camp reste `village`), mais il gagne avec les loups (« Les loups-garous et le prêtre impur ») et perd avec le village (« …, sans le prêtre impur »), qu'il soit vivant ou mort. Si le Fou vole la victoire, le prêtre impur perd aussi.
- **`tours.ts`** (`peutAgir`), **`distribution.ts`** (`composer(nbJoueurs, nbLoups, actifs)`, `composerLesLoups`, `melanger`), **`evenements/`** : un fichier par événement, `index.ts` est le registre (`LISTE_EVENEMENTS` pour le tirage, plus les événements imposés comme la suite du Sablier). Champs d'un `Evenement` : `appliquer?` (effet sans choix), `decision?` + `agir?` (le maire désigne), `minuteur?` (minutes, `null` = pas de minuteur), `reporteLeTempsRestant?`, `force?`. Sans aucun de ces champs, c'est une animation.
- **`roles/index.ts`** : le **registre** (`LISTE_ROLES`, `ROLES`).
- **`roles/_template.ts`** : le modèle commenté pour créer un rôle. **`roles/ajouter-corbeau.md`** : un tutoriel.

### Les crochets d'un rôle
| Crochet | Quand | Renvoie | Exemple |
| --- | --- | --- | --- |
| `init()` | création du joueur | la `memoire` initiale (privée) | potions de la Sorcière |
| `debut(partie, moi)` | au lancement, avant la nuit 1 | ce qu'il donne (tags visibles) | l'or du Marchand, l'invulnérabilité du Loup vampire |
| `decision(partie, moi)` | carte montrée (nuit ou urgence) | message + options | toutes les cartes appelées |
| `agir(choix, partie, moi)` | choix validé | `{ donner, infos }` | Loup, Voyante… |
| `recevoir(tag, meta, r, partie, moi)` | AVANT qu'un tag soit posé sur lui | une réponse, ou rien | Ancien |
| `reagir(tag, meta, partie, moi)` | APRÈS qu'un tag a été accepté | rien (il agit via `mettreEnAttente` / `appliquerResultat`) | Chasseur, Rat, Paysan |
| `aube(partie, moi)` | à l'aube, après les conséquences | `{ donner, infos }` | Rat-garou dernier de la meute |
| `apresVote(partie, moi, elimine)` | après un vote qui a éliminé quelqu'un, pour chaque vivant | rien (il agit via `mettreEnAttente`) | Fêtard |

Champ **`porteurs(partie)`** : pour une **étape** de la nuit qu'aucun joueur ne reçoit (Réunion des amoureux, Conciliabule des maudits). Elle calcule qui se réveille, entre dans la file de chaque nuit et est sautée si la liste est vide. Rangée dans `ETAPES` (`roles/index.ts`) : présente dans `ROLES`, absente de `LISTE_ROLES`, donc ni dans Options ni dans la distribution.

Champ **`rejoint: ["loup"]`** : le rôle se réveille et vote avec les loups (Loup amoureux, Loup succube, Loup savant, Loup vampire, Rat-garou, Fou). Il est lu par `porteursDe()` et `commencerNuit()`. Un Loup succube seul survivant peut donc encore dévorer.

### Le cycle en 4 étapes
1. **Carte montrée** : `role.decision(partie, moi)` renvoie un message et des options. Chaque option a un type de cible : `aucune`, `un_joueur`, `un_autre`, `un_mordu`, `deux_joueurs`, `n_importe_qui` (morts compris). Une décision sans option n'affiche que « Passer ».
2. **Décision du meneur** : un `ChoixFait { id, cibles }`.
3. **DONNER** : `role.agir()` **ne modifie rien**. Il renvoie `{ donner: [{ tag, a, meta }], infos: [{ pour, texte }] }`.
4. **RECEVOIR** : `donnerTag(partie, joueur, tag, meta, profondeur)` :
   - a. `role.recevoir()` du **receveur**, appelé AVANT : s'il renvoie une réponse, le traitement s'arrête là ;
   - b. sinon, le **`switch` des règles générales** par tag (voir ci-dessous) ; `default` = accepter ;
   - c. si le tag est accepté : `role.reagir()` du receveur, appelé APRÈS.
   - Cinq réponses possibles, via l'objet `r`, qui écrit toujours au journal : `accepter`, `bloquer`, `consommer`, `transformer`, `rediriger`.
   - **Garde-fou** : `profondeur > 5` lève une erreur (boucle de tags).

### Règles générales du `switch` de `recevoir.ts`
- `mordu` : bloqué si le joueur porte `protege`.
- `sauve` : retire `mordu`, puis il est consommé.
- `agonisant` (Rat qui mord) : retire `mordu`, donc la Sorcière ne voit plus la victime. Mort certaine à l'aube.
- `devient` : change la carte du joueur (`meta.role`). Tags et mémoire sont conservés. Rat → Rat-garou.
- `protege` : bloqué par `protege_hier`, expire à l'aube.
- `benediction` (événement) : retire `protege_hier`, puis donne `protege` avec `source: "salvateur"` (effet complet du Salvateur), puis est consommé.
- `maire` : un seul maire, le nouveau retire le tag à l'ancien (Passation).
- `recharge` (Marché noir) : consommé ; la Sorcière et le Loup hypnotiseur l'interceptent dans leur `recevoir()` pour remettre leurs charges.
- `mort` :
  - bloqué si le joueur est déjà mort ;
  - **bloqué si le joueur porte `invulnerable`** (Loup vampire), sauf si la cause est le vote du village. Liste blanche : toute future cause de mort est bloquée d'office ;
  - **mort par vote d'un porteur d'or** : l'or est dépensé et la mort est consommée (puis plaidoirie et nouveau vote) ;
  - sinon la mort est acceptée, l'or passe à un tueur vivant (ou au choix du mourant, via la décision urgente de la carte Marchand), et la chaîne des amoureux s'applique.

### Règles appliquées par le moteur à tous les rôles
- **Protection du Salvateur contre les loups qui lient ou regardent** : le Loup amoureux, le Loup succube, le Loup voyante et le Loup hypnotiseur jouent après lui (102 à 115) et testent `aTagDe(cible, "protege", "salvateur")` dans leur `agir()`. L'échec n'est jamais annoncé au village.
- **Tags bloquants** (`TAGS_BLOQUANTS` dans `partie.ts`) : `enchante` (Fée, Paysan), `maudit` (Pleureuse) et `impuissant` (Ancien éliminé par le vote).
  - une carte dont tous les porteurs sont bloqués n'offre que « Passer » ;
  - `mettreEnAttente()` ignore un joueur bloqué : un Chasseur enchanté ou maudit ne tire pas, un Rat ne choisit pas ;
  - les pouvoirs passifs continuent (`recevoir` de l'Ancien, invulnérabilité, or) ;
  - une **étape** (carte avec `porteurs`) n'est bloquée que par `enchante` : sinon le Conciliabule, dont tous les porteurs sont maudits, ne se jouerait jamais.
- **Cartes fantômes** (option de préparation) : les cartes activées mais non distribuées sont appelées la nuit, avec seulement « Passer », pour que personne ne sache lesquelles sont réellement en jeu.
- **`lie`** (Arlequin) : un joueur lié qui joue **seul** sa carte ne peut viser que lui-même et son partenaire. Pour une carte de groupe (les loups), le meneur applique la règle de tête.

### Tags existants
`mordu`, `sauve`, `agonisant`, `empoisonne`, `protege`, `protege_hier`, `amoureux`, `vie_perdue`, `mort`, `devient`, `peste` → `peste_active` → `peste_imminente` → `peste_mortelle`, `maire`, `enchante`, `lie`, `or`, `blesse`, `renforce`, `invulnerable`, `pur`, `impur`, `silence`, `dirige`, `maudit`, `delivre`, `apaisee`, `fete`, `benediction`, `recharge`, `sauf_conduit` (non éliminable au vote du jour : `voter()` refuse, siège non cliquable), `soupcon` (rappel au vote), `eclaire` (la Voyante et le Loup voyante ne voient que ce joueur cette nuit), `impuissant` (plus de pouvoir jusqu'à la fin de la partie).

**Causes de mort** : `mordu`, `poison`, `chagrin`, `chasseur`, `vote`, `peste`, `isole`.

### Où mettre une règle ?
- Elle dépend de ce que le rôle actif décide → `agir()` de ce rôle.
- Elle dépend de la carte du receveur → `recevoir()` (avant) ou `reagir()` (après) du rôle receveur.
  - Leçon apprise avec le Chasseur : pour « faire quelque chose quand je meurs », utiliser `reagir()`. Un `recevoir()` qui accepte lui-même court-circuite la chaîne des amoureux.
- Elle dépend des tags déjà présents, ou elle suit un objet qui change de main (l'or) → un `case` dans `recevoir.ts`.
- Elle se déclenche au passage de la nuit au jour → une ligne de `CONSEQUENCES`, ou le crochet `aube()` du rôle si elle dépend de l'état de la partie.
- Elle vaut pour tous les rôles → le moteur (`partie.ts`).

### Ajouter un rôle (checklist)
1. Copier `roles/_template.ts` en `roles/<alias>.ts`.
2. L'enregistrer dans `roles/index.ts`. Il apparaît alors automatiquement dans Options et dans la distribution. Il est appelé la nuit s'il a `appelNuit: true` et une méthode `decision()`.
3. Si le rôle invente un nouveau tag : un `case` dans `recevoir.ts`, éventuellement une ligne dans `aube.ts`, et un libellé dans `TAGS` de `PartieVue.tsx`.
4. Si un tag doit durer au-delà de l'aube : un nouveau moment dans `Meta.expire` (`types.ts`), et son retrait au bon moment.
5. Nouveau type de cible : `TypeCible`, `ciblesDuType()`, `nbCibles()`.
6. Nouveau camp ou condition de victoire : `types.ts` (`Camp`), `victoire.ts`, `LIBELLES_CAMPS` dans `Options.tsx`. Nouvelle cause de mort : `CAUSES` dans `PartieVue.tsx`.
7. Écrire un test dans `scenario.test.ts`.

### Ordre d'appel la nuit (`priorite`)
Toujours une **dizaine** : une nouvelle carte s'insère entre deux avec un nombre simple (ex. 125), jamais de décimales. Sans priorité, une carte joue en fin de nuit (999).

| Priorité | Carte | Nuits |
| --- | --- | --- |
| 10 | Fée | à partir de la 2 |
| 12 | Conciliabule des maudits (étape) | toutes, s'il y a au moins un maudit vivant ; minuteur de 60 s |
| 15 | Pleureuse | à partir de la 2 |
| 20 | Arlequin | 1, 3, 5… |
| 50 | Cupidon | 1 (lier) et 3 (voir) |
| 60 | Réunion des amoureux (étape) | toutes, s'il y a au moins 2 amoureux vivants hors Loup succube ; minuteur de 60 s |
| 70 | Prêtre | 1 (pur ou impur) |
| 80 | Voyante | toutes |
| 90 | Bâtisseur | toutes |
| 100 | Salvateur | toutes |
| 102 | Loup amoureux | 1 (se lier) ; après le Salvateur |
| 105 | Loup succube | toutes ; choix seulement sans compagnon vivant ; après le Salvateur, dont la protection fait échouer le lien |
| 107 | Loup voyante | toutes ; après le Salvateur |
| 110 | Loup savant | 1 |
| 115 | Loup hypnotiseur | toutes, tant qu'il lui reste un médaillon |
| 120 | Loup-Garou (avec ceux qui le rejoignent) | toutes |
| 130 | Sorcière | toutes |

**L'état d'un joueur va dans `joueur.memoire`** (créé par `init()`), **jamais dans l'objet rôle**, qui est partagé par tous les joueurs ayant ce rôle.

---

## 5. Les rôles

| Rôle | Camp | Règle |
| --- | --- | --- |
| Loup-Garou | loups | Dévore une victime chaque nuit. Ne chasse pas si tous les loups sont `blesse`. |
| Villageois | village | Aucun pouvoir. |
| Voyante | village | Voit la carte d'un joueur, ou une des 3 cartes hors jeu du Loup savant. |
| Loup voyante | loups | Comme la Voyante (copie indépendante de `voyante.ts`), et vote avec les loups. Sur un joueur protégé par le Salvateur, la vision échoue (« la carte de X reste cachée ») : elle apprend donc qu'il est protégé. |
| Sorcière | village | Une potion de vie, une potion de mort. |
| Salvateur | village | Protège un joueur, jamais deux nuits de suite le même. |
| Chasseur | village | En mourant, abat un joueur (décision urgente). |
| Ancien | village | Survit à la première morsure (sa mort devient `vie_perdue`). Éliminé par le vote du village : son `reagir()` donne `impuissant` à tous les vivants hors du camp des loups (Fou et Prêtre impur compris), qui ne font plus leur rôle jusqu'à la fin de la partie. |
| Cupidon | village | Nuit 1 : lie deux amoureux, même déjà liés à quelqu'un d'autre (réseau). Nuit 3 : voit les rôles de tous les amoureux vivants. |
| Loup amoureux | loups | Nuit 1 : se lie à un joueur (chagrin dans les deux sens, partenaire prévenu). Cible protégée par le Salvateur : le lien échoue, sans seconde chance. Son partenaire ne vient à la Réunion des amoureux qu'à partir de la nuit 2. Vote avec les loups. |
| Loup succube | loups | Se lie à un compagnon à sens unique : le compagnon est dans ses `partenaires`, mais lui n'est pas dans ceux du compagnon. S'il meurt, le compagnon meurt ; si le compagnon meurt, il en choisit un autre la nuit suivante (compagnon gardé dans sa `memoire`). Un compagnon protégé par le Salvateur fait échouer le lien : il reste seul jusqu'à la nuit suivante. Un nouveau compagnon ne vient à la Réunion des amoureux que la nuit d'après. Vote avec les loups. Ne vient pas à la Réunion des amoureux. |
| Loup savant | loups | Nuit 1 : découvre 3 cartes activées non distribuées. Vote avec les loups. |
| Loup hypnotiseur | loups | Vote avec les loups. Deux médaillons à usage unique (`memoire`), un par nuit au plus : silence (tag `silence`) ou suggestion (tag `dirige`), qui durent jusqu'à l'aube suivante. Au vote seulement, `partie.rappelsDuVote()` rappelle au meneur de ne pas compter le vote du silencé et de faire voter le dirigé comme l'hypnotiseur (sauf s'il est mort). Sur une cible protégée par le Salvateur : rien, médaillon perdu, sans annonce. |
| Loup vampire | loups | Vote avec les loups. Reçoit `invulnerable` au lancement : rien ne peut le tuer sauf le vote du village (l'or peut quand même racheter ce vote). Amoureux, il survit au chagrin ; voté, son amoureux meurt de chagrin. |
| Rat | village | Dévoré, il choisit en secret (décision urgente) : **mordre**, il meurt à l'aube (`agonisant`) et un participant au vote des loups attrape la **peste** (mort à la 4e aube, soit 3 nuits plus tard) ; ou **rejoindre la meute**, la morsure est annulée et il devient Rat-garou. Éliminé par le vote, il contamine le maire. |
| Rat-garou | loups | Se réveille avec les loups mais ne vote pas. Meurt à l'aube s'il est le dernier du camp des loups. Éliminé par le vote, il contamine le maire. |
| Fou | fou | Se réveille et vote avec les loups, mais son vote ne compte pas. Ne compte pas comme loup. Si les loups devraient gagner alors qu'il est vivant, il gagne seul. |
| Fée | village | À partir de la nuit 2, enchante un joueur, qui ne fait rien de la nuit. |
| Arlequin | village | Nuits 1, 3, 5… : lie deux joueurs jusqu'à l'aube ; ils ne peuvent viser qu'eux-mêmes ou l'autre. |
| Marchand | village | Commence avec de l'or. Voté, il le dépense pour une plaidoirie et un second vote. Tué, l'or passe à son tueur. |
| Paysan | village | Voté : assomme 2 joueurs (`enchante` la nuit suivante). Dévoré : tous les loups sont `blesse` et ne chassent pas la nuit suivante. |
| Prêtre | village | Nuit 1 : choisit en secret d'être **pur** (gagne avec le village) ou **impur** (gagne avec les loups, tag `impur`). Il compte toujours comme un villageois pour la victoire. Sans choix (« Passer »), il est pur. Mort, il continue de faire semblant de jouer et peut chuchoter au maire pendant le débat, pour l'aider ou pour le tromper. |
| Bâtisseur | village | Renforce une maison par nuit. Toutes les maisons des villageois vivants renforcées : le village gagne. |
| Fêtard | village | Après un vote qui élimine un loup, `apresVote()` demande au meneur (décision urgente) s'il a voté contre lui. Oui : tag `fete` jusqu'à l'aube, et son `recevoir()` bloque la morsure cette nuit-là. Les loups ne le savent pas. |
| Pleureuse | village | À partir de la nuit 2, maudit un joueur par nuit (`maudit` : il ne fait plus son rôle). Chaque nuit, le Conciliabule réunit les maudits vivants (60 s) qui désignent un joueur, mort ou vivant : si c'est elle, tous reçoivent `delivre` et elle `apaisee` (plus de pouvoir). Le Conciliabule continue après sa mort. À sa mort, le meneur annonce « une villageoise ». |

> [!note] Le Fou a changé de règle
> L'idée d'origine (désigner un joueur A puis un joueur B, et faire l'action du rôle de A sur B) **n'est pas implémentée**. Le Fou actuel est celui décrit dans le tableau.

### Les événements (`src/moteur/evenements/`, un fichier chacun)
Tirés après l'élection du maire. Le meneur peut demander « Un autre » ou « Passer » (Soleil) tant que l'événement n'est pas validé. Dans les événements où le maire désigne, il ne peut jamais se désigner (cible `un_autre`, avec le maire comme `moi`).

| Genre | Événements |
| --- | --- |
| Rien | Soleil (aussi forcé par « Passer »), Rumeur (révèle le camp d'un joueur au hasard) |
| Animation (aucun champ de jeu) | Bâillon, Ténèbres, Carnaval, Bâton de parole, Murmures d'outre-tombe, Bouche cousue |
| Minuteur | Sablier (8 min, temps restant reporté au lendemain, suite imposée), Urgence (2 min), Trêve (pas de minuteur) |
| Le maire désigne | Sauf-conduit (`sauf_conduit`), Soupçon (`soupcon`), Bénédiction (`benediction`), Passation (`maire`), Contagion (`peste_active` : mort à la 3e aube), Clair de lune (`eclaire`) |
| Sans choix | Marché noir (`recharge` à tous les vivants) |

---

## 6. Le cas d'étude de référence
« L'Ancien amoureux du Chasseur » (`docs/cas-particulier.md`, rejoué par `npm test` et `npm run scenario`). Les loups mordent l'Ancien et la Sorcière empoisonne le Chasseur. À l'aube, l'Ancien transforme sa mort en `vie_perdue`, puis le Chasseur meurt. L'Ancien meurt alors de chagrin (amoureux). Le Chasseur tire sur le loup, et le village gagne.

---

## 7. Limites connues et points d'attention
- `decisionCourante()` peut modifier la file : elle saute une carte qui n'a plus de porteur vivant (sauf carte fantôme).
- Pour une carte de groupe, `moi` est le premier porteur vivant, qui peut être un rôle qui la « rejoint » (Loup succube pendant le tour des loups) : ne pas lire sa `memoire` en croyant tenir un loup.
- `joueur.memoire` est typé `any`.
- Le vote ne compte pas les voix : le meneur clique directement sur l'éliminé. Le Fou et le Rat-garou « votent » avec les loups, mais c'est le meneur qui ignore leur avis.
- `jouer()` vérifie le nombre de cibles, pas leur validité (c'est l'interface qui filtre).
- Rien n'est sauvegardé pendant une partie.
- **Alias connus en dehors de leur fichier** (raccourcis assumés) :
  - `victoire.ts` connaît `rat-garou` ;
  - `partie.ts` connaît `loup-savant` (tirage des cartes au lancement) ;
  - `recevoir.ts` connaît la décision de `marchand` ;
  - `PartieVue.tsx` connaît `pretre`.
- **Code copié volontairement** : `contaminerLeMaire` (Rat et Rat-garou), la logique « sonder » (Voyante et Loup voyante). Une correction est à reporter dans les deux fichiers.
- Le `useEffect([cle])` de `PartieVue` pourrait être remplacé par la prop `key` sur un sous-composant (amélioration possible).
- `distribution.ts` importe le registre des rôles pour connaître leur camp.

---

## 8. Questions de règles encore ouvertes
- **Réseau d'amoureux** : un joueur peut être lié par plusieurs cartes. `recevoir.ts` (case `"amoureux"`) ajoute le nouveau partenaire à `meta.partenaires` au lieu de remplacer le tag, et la mort d'un amoureux emporte tous ses partenaires, en cascade. La cascade s'arrête sur les morts ; la limite `PROFONDEUR_MAX` (5) suffit tant qu'il n'y a que trois cartes de lien.
- **Réunion des amoureux** : chaque nuit (priorité 60), tous les amoureux vivants sauf le Loup succube se réveillent 60 secondes pour se reconnaître et comploter, s'ils sont au moins 2.
- Le meneur choisit selon le nombre de joueurs quelles cartes de lien activer : trois liens dans une petite partie peuvent donner la majorité aux amoureux dès la première aube.
- Le Fou : faut-il un jour revenir à l'idée d'origine (l'action de A sur B) ?
- Conditions de victoire des futurs rôles solitaires.

---

## 9. Notes de documentation existantes
Ces notes sont dans mon projet claude.ai « Paqari » et dans mon vault Obsidian. Dans le dépôt, on trouve `docs/cas-particulier.md`, ce document, et `src/moteur/roles/ajouter-corbeau.md`.
- `loup-garou-projet` : vue d'ensemble.
- `resolveur-approches` : historique, les approches A / B / C comparées.
- `donner-recevoir` : l'architecture retenue.
- `cas-particulier` : l'Ancien amoureux du Chasseur, pas à pas.
- `ajouter-corbeau` : tutoriel d'ajout d'un rôle avec un nouveau moment d'expiration.
- `fonctionnement-du-code` : 10 diagrammes Mermaid d'une partie de bout en bout, plus un tableau « je veux changer X → j'ouvre Y ». **Écrite avant les nouvelles cartes** : elle ne parle ni du maire, ni des crochets `debut()` / `aube()`, ni de `rejoint`.
- `design-patterns` : les 21 patterns utilisés, chacun comparé à ses alternatives.

## 10. Encore à trancher pour le projet
- Le meneur seul, ou chaque joueur sur son téléphone ? Dans le second cas, le moteur passerait côté serveur.
- Le comptage réel des votes (le Fou et le Rat-garou en dépendent).
- Le bouton « annuler ».
- L'API Express + SQLite.
