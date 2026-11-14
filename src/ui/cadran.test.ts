import { test } from "node:test";
import assert from "node:assert/strict";
import { finDuCadran, positionsFetards, prochainAngle } from "./Cadran";

test("un villageois en fête par survivant, jamais devant le temple, l'intrus toujours en x = 26", () => {
  for (const survivants of [1, 2, 3, 8, 15]) {
    const xs = positionsFetards(survivants);
    assert.equal(xs.length, survivants);
    assert.equal(xs[0], 26);
    assert.ok(xs.every(x => x <= 64 || x >= 136), `${survivants} survivants : un point devant le temple`);
  }
});

test("le cadran avance de la nuit vers l'aube au lieu de reculer", () => {
  assert.equal(prochainAngle(180, -70), 290); // +110°, et pas -250°
});

test("le cadran continue d'avancer jour après jour", () => {
  assert.equal(prochainAngle(290, 0), 360);   // aube → débat
  assert.equal(prochainAngle(360, 70), 430);  // débat → résultat du vote
  assert.equal(prochainAngle(430, 180), 540); // résultat → nuit
});

test("un vote relancé fait reculer un peu le soleil", () => {
  assert.equal(prochainAngle(70, 35), 35);
});

test("même phase : le cadran ne bouge pas", () => {
  assert.equal(prochainAngle(540, 180), 540);
});

// POURQUOI ces textes exacts : ce sont ceux que renvoie victoire.ts. S'il change ses phrases,
// ce test casse, au lieu que le cadran perde silencieusement son animation de fin.
test("le texte du vainqueur donne la bonne animation de fin", () => {
  assert.equal(finDuCadran("Les loups-garous"), "loups");
  assert.equal(finDuCadran("Le village"), "village");
  assert.equal(finDuCadran("Le village (toutes les maisons sont renforcées)"), "village");
  assert.equal(finDuCadran("Le skinwalker (il vole la victoire du village)"), "skinwalker");
  assert.equal(finDuCadran("Le fou"), "fou");
  assert.equal(finDuCadran("L'aberration"), "aberration");
  assert.equal(finDuCadran("Les amoureux"), undefined);
  assert.equal(finDuCadran(undefined), undefined);
});
