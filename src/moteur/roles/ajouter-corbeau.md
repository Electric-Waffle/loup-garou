---
title: Ajouter une carte — le Corbeau
tags:
  - loup-garou
  - architecture
  - donner-recevoir
  - tutoriel
created: 2026-10-27
---

# Ajouter une carte : le Corbeau

Lié à : [[donner-recevoir]] · [[cas-particulier]] · [[loup-garou-projet]]

> [!abstract] La règle
> Chaque nuit, le Corbeau peut désigner un joueur. Au vote du lendemain, ce joueur commence avec **2 voix contre lui**.

Le modèle de fichier pour n'importe quel rôle est dans `src/moteur/roles/_template.ts`. Cette note montre comment s'en servir sur un cas réel.

---

## Étape 0 : traduire la règle en questions

Avant d'écrire du code, on répond à cinq questions. Chaque réponse indique un fichier à toucher.

| Question | Réponse pour le Corbeau | Conséquence |
| --- | --- | --- |
| Le rôle est-il appelé la nuit ? | Oui, toutes les nuits | `appelNuit: true`, pas de champ `tours` |
| À quel moment de la nuit ? | Peu importe : personne ne lit sa marque la nuit | `priorite: 125`, après les loups (120), avant la sorcière (130) |
| Que **donne**-t-il ? | Un tag `corbeau` au joueur désigné, plus une info publique | `agir()` renvoie `donner` et `infos` |
| Le receveur a-t-il son mot à dire ? | Non, mais le tag doit **survivre à l'aube** | un `case "corbeau"` dans `recevoir.ts` |
| Quand l'effet disparaît-il ? | À la fin du vote, un moment qui n'existe pas encore | un nouveau moment `"fin_vote"` dans `types.ts` et `partie.ts` |

> [!note] Pourquoi le tag ne peut-il pas garder le comportement par défaut ?
> Sans `case`, un tag est accepté sans expiration et resterait donc pour toujours. Avec `expire: "aube"`, comme le Salvateur, il serait retiré par `aube.ts` avant même le vote. Il faut donc un moment d'expiration plus tardif.

---

## Étape 1 : créer `src/moteur/roles/corbeau.ts`

On copie `_template.ts`, on garde `decision()` et `agir()`, et on supprime `init()`, `recevoir()` et `reagir()`, dont le Corbeau n'a pas besoin.

```ts
import type { ChoixFait, Decision, Joueur, ResultatAction, Role } from "../types";
import type { Partie } from "../partie";

const ALIAS = "corbeau";

const corbeau: Role = {
  // Identifiant fixe : il fait le lien entre ce fichier, le registre et les réglages enregistrés.
  alias: ALIAS,

  // Valeurs par défaut, modifiables depuis la page Options.
  titre: "Corbeau",
  image: "🐦‍⬛",

  // Camp utilisé par victoire.ts pour savoir qui gagne.
  camp: "village",

  description: "Chaque nuit, il désigne un joueur qui aura 2 voix contre lui au vote du lendemain.",

  // Appelé la nuit, après les loups (120) et avant la sorcière (130).
  priorite: 125,
  appelNuit: true,

  // Étapes 1-2 : ce que le meneur voit et les choix proposés.
  decision(_partie: Partie, _moi: Joueur): Decision {
    return {
      message: "Le corbeau désigne un joueur qui aura 2 voix contre lui demain.",
      choix: [
        // "un_autre" : le corbeau ne peut pas se désigner lui-même.
        { id: "marquer", label: "Désigner", cible: "un_autre" },
        // "aucune" : le choix est validé immédiatement, sans cible à sélectionner.
        { id: "rien", label: "Ne désigner personne", cible: "aucune" }
      ]
    };
  },

  // Étape 3 : DONNER.
  agir(choix: ChoixFait, partie: Partie, _moi: Joueur): ResultatAction {
    // Si le meneur a choisi "Ne désigner personne", on ne donne rien.
    if (choix.id !== "marquer") {
      return {};
    }

    // choix.cibles contient exactement une cible : le moteur l'a vérifié pour le type "un_autre".
    const idCible = choix.cibles[0];
    const cible = partie.joueur(idCible);

    return {
      // Le tag : c'est lui qui porte l'effet de jeu. La métadonnée "voix" servira
      // le jour où le prototype comptera réellement les voix.
      donner: [
        { tag: "corbeau", a: idCible, meta: { voix: 2 } }
      ],
      // L'info publique : elle s'affiche pendant la phase Événement du jour.
      infos: [
        { pour: "tous", texte: `Le corbeau a désigné ${cible.nom} : 2 voix contre lui au vote.` }
      ]
    };
  }
};

export default corbeau;
```

Le Corbeau ne connaît aucun autre rôle, et aucun autre rôle n'a besoin de le connaître.

---

## Étape 2 : l'enregistrer dans `src/moteur/roles/index.ts`

```diff
 import chasseur from "./chasseur";
+import corbeau from "./corbeau";
 import cupidon from "./cupidon";
 …
 export const LISTE_ROLES: Role[] = [
   loup,
   …
   chasseur,
-  ancien
+  ancien,
+  corbeau
 ];
```

À partir de là, sans autre modification :
- la carte apparaît dans **Options**, activée par défaut, car `stockage.ts` fusionne les rôles du code avec les réglages enregistrés ;
- elle entre dans la **distribution** comme rôle spécial (un exemplaire) ;
- elle est **appelée la nuit** à sa priorité, puisque `commencerNuit()` filtre sur `appelNuit` et `decision`.

---

## Étape 3 : un nouveau moment d'expiration dans `src/moteur/types.ts`

