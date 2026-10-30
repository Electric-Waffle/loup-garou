# Contexte du projet Loup-Garou (Paqari)

> Ce document résume tout le contexte d'une longue conversation de conception. Il est écrit pour être lu par Claude Code au début d'une session (ou placé à la racine du dépôt sous le nom `CLAUDE.md`).

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
  - `RÉUTILISABLE :` bloc à reprendre ailleurs.
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

Un site **local, en full JavaScript / TypeScript**, pour **préparer et animer des parties de Loup-Garou** du point de vue du **meneur** (une seule application, pilotée par le meneur).

- **Dépôt** : `Electric-Waffle/loup-garou` (privé).
  - `main` : le prototype.
  - `explication` : **un commit de plus que `main`**. Il réécrit les 7 fichiers de `src/ui/` en version d'étude (commentaires, décompositions, petites fonctions et sous-composants extraits), **sans changement de comportement**.
- **Stack** : React 18, TypeScript (mode strict), Vite 8, `tsx` pour les tests (`node:test`, pas de Vitest).
- **Commandes** :
  - `npm run dev` : serveur de développement, accessible aussi depuis le téléphone via l'adresse réseau ;
  - `npm test` : scénarios du moteur ;
  - `npm run scenario` : affiche le journal du cas particulier ;
  - `npm run build` : `tsc --noEmit` puis `vite build`.
- **Stockage actuel** : `localStorage`, via un seul fichier, `src/ui/stockage.ts`. **Prévu plus tard** : une API Express + SQLite qui remplacera uniquement `charger()` et `sauver()`. Attention : ces fonctions deviendront asynchrones.

### Deux pages
1. **Options** : pour chaque carte, on peut modifier **seulement** le titre, l'image et l'activation. On gère aussi les joueurs (nom, image).
2. **Préparer** : joueurs présents autour d'une table ronde (échange de places par deux clics), nombre de loups choisi, distribution aléatoire des cartes activées (loups spéciaux et Loups-Garous en proportion aléatoire, 1 exemplaire de chaque rôle spécial, complété par des villageois), bouton Redistribuer, durée du débat, puis lancement.

### Le cycle d'une partie
Nuit (les cartes une par une, par priorité) → aube (conséquences des tags, rapport) → événement → débat (minuteur) → vote → résultat du vote → nuit suivante. La victoire est vérifiée en ouvrant l'événement et au passage à la nuit suivante.

---

## 3. Décisions d'architecture (et pourquoi)

| Décision | Raison | Alternatives écartées |
| --- | --- | --- |
| **Cartes codées en dur**, un fichier par rôle | Simplicité, lisibilité | **Configurateur de comportements** (règles en JSON / mini-langage) : abandonné, trop complexe et code « boîte noire » |
| **Rôles = objets** respectant l'interface `Role`, avec des **crochets optionnels** (`decision`, `agir`, `recevoir`, `reagir`, `init`) appelés par le moteur | Un rôle prend juste ce dont il a besoin. La Sorcière regarde ET agit | **Héritage** `CarteInfo` / `CarteAction` (mon idée de départ) : un rôle rentre rarement dans une seule catégorie |
| **Moteur séparé de l'interface** (`src/moteur/` sans React, `src/ui/` sans règle de jeu) | Moteur testable sans navigateur, et déplaçable côté serveur plus tard | Logique dans les composants ; logique côté Express à chaque clic |
| **Architecture « donner / recevoir »** avec des tags (voir §4) | Aucun rôle ne connaît les autres | Résolveur avec un `switch` par carte (approche A), règles en données (B), intercepteurs portés par les tags (C) |
| **Journal** en ajout seul ; le rapport est **recalculé** depuis le journal | Rapport, débogage, base pour un futur « annuler » | Comparer l'état avant / après ; variables dédiées |
| **Moteur mutable + rendu forcé** (`rafraichir()`, un compteur `useReducer` dans `App.tsx`) | Moteur simple à écrire | Moteur immuable ; `useSyncExternalStore`. **Compromis assumé** : appeler `rafraichir()` après chaque méthode qui modifie la partie |
| **L'interface tire la décision courante** (`partie.decisionCourante()` à chaque rendu) | Le Chasseur peut s'intercaler à tout moment | Un moteur `async` qui attendrait les clics |

---

## 4. Le moteur : comment ça marche

### Fichiers de `src/moteur/`
- `types.ts` : les contrats (`Role`, `Joueur`, `Tag`, `Meta`, `Decision`, `OptionChoix`, `ChoixFait`, `ResultatAction`, `Reponses`, `Entree`, `Phase`, `TypeCible`, `Tours`…).
- `partie.ts` : la **classe `Partie`**, c'est-à-dire l'état et les transitions de phases. Méthodes principales :
  - décisions : `decisionCourante()`, `jouer(choix)`, `passer()` ;
  - phases : `leverLeJour()`, `ouvrirEvenement()`, `ouvrirDebat()`, `ouvrirVote()`, `voter(id | null)`, `nuitSuivante()` ;
  - lecture : `morts()`, `infosPubliques()`, `ciblesPossibles()` ;
  - autres : `mettreEnAttente()`, `aTag()`, `retirerTag()`, `partenaireDe()`, `auHasard()`. Le hasard est injectable via l'option `aleatoire`.
