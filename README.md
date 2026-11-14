# Loup-Garou — prototype de l'oracle

Application locale (React + TypeScript + Vite) pour préparer et animer une partie de Loup-Garou.
Architecture **donner / recevoir** : voir `docs/cas-particulier.md`.

## Lancer

```bash
npm install
npm run dev        # http://localhost:5173 (et l'adresse réseau, pour le téléphone)
npm test           # scénarios du moteur
npm run scenario   # affiche le journal du cas particulier
npm run build      # vérifie les types puis produit dist/
```

## Organisation

```
src/
  moteur/                 ← aucune dépendance à React
    types.ts              ← Role, Joueur, Tag, Decision…
    partie.ts             ← état + déroulé des phases (nuit → aube → événement → débat → vote)
    donner.ts             ← étape 3 : appelle role.agir() et distribue les tags
    recevoir.ts           ← étape 4 : donnerTag() + switch des règles générales par tag
    aube.ts               ← conséquences des tags de la nuit
    victoire.ts, tours.ts, distribution.ts
    roles/                ← UN FICHIER PAR RÔLE : decision(), agir(), recevoir(), reagir()
    evenements/           ← événements du jour (même chemin que les rôles)
    scenario.test.ts      ← tests
  ui/                     ← React : Options, Préparation, Partie
```

## Ajouter un rôle

1. Créer `src/moteur/roles/<alias>.ts` (copier `loup.ts` comme modèle).
2. L'ajouter dans `src/moteur/roles/index.ts`.
3. S'il introduit un nouveau tag avec une règle générale : un `case` dans `recevoir.ts`, et sa conséquence dans `aube.ts` si besoin.

Il apparaît alors dans les Options et dans la distribution.

## Limites du prototype

- Les réglages (titres, images, joueurs) sont stockés dans le `localStorage` du navigateur : l'API Express + SQLite viendra remplacer `src/ui/stockage.ts`.
- Une seule application, pilotée par l'oracle.
- Pas encore de bouton « annuler », même si le journal le permettra.
