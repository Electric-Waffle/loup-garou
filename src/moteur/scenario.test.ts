import assert from "node:assert/strict";
import { test } from "node:test";
import { composer } from "./distribution";
import { Partie } from "./partie";
import { ROLES } from "./roles";
import { nuitDeux, nuitUn, TABLE } from "./scenario";
import { peutAgir } from "./tours";

test("nuit 1 : le salvateur bloque la morsure, Cupidon lie Emma et Hugo", () => {
  const p = nuitUn();
  assert.equal(p.tour, 2);
  assert.equal(p.vivants().length, 8);
  assert.ok(p.journal.some(e => e.type === "bloque" && e.tag === "mordu" && e.joueur === "david"));
  assert.equal(p.partenaireDe(p.joueur("emma"))?.id, "hugo");
  assert.ok(p.aTag(p.joueur("david"), "protege_hier"));
  assert.ok(!p.aTag(p.joueur("david"), "protege"));
});

test("nuit 2 : Cupidon n'est plus appelé", () => {
  const p = nuitUn();
  assert.deepEqual(p.file, ["voyante", "salvateur", "loup", "sorciere"]);
});

test("cas particulier : l'Ancien survit à la morsure mais meurt de chagrin", () => {
  const p = nuitUn();
  nuitDeux(p);

  const emma = p.joueur("emma");
  assert.equal(emma.vivant, false);
  assert.ok(p.journal.some(e => e.type === "transforme" && e.joueur === "emma" && e.en === "vie_perdue"));
  assert.ok(p.journal.some(e => e.type === "recu" && e.tag === "mort" && e.joueur === "emma" && e.cause === "chagrin"));
  assert.ok(p.journal.some(e => e.type === "bloque" && e.tag === "protege" && e.joueur === "david"));

  assert.deepEqual(p.joueurs.filter(j => !j.vivant).map(j => j.id).sort(), ["bob", "emma", "hugo"]);
  assert.equal(p.vainqueur, "Le village");
  assert.equal(p.phase, "fin");
});

test("l'Ancien empoisonné meurt directement", () => {
  const p = new Partie(TABLE.map(j => j.id === "ines" ? { ...j, role: "villageois" } : j));
  p.jouer({ id: "sonder", cibles: ["bob"] });
  p.jouer({ id: "proteger", cibles: ["alice"] });
  p.jouer({ id: "devorer", cibles: ["david"] });
  p.jouer({ id: "tuer", cibles: ["emma"] });
  p.leverLeJour();
  assert.equal(p.joueur("emma").vivant, false);
  assert.equal(p.joueur("david").vivant, false);
});

test("la sorcière sauve la victime", () => {
  const p = new Partie(TABLE);
  p.jouer({ id: "lier", cibles: ["alice", "bob"] });
  p.jouer({ id: "sonder", cibles: ["bob"] });
  p.jouer({ id: "proteger", cibles: ["alice"] });
  p.jouer({ id: "devorer", cibles: ["david"] });
  p.jouer({ id: "sauver", cibles: ["david"] });
  p.leverLeJour();
  assert.equal(p.morts().length, 0);
  assert.equal(p.joueur("chloe").memoire.potionVie, false);
});

test("champ tours", () => {
  assert.equal(peutAgir(ROLES.cupidon, 1), true);
  assert.equal(peutAgir(ROLES.cupidon, 2), false);
  assert.equal(peutAgir({ ...ROLES.loup, tours: { de: 2 } }, 1), false);
  assert.equal(peutAgir({ ...ROLES.loup, tours: { de: 2, chaque: 2 } }, 4), true);
  assert.equal(peutAgir({ ...ROLES.loup, tours: { de: 2, chaque: 2 } }, 3), false);
});

test("distribution : 1 loup pour 4 joueurs, complétée par des villageois", () => {
  const cartes = composer(8, ["loup", "villageois", "voyante", "sorciere"]);
  assert.equal(cartes.length, 8);
  assert.equal(cartes.filter(c => c === "loup").length, 2);
  assert.equal(cartes.filter(c => c === "villageois").length, 4);
  assert.throws(() => composer(8, ["loup", "voyante"]));
});
