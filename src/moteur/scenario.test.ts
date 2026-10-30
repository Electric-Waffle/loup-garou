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

test("Cupidon : appelé les nuits 1 et 4 seulement", () => {
  const nuitsAppelees = [1, 2, 3, 4, 5, 6, 7].filter(tour => peutAgir(ROLES.cupidon, tour));
  assert.deepEqual(nuitsAppelees, [1, 4]);
});

test("Cupidon : la nuit 4, il découvre le rôle des amoureux", () => {
  const p = nuitUn();
  // shortcut : on saute directement à la nuit 4 au lieu de rejouer les nuits 2 et 3.
  p.tour = 4;
  p.commencerNuit();

  const courante = p.decisionCourante();
  assert.equal(courante?.alias, "cupidon");
  assert.deepEqual(courante?.decision.choix.map(c => c.id), ["voir"]);

  p.jouer({ id: "voir", cibles: [] });
  const infoDeCupidon = p.infos.find(i => i.pour === "ines" && i.tour === 4);
  assert.equal(infoDeCupidon?.texte, "Rôles des amoureux : Ancien, Chasseur.");
});

test("Loup succube : lie la nuit 1 et dévore même s'il est le seul loup", () => {
  const table = TABLE.map(j => {
    if (j.id === "bob") return { ...j, role: "loup-succube" };
    if (j.id === "ines") return { ...j, role: "villageois" };
    return j;
  });
  const p = new Partie(table, { aleatoire: () => 0 });
  assert.deepEqual(p.file, ["loup-succube", "voyante", "salvateur", "loup", "sorciere"]);

  p.jouer({ id: "lier", cibles: ["alice", "jules"] });
  assert.equal(p.partenaireDe(p.joueur("alice"))?.id, "jules");

  p.jouer({ id: "sonder", cibles: ["bob"] });
  p.jouer({ id: "proteger", cibles: ["chloe"] });
  assert.deepEqual(p.decisionCourante()?.porteurs.map(j => j.id), ["bob"]);
  p.jouer({ id: "devorer", cibles: ["david"] });
  p.jouer({ id: "rien", cibles: [] });
  p.leverLeJour();
  assert.equal(p.joueur("david").vivant, false);
});

test("distribution : le nombre de loups choisi, complétée par des villageois", () => {
  const cartes = composer(8, 3, ["loup", "villageois", "voyante", "sorciere"]);
  assert.equal(cartes.length, 8);
  assert.equal(cartes.filter(c => c === "loup").length, 3);
  assert.equal(cartes.filter(c => c === "villageois").length, 3);
  assert.throws(() => composer(8, 2, ["loup", "voyante"]));
  assert.throws(() => composer(8, 8, ["loup", "villageois"]));
  assert.throws(() => composer(8, 0, ["loup", "villageois"]));
});

test("distribution : loups spéciaux et Loups-Garous en proportion aléatoire", () => {
  const actifs = ["loup", "loup-succube", "villageois"];
  // Hasard toujours à 0 : le tirage donne le minimum, soit aucun loup spécial.
  assert.deepEqual(composer(8, 2, actifs, () => 0).filter(c => c !== "villageois"), ["loup", "loup"]);
  // Hasard presque à 1 : le maximum, soit le seul loup spécial activé.
  const loupsAuMax = composer(8, 2, actifs, () => 0.99).filter(c => c !== "villageois").sort();
  assert.deepEqual(loupsAuMax, ["loup", "loup-succube"]);
});

test("distribution : sans Loup-Garou, tous les loups doivent être spéciaux", () => {
  const actifs = ["loup-succube", "villageois"];
  assert.deepEqual(composer(5, 1, actifs).filter(c => c !== "villageois"), ["loup-succube"]);
  assert.throws(() => composer(5, 2, actifs));
});