```diff
 export interface Meta {
   source?: string;
   cause?: string;
-  expire?: "aube";
+  expire?: "aube" | "fin_vote";
   [cle: string]: unknown;
 }
```

TypeScript refusera désormais toute faute de frappe comme `expire: "fin-vote"`.

---

## Étape 4 : la règle générale du tag dans `src/moteur/recevoir.ts`

On ajoute un `case` dans le switch de `donnerTag()`, juste avant `default` :

```diff
+    case "corbeau":
+      // La marque du corbeau doit survivre à l'aube et durer jusqu'à la fin du vote.
+      return r.accepter({ expire: "fin_vote" });
+
     default:
       return r.accepter();
```

> [!tip] Pourquoi dans `recevoir.ts` et pas dans `corbeau.ts` ?
> L'expiration est une propriété **du tag**, pas du rôle qui le donne. Si demain un événement « Mauvais présage » pose lui aussi le tag `corbeau`, il obtiendra la même durée de vie sans rien réécrire.

---

## Étape 5 : faire expirer le tag dans `src/moteur/partie.ts`

Le meilleur endroit est le début de `nuitSuivante()` : le vote est terminé, et la décision éventuelle du Chasseur aussi.

```diff
   nuitSuivante(): void {
     if (this.attente.length) throw new Error("Une décision est en attente.");
     if (this.verifier()) return;
+    // Les tags qui ne valent que jusqu'au vote (ex. la marque du corbeau) disparaissent.
+    for (const j of this.joueurs) {
+      for (const t of j.tags.filter(t => t.expire === "fin_vote")) this.retirerTag(j, t.type);
+    }
     this.tour++;
     this.commencerNuit();
   }
```

Ce code ne parle pas du Corbeau : il traite **tous** les tags `fin_vote`. Une future carte qui dure jusqu'au vote n'aura qu'à utiliser cette expiration.

---

## Étape 6 : l'affichage dans `src/ui/PartieVue.tsx`

Un libellé lisible pour le tag, dans le dictionnaire `TAGS` :

```diff
   mort: "⚰️ mort",
+  corbeau: "🐦‍⬛ +2 voix"
 };
```

Un rappel dans la phase de vote (composant `EtapeDeJour`, `case "vote"`), puisque le prototype ne compte pas encore les voix et que c'est le meneur qui les annonce :

```diff
           <p>Clique sur le joueur éliminé par le village.</p>
+          {partie.joueursAvecTag("corbeau").map(j => (
+            <p key={j.id} className="info-publique">🐦‍⬛ {j.nom} commence avec 2 voix contre lui.</p>
+          ))}
```

---

## Étape 7 : un test dans `src/moteur/scenario.test.ts`

Le test vérifie les trois moments clés : le tag est posé la nuit, il survit à l'aube, il disparaît après le vote.

```ts
test("corbeau : la marque survit à l'aube et disparaît après le vote", () => {
  // David devient Corbeau pour ce test.
  const p = new Partie(TABLE.map(j => j.id === "david" ? { ...j, role: "corbeau" } : j));
  p.jouer({ id: "lier", cibles: ["alice", "jules"] });   // Cupidon (priorité 50)
  p.passer();                                            // Réunion des amoureux (60)
  p.jouer({ id: "sonder", cibles: ["bob"] });            // Voyante (80)
  p.jouer({ id: "proteger", cibles: ["alice"] });        // Salvateur (100)
  p.jouer({ id: "devorer", cibles: ["hugo"] });          // Loup (120)
  p.jouer({ id: "marquer", cibles: ["bob"] });           // Corbeau (125)
  p.jouer({ id: "rien", cibles: [] });                   // Sorcière (130)
  p.leverLeJour();
  assert.ok(p.aTag(p.joueur("bob"), "corbeau"));         // a survécu à l'aube

  p.jouer({ id: "rien", cibles: [] });                   // Chasseur : Hugo est mort, décision urgente
  p.ouvrirEvenement("calme");
  assert.ok(p.infosPubliques().some(t => t.includes("Bob"))); // annoncé au village
  p.ouvrirDebat();
  p.ouvrirVote();
  p.voter(null);
  p.nuitSuivante();
  assert.ok(!p.aTag(p.joueur("bob"), "corbeau"));        // a expiré après le vote
});
```

Résultat sur une copie du projet : **8 tests sur 8 passent**.

---

## Récapitulatif

| Fichier | Modification | Spécifique au Corbeau ? |
| --- | --- | --- |
| `roles/corbeau.ts` | nouveau fichier | oui |
| `roles/index.ts` | import + ajout dans la liste | oui (une ligne) |
| `types.ts` | moment d'expiration `"fin_vote"` | non, réutilisable |
| `recevoir.ts` | `case "corbeau"` | le tag, pas le rôle |
| `partie.ts` | expiration des tags `fin_vote` | non, réutilisable |
| `ui/PartieVue.tsx` | libellé + rappel au vote | affichage seulement |
| `scenario.test.ts` | un test | oui |

**Fichiers non touchés** : `aube.ts` (le tag ne devient rien à l'aube), `victoire.ts` (camp village existant), `distribution.ts` (un seul exemplaire), `Options.tsx` (affichage automatique), et **aucun autre rôle**.

> [!warning] Limite actuelle
> Le prototype ne compte pas les voix : le meneur clique directement sur le joueur éliminé. Les « 2 voix » sont donc pour l'instant une information affichée. Le jour où le vote sera compté joueur par joueur, la fonction de comptage lira `tag.voix` sur les joueurs marqués, et le Corbeau lui-même n'aura pas à changer.