- `donner.ts` : `tourDeCarte()` appelle `role.agir()`, puis `appliquerResultat()` distribue les tags et les infos (les événements et le vote passent aussi par là).
- `recevoir.ts` : **`donnerTag()`, le point d'entrée unique** de tout tag posé sur un joueur.
- `aube.ts` : le tableau ordonné `CONSEQUENCES` (`mordu` → `mort`, `empoisonne` → `mort`, `protege` → `protege_hier`). **L'ordre des lignes est une règle du jeu.**
- `victoire.ts`, `tours.ts` (`peutAgir`), `distribution.ts` (`composer`, `melanger`), `evenements/index.ts`.
- `roles/index.ts` : le **registre** (`LISTE_ROLES`, `ROLES`).
- `roles/*.ts` : loup, villageois, voyante, sorcière, salvateur, cupidon, chasseur, ancien, `custom` (voir §6). On y trouve aussi `_template.ts`, le modèle commenté pour créer un rôle, et `ajouter-corbeau.md`, un tutoriel.

### Le cycle en 4 étapes
1. **Carte montrée** : `role.decision(partie, moi)` renvoie un message et des options. Chaque option a un type de cible : `aucune`, `un_joueur`, `un_autre`, `un_mordu`, `deux_joueurs`.
2. **Décision du meneur** : un `ChoixFait { id, cibles }`.
3. **DONNER** : `role.agir()` **ne modifie rien**. Il renvoie `{ donner: [{ tag, a, meta }], infos: [{ pour, texte }] }`. Un rôle peut regarder (infos), donner (tags), ou les deux.
4. **RECEVOIR** : `donnerTag(partie, joueur, tag, meta, profondeur)` :
   - a. `role.recevoir()` du **receveur**, appelé AVANT : s'il renvoie une réponse, le traitement s'arrête là (les règles générales ne s'exécutent pas) ;
   - b. sinon, le **`switch` des règles générales** par tag (`mordu` bloqué par `protege`, `sauve`, `protege` bloqué par `protege_hier`, `mort` + chaîne des amoureux) ; `default` = accepter ;
   - c. si le tag est accepté : `role.reagir()` du receveur, appelé APRÈS (ex. le Chasseur appelle `mettreEnAttente`, ce qui crée une **décision urgente**).
   - Cinq réponses possibles, via l'objet `r`, qui écrit toujours au journal : `accepter`, `bloquer`, `consommer`, `transformer`, `rediriger`.
   - **Garde-fou** : `profondeur > 5` lève une erreur (boucle de tags).

### Où mettre une règle ?
- Elle dépend de ce que le rôle actif décide → `agir()` de ce rôle.
- Elle dépend de la carte du receveur → `recevoir()` (avant) ou `reagir()` (après) du rôle receveur.
  - Leçon apprise avec le Chasseur : pour « faire quelque chose quand je meurs », utiliser `reagir()`. Un `recevoir()` qui accepte lui-même court-circuite la chaîne des amoureux.
- Elle dépend des tags déjà présents → un `case` dans `recevoir.ts`.
- Elle se déclenche au passage de la nuit au jour → une ligne de `CONSEQUENCES` dans `aube.ts`.

### Ajouter un rôle (checklist)
1. Copier `roles/_template.ts` en `roles/<alias>.ts`.
2. L'enregistrer dans `roles/index.ts`. Il apparaît alors automatiquement dans Options et dans la distribution, et il est appelé la nuit s'il a `appelNuit: true` et une méthode `decision()`.
3. Si le rôle invente un nouveau tag : un `case` dans `recevoir.ts`, éventuellement une ligne dans `aube.ts`, et un libellé dans `TAGS` de `PartieVue.tsx`.
4. Si un tag doit durer au-delà de l'aube : un nouveau moment dans `Meta.expire` (`types.ts`), et son retrait au bon moment dans `partie.ts`. Exemple étudié : le Corbeau, avec `"fin_vote"` retiré au début de `nuitSuivante()`.
5. Nouveau type de cible : `TypeCible`, `ciblesPossibles()`, `nbCibles()`.
6. Nouveau camp ou condition de victoire : `victoire.ts`. Nouvelle cause de mort : `CAUSES` dans `PartieVue.tsx`.
7. Écrire un test dans `scenario.test.ts`.

### Champs d'un rôle
`alias` (immuable), `titre`, `image` et `description` (valeurs par défaut), `camp` (`village` / `loups` / `solo`), `priorite` (ordre d'appel la nuit : Cupidon 1, Voyante 5, Salvateur 10, Loup 20, Sorcière 30), `appelNuit`, `tours` (optionnel : `{ de: 2 }`, `{ de: 1, a: 1 }`, `{ de: 2, chaque: 2 }`).

**L'état d'un joueur va dans `joueur.memoire`** (créé par `init()`), **jamais dans l'objet rôle**, qui est partagé par tous les joueurs ayant ce rôle.

---

## 5. Le cas d'étude de référence
« L'Ancien amoureux du Chasseur » (`docs/cas-particulier.md`, rejoué par `npm test` et `npm run scenario`). Les loups mordent l'Ancien et la Sorcière empoisonne le Chasseur. À l'aube, l'Ancien transforme sa mort en `vie_perdue`, puis le Chasseur meurt. L'Ancien meurt alors de chagrin (amoureux). Le Chasseur tire sur le loup, et le village gagne.

---

## 6. Limites connues et points d'attention
- `decisionCourante()` peut modifier la file : elle saute une carte qui n'a plus de porteur vivant.
- `joueur.memoire` est typé `any`.
- Le vote ne compte pas les voix : le meneur clique directement sur l'éliminé.
- Pour un rôle en plusieurs exemplaires, `moi` désigne le premier porteur vivant.
- `jouer()` vérifie le nombre de cibles, pas leur validité (c'est l'interface qui filtre).
- Rien n'est sauvegardé pendant une partie.
- Le `useEffect([cle])` de `PartieVue` pourrait être remplacé par la prop `key` sur un sous-composant (amélioration possible).
- **`roles/custom.ts` est mon brouillon en cours**. Problèmes repérés, que je corrige moi-même :
  - dans `agir()`, `{ donner: [...] }` est lu comme un bloc et non comme un objet : il manque un `return` ;
  - il n'a ni `appelNuit` ni `priorite` ;
  - son commentaire d'en-tête est celui du Chasseur.

---

## 7. Cartes que je veux ajouter : NE PAS LES CODER
**Méthode** : quand j'aurai assez compris le code, je proposerai moi-même comment les ajouter, et tu me corrigeras. Tu ne les codes pas.

- **Le Fou** : toutes les 2 nuits, il désigne un joueur A puis un joueur B, et fait l'action du rôle de A sur B, sans connaître ce rôle ni savoir s'il a un effet.
  - A loup → un vote de loup en plus sur B.
  - A voyante → le Fou voit la carte de B.
  - A cupidon → rien.
  - Une liste exhaustive des effets selon le rôle de A sera écrite.
- **Le Rat** : s'il est dévoré par les loups, il choisit :
  - soit de mordre un loup aléatoire, qui mourra empoisonné 3 nuits plus tard ;
  - soit de supplier pour sa vie et devenir **rat-garou** : il voit les loups mais ne participe pas à leur vote. S'il ne reste plus qu'un seul loup, le rat-garou est automatiquement mangé pendant la nuit, voté ou non par ce dernier loup.
- **Cupidon (nouvelle version)** : Cupidon classique côté village, mais la 3e nuit il voit le rôle des deux joueurs qu'il a liés.
- **Loup succube** : comme Cupidon, mais du côté des loups. Lui aussi voit le rôle des deux joueurs liés la 3e nuit.

**Questions de règles encore ouvertes** :
- Le Fou : commence-t-il la nuit 1 ou la nuit 2 ? Et si A est mort ?
- Le Rat : le loup mordu sait-il qu'il va mourir ? Peut-il être sauvé ou protégé ? De quel camp est le rat-garou, et que se passe-t-il s'il est le dernier « loup » ?
- Cupidon et le Loup succube dans la même partie : un joueur peut-il être lié deux fois ?

---

## 8. Notes de documentation existantes
Ces notes sont dans mon projet claude.ai « Paqari » et dans mon vault Obsidian. Dans le dépôt, on trouve seulement `docs/cas-particulier.md` et `src/moteur/roles/ajouter-corbeau.md`.
- `loup-garou-projet` : vue d'ensemble et points à trancher.
- `resolveur-approches` : historique, les approches A / B / C comparées.
- `donner-recevoir` : l'architecture retenue.
- `cas-particulier` : l'Ancien amoureux du Chasseur, pas à pas.
- `ajouter-corbeau` : tutoriel d'ajout d'un rôle avec un nouveau moment d'expiration.
- `fonctionnement-du-code` : 10 diagrammes Mermaid d'une partie de bout en bout, plus un tableau « je veux changer X → j'ouvre Y ».
- `design-patterns` : les 21 patterns utilisés, chacun comparé à ses alternatives.

## 9. Encore à trancher pour le projet
- Conditions de victoire avancées (camps solo, rat-garou…).
- Format des événements (aujourd'hui : un objet avec `appliquer(partie)` qui renvoie `{ donner, infos }`).
- Le meneur seul, ou chaque joueur sur son téléphone ? Dans le second cas, le moteur passerait côté serveur.
- Le comptage réel des votes.
- Le bouton « annuler ».
