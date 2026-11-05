/**
 * SERVICE WORKER : rend le jeu utilisable SANS connexion, après une première visite en ligne.
 *
 * CONCEPT : un service worker est un script que le navigateur installe À CÔTÉ de la page. Il
 * survit à la fermeture de l'onglet et intercepte toutes les requêtes de la page (évènement
 * "fetch"), comme un petit serveur local. Il ne peut rien afficher : il ne fait que répondre.
 * ATTENTION : il ne fonctionne qu'en https (ou sur localhost), donc sur GitHub Pages, pas en file://.
 *
 * POURQUOI dans public/ et en JS simple : Vite copie public/ tel quel à la racine de dist/,
 * sans renommer le fichier (pas de hash). Son adresse ne change jamais, c'est ce qui permet au
 * navigateur de le retrouver et de détecter qu'il a changé.
 */

const CACHE = "loup-garou";

// FLUX 1 — INSTALLATION (première visite) : on met de côté la page ET ses fichiers.
// POURQUOI lire index.html : les noms des fichiers JS/CSS changent à chaque build
// (index-CVMvHK17.js) ; on ne peut pas les écrire ici, on les lit dans la page.
self.addEventListener("install", evenement => {
  evenement.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const page = await (await fetch("./")).text();
    const fichiers = [...page.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map(m => m[1]);
    await cache.addAll(["./", ...fichiers]);
    await self.skipWaiting(); // la nouvelle version prend la main sans attendre la fermeture des onglets
  })());
});

// FLUX 2 — ACTIVATION : il prend aussi le contrôle des onglets déjà ouverts.
self.addEventListener("activate", evenement => evenement.waitUntil(self.clients.claim()));

// FLUX 3 — CHAQUE REQUÊTE : le réseau d'abord, la copie en secours.
// POURQUOI réseau d'abord (et pas cache d'abord) : en ligne, on a toujours la dernière version
// publiée ; le cache ne sert qu'hors ligne. Plus lent d'un poil en ligne, mais jamais périmé.
self.addEventListener("fetch", evenement => {
  if (evenement.request.method !== "GET") return;
  evenement.respondWith(
    fetch(evenement.request)
      .then(reponse => {
        // CONCEPT : une réponse ne se lit qu'une fois ; clone() en fait une copie pour le cache.
        const copie = reponse.clone();
        caches.open(CACHE).then(cache => cache.put(evenement.request, copie));
        return reponse;
      })
      // Hors ligne : la copie. Pour la page elle-même (".../index.html" ou ".../?x"), on retombe sur "./".
      .catch(async () =>
        (await caches.match(evenement.request, { ignoreSearch: true })) ??
        (evenement.request.mode === "navigate" ? caches.match("./") : Response.error())
      )
  );
});
