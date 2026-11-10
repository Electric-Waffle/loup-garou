import assert from "node:assert/strict";
import { test } from "node:test";
import { aube } from "./aube";
import { composer } from "./distribution";
import { Partie } from "./partie";
import { donnerTag } from "./recevoir";
import { LISTE_ROLES, ROLES } from "./roles";
import { nuitDeux, nuitUn, TABLE } from "./scenario";
import { peutAgir } from "./tours";
import { verifierVictoire } from "./victoire";

test("nuit 1 : le salvateur bloque la morsure, Cupidon lie Emma et Hugo", () => {
  const p = nuitUn();
  assert.equal(p.tour, 2);
  assert.equal(p.vivants().length, 8);
  assert.ok(p.journal.some(e => e.type === "bloque" && e.tag === "mordu" && e.joueur === "david"));
  assert.deepEqual(p.partenairesDe(p.joueur("emma")).map(j => j.id), ["hugo"]);
  assert.ok(p.aTag(p.joueur("david"), "protege_hier"));
  assert.ok(!p.aTag(p.joueur("david"), "protege"));
});

test("nuit 2 : Cupidon n'est plus appelé", () => {
  const p = nuitUn();
  assert.deepEqual(p.file, ["conciliabule", "reunion-amoureux", "voyante", "salvateur", "loup", "sorciere"]);
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
  p.passer(); // Réunion des amoureux
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

test("Cupidon : appelé les nuits 1 et 3 seulement", () => {
  const nuits = [1, 2, 3, 4, 5, 6, 7];
  assert.deepEqual(nuits.filter(tour => peutAgir(ROLES.cupidon, tour)), [1, 3]);
});

test("Cupidon : la nuit 3, il découvre le rôle des amoureux", () => {
  const p = nuitUn();
  // shortcut : on saute directement à la nuit 3 au lieu de rejouer la nuit 2.
  p.tour = 3;
  p.commencerNuit();

  const courante = p.decisionCourante();
  assert.equal(courante?.alias, "cupidon");
  assert.deepEqual(courante?.decision.choix.map(c => c.id), ["voir"]);

  p.jouer({ id: "voir", cibles: [] });
  const infoDeCupidon = p.infos.find(i => i.pour === "ines" && i.tour === 3);
  assert.equal(infoDeCupidon?.texte, "Rôles des amoureux : Ancien, Chasseur.");
});

test("Loup succube : se lie la nuit 1 et dévore même s'il est le seul loup", () => {
  const table = TABLE.map(j => {
    if (j.id === "bob") return { ...j, role: "loup-succube" };
    if (j.id === "ines") return { ...j, role: "villageois" };
    return j;
  });
  const p = new Partie(table, { aleatoire: () => 0 });
  // Après le Salvateur (100), pour voir sa protection.
  assert.deepEqual(p.file, ["conciliabule", "reunion-amoureux", "voyante", "salvateur", "loup-succube", "loup", "sorciere"]);

  p.jouer({ id: "sonder", cibles: ["bob"] });
  p.jouer({ id: "proteger", cibles: ["chloe"] });
  p.jouer({ id: "lier", cibles: ["jules"] });
  assert.deepEqual(p.partenairesDe(p.joueur("bob")).map(j => j.id), ["jules"]);
  assert.deepEqual(p.partenairesDe(p.joueur("jules")), []);

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

/* ---------- Rat, rat-garou, peste et maire ---------- */

/** La table de référence, avec un Rat à la place de David et sans Cupidon. */
function tableAvecRat() {
  return TABLE.map(j => {
    if (j.id === "david") return { ...j, role: "rat" };
    if (j.id === "ines") return { ...j, role: "villageois" };
    return j;
  });
}

/** Joue la nuit 1 jusqu'à la morsure du Rat (Voyante, Salvateur, Loups). */
function morsureDuRat(): Partie {
  const p = new Partie(tableAvecRat(), { aleatoire: () => 0 });
  p.jouer({ id: "sonder", cibles: ["bob"] });
  p.jouer({ id: "proteger", cibles: ["alice"] });
  p.jouer({ id: "devorer", cibles: ["david"] });
  return p;
}

test("Rat : mordu, il choisit de mordre ; la Sorcière ne le voit pas et il meurt à l'aube", () => {
  const p = morsureDuRat();
  const urgente = p.decisionCourante();
  assert.equal(urgente?.alias, "rat");
  assert.equal(urgente?.urgente, true);

  p.jouer({ id: "mordre", cibles: [] });
  assert.ok(p.aTag(p.joueur("bob"), "peste"));
  assert.ok(p.aTag(p.joueur("david"), "agonisant"));

  // La Sorcière ne voit aucune victime : pas de potion de vie proposée.
  const sorciere = p.decisionCourante();
  assert.equal(sorciere?.alias, "sorciere");
  assert.ok(!sorciere?.decision.choix.some(c => c.id === "sauver"));
  p.jouer({ id: "rien", cibles: [] });

  p.leverLeJour();
  assert.deepEqual(p.morts().map(m => [m.joueur.id, m.cause]), [["david", "mordu"]]);
});

test("Rat : il rejoint la meute et survit à la morsure", () => {
  const p = morsureDuRat();
  p.jouer({ id: "transformer", cibles: [] });
  assert.equal(p.joueur("david").role, "rat-garou");
  assert.ok(!p.aTag(p.joueur("david"), "mordu"));

  p.jouer({ id: "rien", cibles: [] }); // Sorcière
  p.leverLeJour();
  assert.equal(p.joueur("david").vivant, true);
  assert.deepEqual(p.porteursDe("loup").map(j => j.id), ["bob", "david"]);
});

test("Peste : la victime meurt à la 4e aube, pas avant", () => {
  const p = new Partie(tableAvecRat());
  const bob = p.joueur("bob");
  donnerTag(p, bob, "peste", { source: "rat" });

  for (let i = 1; i <= 3; i++) {
    aube(p);
    assert.equal(bob.vivant, true, `vivant après l'aube ${i}`);
  }
  aube(p);
  assert.equal(bob.vivant, false);
  assert.ok(p.journal.some(e => e.type === "recu" && e.tag === "mort" && e.joueur === "bob" && e.cause === "peste"));
});

test("Rat-garou : il meurt à l'aube s'il est le dernier de la meute", () => {
  const table = TABLE.map(j => j.id === "david" ? { ...j, role: "rat-garou" } : j);
  const p = new Partie(table);
  aube(p);
  assert.equal(p.joueur("david").vivant, true); // Bob, le loup, est encore là

  donnerTag(p, p.joueur("bob"), "mort", { cause: "vote" });
  aube(p);
  assert.equal(p.joueur("david").vivant, false);
});

test("Victoire : un rat-garou face à un seul joueur fait gagner le village", () => {
  const p = new Partie([
    { id: "r", nom: "R", image: "", role: "rat-garou" },
    { id: "v", nom: "V", image: "", role: "villageois" },
    { id: "w", nom: "W", image: "", role: "villageois" }
  ]);
  donnerTag(p, p.joueur("w"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(p), "Le village");
});

test("Maire : élu AVANT l'événement s'il n'y en a pas, puis plus d'élection", () => {
  const p = nuitUn(); // jour 1 : aube → élection de Jules → événement → débat
  assert.ok(p.aTag(p.joueur("jules"), "maire"));
  assert.ok(p.journal.findIndex(e => e.texte === "election") < p.journal.findIndex(e => e.texte === "evenement"));

  p.passer(); // Réunion des amoureux
  p.jouer({ id: "sonder", cibles: ["chloe"] });
  p.jouer({ id: "proteger", cibles: ["alice"] });
  p.jouer({ id: "devorer", cibles: ["david"] });
  p.jouer({ id: "rien", cibles: [] });
  p.leverLeJour();
  p.suiteDeLAube();
  assert.equal(p.phase, "evenement"); // un maire vivant : pas d'élection
  assert.equal(p.aBesoinDUnMaire(), false);
});

test("Rat voté par le village : le maire attrape la peste", () => {
  const p = new Partie(tableAvecRat());
  donnerTag(p, p.joueur("jules"), "maire");
  p.voter("david");
  assert.ok(p.aTag(p.joueur("jules"), "peste"));
});

/* ---------- Fou, Loup savant, Fée, Arlequin, cartes fantômes ---------- */

const ROLES_DE_LA_TABLE = TABLE.map(j => j.role);

/** Une petite partie à partir d'une liste de rôles : joueurs j0, j1, j2… */
function partieAvec(roles: string[], options = {}): Partie {
  const joueurs = roles.map((role, i) => ({ id: `j${i}`, nom: `J${i}`, image: "", role }));
  return new Partie(joueurs, options);
}

test("Fou : il vote avec les loups et leur vole la victoire s'il est vivant", () => {
  const p = partieAvec(["loup", "fou", "villageois"]);
  assert.deepEqual(p.porteursDe("loup").map(j => j.id), ["j0", "j1"]);
  assert.equal(verifierVictoire(p), undefined);
  donnerTag(p, p.joueur("j2"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(p), "Le fou");
});

test("Rat-garou : un Fou vivant ne l'empêche pas d'être le dernier loup", () => {
  const p = partieAvec(["rat-garou", "fou", "villageois", "villageois"]);
  aube(p);
  assert.equal(p.joueur("j0").vivant, false);
});

test("Loup savant : 3 cartes hors jeu, que la Voyante peut sonder", () => {
  const horsJeu = ["fee", "arlequin", "rat", "fou"];
  const table = TABLE.map(j => j.id === "david" ? { ...j, role: "loup-savant" } : j);
  const p = new Partie(table, { aleatoire: () => 0, cartesActives: [...table.map(j => j.role), ...horsJeu] });

  assert.equal(p.cartesDuSavant.length, 3);
  assert.ok(p.cartesDuSavant.every(alias => horsJeu.includes(alias)));

  p.jouer({ id: "lier", cibles: ["emma", "hugo"] }); // Cupidon
  p.passer(); // Réunion des amoureux
  const voyante = p.decisionCourante();
  assert.equal(voyante?.alias, "voyante");
  const carte = p.cartesDuSavant[0];
  assert.ok(voyante?.decision.choix.some(c => c.id === `carte:${carte}`));
  p.jouer({ id: `carte:${carte}`, cibles: [] });
  assert.ok(p.infos.some(i => i.pour === "jules" && i.texte.endsWith("n'a été distribuée à personne.")));
});

test("Loup savant inactif : aucune carte hors jeu tirée", () => {
  const p = new Partie(TABLE, { cartesActives: [...ROLES_DE_LA_TABLE, "fee", "rat"] });
  assert.deepEqual(p.cartesDuSavant, []);
});

test("Fée : un joueur enchanté ne peut que passer, et un Chasseur enchanté ne tire pas", () => {
  const p = new Partie(TABLE);
  donnerTag(p, p.joueur("jules"), "enchante", { expire: "aube" });
  donnerTag(p, p.joueur("hugo"), "enchante", { expire: "aube" });

  p.jouer({ id: "lier", cibles: ["alice", "bob"] }); // Cupidon
  p.passer(); // Réunion des amoureux
  const voyante = p.decisionCourante();
  assert.equal(voyante?.alias, "voyante");
  assert.deepEqual(voyante?.decision.choix, []);
  p.passer();

  p.jouer({ id: "proteger", cibles: ["alice"] });
  p.jouer({ id: "devorer", cibles: ["hugo"] });
  p.jouer({ id: "rien", cibles: [] });
  p.leverLeJour();
  assert.equal(p.joueur("hugo").vivant, false);
  assert.equal(p.attente.length, 0); // pas de tir
  assert.ok(!p.aTag(p.joueur("jules"), "enchante")); // expiré à la fin de l'aube
});

test("Fée : un Rat enchanté mordu ne choisit pas et peut être sauvé", () => {
  const p = morsureDuRatEnchante();
  const sorciere = p.decisionCourante();
  assert.equal(sorciere?.alias, "sorciere");
  assert.ok(sorciere?.decision.choix.some(c => c.id === "sauver"));
});

function morsureDuRatEnchante(): Partie {
  const p = new Partie(tableAvecRat());
  donnerTag(p, p.joueur("david"), "enchante", { expire: "aube" });
  p.jouer({ id: "sonder", cibles: ["bob"] });
  p.jouer({ id: "proteger", cibles: ["alice"] });
  p.jouer({ id: "devorer", cibles: ["david"] });
  return p;
}

test("Arlequin : un joueur lié ne vise que lui-même et son partenaire, sauf en groupe", () => {
  const p = new Partie(TABLE);
  const alice = p.joueur("alice");
  const jules = p.joueur("jules");
  donnerTag(p, alice, "lie", { partenaire: "jules", expire: "aube" });
  donnerTag(p, jules, "lie", { partenaire: "alice", expire: "aube" });

  assert.deepEqual(p.ciblesPossibles("un_joueur", alice).map(j => j.id), ["alice", "jules"]);
  assert.deepEqual(p.ciblesPossibles("un_autre", jules).map(j => j.id), ["alice"]);
  // Carte de groupe (deux porteurs) : aucune restriction.
  assert.equal(p.ciblesPossibles("un_joueur", alice, [alice, jules]).length, 8);
});

test("Cartes fantômes : appelées avec seulement « Passer », et seulement si l'option est active", () => {
  const actifs = [...ROLES_DE_LA_TABLE, "arlequin", "fee"];
  const sansOption = new Partie(TABLE, { cartesActives: actifs });
  assert.ok(!sansOption.file.includes("arlequin"));

  const p = new Partie(TABLE, { cartesActives: actifs, cartesFantomes: true });
  assert.ok(!p.file.includes("fee")); // la Fée n'agit qu'à partir de la nuit 2
  const fantome = p.decisionCourante();
  assert.equal(fantome?.alias, "arlequin");
  assert.deepEqual(fantome?.porteurs, []);
  assert.deepEqual(fantome?.decision.choix, []);
  p.passer();
  assert.equal(p.decisionCourante()?.alias, "cupidon");
});

test("Marchand : voté, il paie avec son or et le village revote", () => {
  const p = partieAvec(["loup", "marchand", "villageois", "villageois"]);
  assert.ok(p.aTag(p.joueur("j1"), "or"));

  p.voter("j1");
  assert.equal(p.joueur("j1").vivant, true);
  assert.equal(p.phase, "debat");
  assert.equal(p.plaidoirie, "j1");
  assert.ok(!p.aTag(p.joueur("j1"), "or"));

  p.voter("j1");
  assert.equal(p.joueur("j1").vivant, false);
  assert.equal(p.phase, "resultat_vote");
  assert.equal(p.morts().length, 1);
});

test("Marchand : dévoré, son or passe à un des loups", () => {
  const p = partieAvec(["loup", "loup", "marchand", "villageois", "villageois"]);
  p.jouer({ id: "devorer", cibles: ["j2"] });
  p.leverLeJour();
  assert.equal(p.joueur("j2").vivant, false);
  assert.equal(p.joueursAvecTag("or").filter(j => j.role === "loup").length, 1);
});

test("Marchand : sans tueur vivant, le mourant choisit à qui donner l'or", () => {
  const p = partieAvec(["loup", "marchand", "villageois", "villageois"]);
  donnerTag(p, p.joueur("j1"), "mort", { cause: "chagrin", source: "j3" });
  const courante = p.decisionCourante();
  assert.equal(courante?.alias, "marchand");
  assert.equal(courante?.urgente, true);

  p.jouer({ id: "donner", cibles: ["j2"] });
  assert.ok(p.aTag(p.joueur("j2"), "or"));
  assert.ok(!p.aTag(p.joueur("j1"), "or"));
});

test("Paysan : voté, il assomme deux joueurs", () => {
  const p = partieAvec(["loup", "paysan", "villageois", "villageois", "villageois"]);
  p.voter("j1");
  assert.equal(p.decisionCourante()?.alias, "paysan");
  p.jouer({ id: "assommer", cibles: ["j2", "j0"] });
  assert.ok(p.aTag(p.joueur("j2"), "enchante"));
  assert.ok(p.aTag(p.joueur("j0"), "enchante"));
});

test("Paysan : dévoré, les loups blessés ne chassent pas la nuit suivante", () => {
  const p = partieAvec(["loup", "loup", "paysan", "villageois", "villageois", "villageois"]);
  p.jouer({ id: "devorer", cibles: ["j2"] });
  p.leverLeJour();
  // ATTENTION : le tag a survécu au nettoyage de CETTE aube grâce à "aube_suivante".
  assert.ok(p.aTag(p.joueur("j0"), "blesse") && p.aTag(p.joueur("j1"), "blesse"));

  p.nuitSuivante();
  assert.deepEqual(p.decisionCourante()?.decision.choix, []);
  p.passer();
  p.leverLeJour();
  assert.ok(!p.aTag(p.joueur("j0"), "blesse"));
});

test("Bâtisseur : toutes les maisons villageoises vivantes renforcées, avant la victoire des loups", () => {
  const p = partieAvec(["loup", "batisseur", "villageois"]);
  donnerTag(p, p.joueur("j1"), "renforce");
  assert.equal(verifierVictoire(p), undefined);

  // 1 loup contre 1 villageois vivant : les loups gagneraient, mais la maison passe avant.
  donnerTag(p, p.joueur("j2"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(p), "Le village (toutes les maisons sont renforcées)");

  // [].every() vaut true : sans villageois vivant, pas de victoire du Bâtisseur.
  assert.equal(verifierVictoire(partieAvec(["loup", "fou"])), "Le fou");
});

/* ---------- Loup vampire ---------- */

/** Une petite table : un Loup vampire, un Loup-Garou, et des villageois. */
function tableAvecVampire() {
  return [
    { id: "v", nom: "Vlad", image: "", role: "loup-vampire" },
    { id: "b", nom: "Bob", image: "", role: "loup" },
    { id: "x", nom: "Xavier", image: "", role: "villageois" },
    { id: "y", nom: "Yasmine", image: "", role: "villageois" },
    { id: "z", nom: "Zoé", image: "", role: "villageois" }
  ];
}

/** Lie deux joueurs comme le ferait Cupidon. */
function lierAmoureux(p: Partie, a: string, b: string) {
  donnerTag(p, p.joueur(a), "amoureux", { partenaires: [b] });
  donnerTag(p, p.joueur(b), "amoureux", { partenaires: [a] });
}

test("Loup vampire : invulnérable dès le lancement, et il vote avec les loups", () => {
  const p = new Partie(tableAvecVampire());
  assert.ok(p.aTag(p.joueur("v"), "invulnerable"));
  assert.deepEqual(p.porteursDe("loup").map(j => j.id).sort(), ["b", "v"]);
});

test("Loup vampire : aucune mort ne passe, sauf le vote du village", () => {
  const p = new Partie(tableAvecVampire());
  const vampire = p.joueur("v");

  for (const cause of ["poison", "chasseur", "chagrin", "peste", "mordu"]) {
    const issue = donnerTag(p, vampire, "mort", { cause });
    assert.equal(issue, "bloque", `cause ${cause}`);
    assert.equal(vampire.vivant, true, `toujours vivant après : ${cause}`);
  }

  p.voter("v");
  assert.equal(vampire.vivant, false);
  assert.deepEqual(p.morts().map(m => [m.joueur.id, m.cause]), [["v", "vote"]]);
});

test("Loup vampire : empoisonné ou pestiféré, il survit à l'aube sans boucle", () => {
  const p = new Partie(tableAvecVampire());
  const vampire = p.joueur("v");
  donnerTag(p, vampire, "empoisonne", { source: "sorciere" });
  donnerTag(p, vampire, "peste", { source: "rat" });

  // 4 aubes : le poison est bloqué à la 1re, la peste à la 4e.
  for (let i = 1; i <= 4; i++) aube(p);

  assert.equal(vampire.vivant, true);
  assert.ok(!p.aTag(vampire, "empoisonne") && !p.aTag(vampire, "peste_mortelle"));
  const bloquees = p.journal.filter(e => e.type === "bloque" && e.joueur === "v" && e.tag === "mort");
  assert.deepEqual(bloquees.map(e => e.cause), ["poison", "peste"]);
});

test("Loup vampire amoureux : il survit au chagrin, mais son vote entraîne la mort de l'autre", () => {
  const p = new Partie(tableAvecVampire());
  lierAmoureux(p, "v", "x");
  donnerTag(p, p.joueur("x"), "mort", { cause: "poison" });
  assert.equal(p.joueur("x").vivant, false);
  assert.equal(p.joueur("v").vivant, true);

  const p2 = new Partie(tableAvecVampire());
  lierAmoureux(p2, "v", "y");
  p2.voter("v");
  assert.equal(p2.joueur("v").vivant, false);
  assert.equal(p2.joueur("y").vivant, false);
  assert.deepEqual(p2.morts().map(m => [m.joueur.id, m.cause]), [["v", "vote"], ["y", "chagrin"]]);
});

test("Loup vampire : avec de l'or, il rachète son vote comme n'importe qui", () => {
  const p = new Partie(tableAvecVampire());
  donnerTag(p, p.joueur("v"), "or", { source: "x", cause: "heritage" });
  p.voter("v");
  assert.equal(p.joueur("v").vivant, true);
  assert.equal(p.plaidoirie, "v");
});

test("Loup vampire : distribué comme loup spécial", () => {
  const cartes = composer(5, 1, ["loup-vampire", "villageois"]);
  assert.deepEqual(cartes.filter(c => c !== "villageois"), ["loup-vampire"]);
});

/* ---------- Prêtre pur ou impur ---------- */

test("Prêtre : la nuit 1 seulement ; impur, il devient un Prêtre impur, du camp des loups", () => {
  const p = partieAvec(["loup", "pretre", "villageois", "villageois"]);
  assert.deepEqual(p.file, ["conciliabule", "reunion-amoureux", "pretre", "loup"]);
  assert.deepEqual(p.decisionCourante()?.decision.choix.map(c => c.id), ["pur", "impur"]);

  p.jouer({ id: "impur", cibles: [] });
  assert.equal(p.joueur("j1").role, "pretre-impur");
  assert.equal(p.roleDe(p.joueur("j1")).camp, "loups");
  assert.deepEqual(p.porteursDe("loup").map(j => j.id), ["j0"]); // la meute ne le connaît pas
  assert.deepEqual([1, 2, 3].filter(tour => peutAgir(ROLES.pretre, tour)), [1]);
});

test("Prêtre impur : il compte comme un loup, et le village doit l'éliminer aussi", () => {
  const majorite = partieAvec(["loup", "pretre", "villageois"]);
  majorite.jouer({ id: "impur", cibles: [] });
  assert.equal(verifierVictoire(majorite), "Les loups-garous"); // 2 « loups » contre 1

  const village = partieAvec(["loup", "pretre", "villageois", "villageois", "villageois"]);
  village.jouer({ id: "impur", cibles: [] });
  donnerTag(village, village.joueur("j0"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(village), undefined);           // le prêtre impur vit encore
  donnerTag(village, village.joueur("j1"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(village), "Le village");
});

test("Prêtre pur (ou sans choix) : il reste un Prêtre du village", () => {
  const pur = partieAvec(["loup", "pretre", "villageois"]);
  pur.jouer({ id: "pur", cibles: [] });
  assert.equal(pur.joueur("j1").role, "pretre");
  donnerTag(pur, pur.joueur("j0"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(pur), "Le village");

  const sansChoix = partieAvec(["loup", "pretre", "villageois"]);
  sansChoix.passer();
  assert.equal(sansChoix.joueur("j1").role, "pretre");
});

test("Prêtre impur et Fou vivant : le Fou gagne seul", () => {
  const p = partieAvec(["loup", "fou", "pretre", "villageois"]);
  p.jouer({ id: "impur", cibles: [] });
  donnerTag(p, p.joueur("j3"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(p), "Le fou");
});

test("Prêtre impur, Faux Parleur, Rat-garou : distribuables seuls, sans leur carte du village", () => {
  const p = partieAvec(["pretre-impur", "faux-parleur", "rat-garou", "villageois", "villageois", "villageois"]);
  assert.deepEqual(p.porteursDe("loup").map(j => j.id), ["j1", "j2"]); // le prêtre impur ne se réveille pas
  donnerTag(p, p.joueur("j1"), "mort", { cause: "mordu" });            // le Faux Parleur a deux vies
  assert.equal(p.joueur("j1").vivant, true);
});

/* ---------- Loup amoureux, Loup succube, victoire des amoureux ---------- */

test("Loup amoureux : se lie la nuit 1, après le Salvateur, et le partenaire est prévenu", () => {
  const p = partieAvec(["loup-amoureux", "cupidon", "villageois", "villageois", "villageois"]);
  assert.deepEqual(p.file, ["conciliabule", "cupidon", "reunion-amoureux", "loup-amoureux", "loup"]);

  p.jouer({ id: "lier", cibles: ["j3", "j4"] }); // Cupidon
  p.passer();                                    // Réunion
  p.jouer({ id: "lier", cibles: ["j2"] });
  assert.deepEqual(p.partenairesDe(p.joueur("j0")).map(j => j.id), ["j2"]);
  assert.deepEqual(p.partenairesDe(p.joueur("j2")).map(j => j.id), ["j0"]);
  assert.ok(p.infos.some(i => i.pour === "j2" && i.texte.includes("J0")));

  // Chagrin dans les deux sens.
  donnerTag(p, p.joueur("j2"), "mort", { cause: "poison" });
  assert.equal(p.joueur("j0").vivant, false);
});

test("Réseau : Cupidon ajoute un lien au Loup amoureux, et la mort se propage en cascade", () => {
  const p = partieAvec(["loup-amoureux", "cupidon", "villageois", "villageois", "villageois", "villageois"]);
  p.jouer({ id: "lier", cibles: ["j2", "j3"] }); // Cupidon : j2 ↔ j3
  p.passer();                                    // Réunion de la nuit 1 : j2 et j3
  p.jouer({ id: "lier", cibles: ["j2"] });       // Loup amoureux : j0 ↔ j2
  assert.deepEqual(p.partenairesDe(p.joueur("j2")).map(j => j.id), ["j3", "j0"]);

  // Nuit 2 : les trois amoureux se réveillent ensemble, avec un minuteur de 60 s.
  p.passer(); // loups
  p.leverLeJour();
  p.tour = 2;
  p.commencerNuit();
  const reunion = p.decisionCourante();
  assert.equal(reunion?.alias, "reunion-amoureux");
  assert.deepEqual(reunion?.porteurs.map(j => j.id), ["j0", "j2", "j3"]);
  assert.equal(reunion?.decision.minuteur, 60);
  p.passer();

  // j3 meurt → j2 de chagrin → j0 de chagrin.
  donnerTag(p, p.joueur("j3"), "mort", { cause: "poison" });
  assert.deepEqual(p.morts(0).map(m => [m.joueur.id, m.cause]), [["j3", "poison"], ["j2", "chagrin"], ["j0", "chagrin"]]);
});

test("Réunion des amoureux : sans le Loup succube, et sautée s'il reste moins de 2 amoureux", () => {
  const p = partieAvec(["loup-succube", "cupidon", "villageois", "villageois", "villageois"]);
  p.jouer({ id: "lier", cibles: ["j3", "j4"] }); // Cupidon : j3 ↔ j4
  p.passer();                                    // Réunion : j3 et j4
  p.jouer({ id: "lier", cibles: ["j2"] });       // Succube → j2, APRÈS la réunion de cette nuit

  // Nuit suivante : son compagnon vient à la réunion, le Succube non.
  p.tour = 2;
  p.commencerNuit();
  assert.deepEqual(p.decisionCourante()?.porteurs.map(j => j.id), ["j2", "j3", "j4"]);
  // Une étape de la nuit n'est pas une carte distribuable.
  assert.ok(!LISTE_ROLES.some(r => r.alias === "reunion-amoureux"));

  // Un seul amoureux hors Succube (son compagnon) : la réunion est sautée.
  const seul = partieAvec(["loup-succube", "villageois", "villageois"]);
  seul.jouer({ id: "lier", cibles: ["j1"] });
  seul.tour = 2;
  seul.commencerNuit();
  assert.equal(seul.decisionCourante()?.alias, "loup-succube");
});

test("Loup succube : un compagnon protégé par le Salvateur fait échouer le lien jusqu'à la nuit suivante", () => {
  const p = partieAvec(["loup-succube", "salvateur", "villageois", "villageois"]);
  p.jouer({ id: "proteger", cibles: ["j2"] });
  p.jouer({ id: "lier", cibles: ["j2"] });
  assert.ok(!p.aTag(p.joueur("j2"), "amoureux"));
  assert.ok(!p.aTag(p.joueur("j0"), "amoureux"));

  // Pendant le jour, il n'est lié à personne : sa mort n'emporte personne.
  p.passer(); // loups
  p.leverLeJour();
  assert.deepEqual(p.partenairesDe(p.joueur("j0")), []);

  p.tour = 2;
  p.commencerNuit();
  p.jouer({ id: "proteger", cibles: ["j3"] });
  assert.deepEqual(p.decisionCourante()?.decision.choix.map(c => c.id), ["lier"]);
});

test("Loup succube : lien à sens unique, puis nouveau compagnon la nuit suivante", () => {
  const p = partieAvec(["loup-succube", "villageois", "villageois", "villageois", "villageois"]);
  p.jouer({ id: "lier", cibles: ["j1"] });

  // Le compagnon meurt : le Succube survit.
  donnerTag(p, p.joueur("j1"), "mort", { cause: "poison" });
  assert.equal(p.joueur("j0").vivant, true);

  p.tour = 2;
  p.commencerNuit();
  assert.deepEqual(p.decisionCourante()?.decision.choix.map(c => c.id), ["lier"]);
  p.jouer({ id: "lier", cibles: ["j2"] });

  // Le Succube meurt : son nouveau compagnon le suit.
  donnerTag(p, p.joueur("j0"), "mort", { cause: "vote" });
  assert.equal(p.joueur("j2").vivant, false);
  assert.deepEqual(p.morts(0).map(m => m.cause), ["poison", "vote", "chagrin"]);
});

test("Loup succube : avec un compagnon vivant, il ne fait que passer", () => {
  const p = partieAvec(["loup-succube", "villageois", "villageois", "villageois"]);
  p.jouer({ id: "lier", cibles: ["j1"] });
  p.tour = 2;
  p.commencerNuit();
  assert.deepEqual(p.decisionCourante()?.decision.choix, []);
});

test("Victoire des amoureux : majorité stricte, liés ou pas, quel que soit le camp", () => {
  const p = partieAvec(["loup", "villageois", "villageois", "villageois"]);
  lierAmoureux(p, "j0", "j1");
  assert.equal(verifierVictoire(p), undefined); // 2 contre 2 : pas encore

  donnerTag(p, p.joueur("j3"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(p), "Les amoureux"); // 2 contre 1
});

/* ---------- Loup hypnotiseur ---------- */

/** Hypnotiseur j0, Salvateur j1, villageois j2 à j4. */
function tableAvecHypnotiseur(): Partie {
  return partieAvec(["loup-hypnotiseur", "salvateur", "villageois", "villageois", "villageois"]);
}

test("Loup hypnotiseur : appelé après le Salvateur, chaque médaillon ne sert qu'une fois", () => {
  const p = tableAvecHypnotiseur();
  assert.deepEqual(p.file, ["conciliabule", "reunion-amoureux", "salvateur", "loup-hypnotiseur", "loup"]);

  p.jouer({ id: "proteger", cibles: ["j4"] });
  assert.deepEqual(p.decisionCourante()?.decision.choix.map(c => c.id), ["silence", "suggestion", "rien"]);
  p.jouer({ id: "silence", cibles: ["j2"] });
  assert.ok(p.aTag(p.joueur("j2"), "silence"));

  p.passer(); // loups
  p.leverLeJour();
  p.tour = 2;
  p.commencerNuit();
  p.jouer({ id: "proteger", cibles: ["j3"] });
  assert.deepEqual(p.decisionCourante()?.decision.choix.map(c => c.id), ["suggestion", "rien"]);
});

test("Loup hypnotiseur : le tag dure tout le vote du jour, puis disparaît à l'aube suivante", () => {
  const p = tableAvecHypnotiseur();
  p.jouer({ id: "proteger", cibles: ["j4"] });
  p.jouer({ id: "suggestion", cibles: ["j2"] });
  p.passer(); // loups
  p.leverLeJour();

  // Au vote : le meneur est prévenu, pas avant (le débat n'affiche rien).
  assert.deepEqual(p.rappelsDuVote(), ["Faire pointer J2 vers le même joueur que J0 : il est dirigé."]);

  p.tour = 2;
  p.commencerNuit();
  p.jouer({ id: "proteger", cibles: ["j3"] });
  p.jouer({ id: "rien", cibles: [] });
  p.passer(); // loups
  p.leverLeJour();
  assert.ok(!p.aTag(p.joueur("j2"), "dirige"));
  assert.deepEqual(p.rappelsDuVote(), []);
});

test("Loup hypnotiseur : silence et dirigé au vote ; un dirigé vote librement si l'hypnotiseur est mort", () => {
  const p = tableAvecHypnotiseur();
  donnerTag(p, p.joueur("j2"), "silence", { par: "j0" });
  donnerTag(p, p.joueur("j3"), "dirige", { par: "j0" });
  assert.deepEqual(p.rappelsDuVote(), [
    "Ne pas compter le vote de J2 : il est réduit au silence.",
    "Faire pointer J3 vers le même joueur que J0 : il est dirigé."
  ]);

  donnerTag(p, p.joueur("j0"), "mort", { cause: "vote" });
  assert.deepEqual(p.rappelsDuVote(), ["Ne pas compter le vote de J2 : il est réduit au silence."]);
});

test("Loup hypnotiseur : bloqué par le Salvateur, le médaillon est perdu, sans annonce", () => {
  const p = tableAvecHypnotiseur();
  p.jouer({ id: "proteger", cibles: ["j2"] });
  p.jouer({ id: "silence", cibles: ["j2"] });
  assert.ok(!p.aTag(p.joueur("j2"), "silence"));
  assert.equal(p.joueur("j0").memoire.silence, false);

  p.passer(); // loups
  p.leverLeJour();
  assert.deepEqual(p.infosPubliques(), []);
});

test("Loup amoureux : une cible protégée fait échouer le lien, sans seconde chance", () => {
  const p = partieAvec(["loup-amoureux", "salvateur", "villageois", "villageois"]);
  p.jouer({ id: "proteger", cibles: ["j2"] });
  p.jouer({ id: "lier", cibles: ["j2"] });
  assert.ok(!p.aTag(p.joueur("j0"), "amoureux") && !p.aTag(p.joueur("j2"), "amoureux"));
  assert.ok(!p.infos.some(i => i.pour === "j2"));

  p.tour = 2;
  p.commencerNuit();
  assert.ok(!p.file.includes("loup-amoureux"));
});

test("Loup voyante : la vision d'un joueur protégé échoue", () => {
  const p = partieAvec(["loup-voyante", "salvateur", "voyante", "villageois"]);
  p.jouer({ id: "sonder", cibles: ["j3"] });    // Voyante
  p.jouer({ id: "proteger", cibles: ["j2"] });  // Salvateur
  p.jouer({ id: "sonder", cibles: ["j2"] });    // Loup voyante
  assert.ok(p.infos.some(i => i.pour === "j0" && i.texte === "La vision échoue : la carte de J2 reste cachée."));
  assert.ok(!p.infos.some(i => i.pour === "j0" && i.texte.includes("est Voyante")));
});

/* ---------- Pleureuse et Conciliabule ---------- */

/** Pleureuse j0, Chasseur j1, Voyante j2, loup j3, villageois j4. */
function tableAvecPleureuse(): Partie {
  return partieAvec(["pleureuse", "chasseur", "voyante", "loup", "villageois"]);
}

/** Passe directement à la nuit n (on ne rejoue pas le jour). */
function allerALaNuit(p: Partie, n: number) {
  p.tour = n;
  p.commencerNuit();
}

test("Pleureuse : rien la nuit 1 ; nuit 2, Conciliabule sauté puis malédiction", () => {
  const p = tableAvecPleureuse();
  assert.ok(!p.file.includes("pleureuse"));

  allerALaNuit(p, 2);
  // Personne n'est maudit : le Conciliabule est sauté, la Pleureuse joue la première.
  assert.equal(p.decisionCourante()?.alias, "pleureuse");
  p.jouer({ id: "maudire", cibles: ["j2"] });
  assert.ok(p.aTag(p.joueur("j2"), "maudit"));

  // La Voyante maudite ne fait pas son rôle, dès cette nuit.
  const voyante = p.decisionCourante();
  assert.equal(voyante?.alias, "voyante");
  assert.deepEqual(voyante?.decision.choix, []);
});

test("Pleureuse : un maudit ne réagit plus (le Chasseur ne tire pas)", () => {
  const p = tableAvecPleureuse();
  donnerTag(p, p.joueur("j1"), "maudit");
  p.voter("j1");
  assert.equal(p.decisionCourante(), undefined);
});

test("Conciliabule : mauvais vote, puis bon vote sur la Pleureuse morte", () => {
  const p = tableAvecPleureuse();
  donnerTag(p, p.joueur("j2"), "maudit");
  donnerTag(p, p.joueur("j4"), "maudit");
  donnerTag(p, p.joueur("j0"), "mort", { cause: "vote" }); // la Pleureuse meurt

  allerALaNuit(p, 3);
  const conciliabule = p.decisionCourante();
  assert.equal(conciliabule?.alias, "conciliabule");
  assert.deepEqual(conciliabule?.porteurs.map(j => j.id), ["j2", "j4"]);
  assert.equal(conciliabule?.decision.minuteur, 60);
  // Les morts sont désignables.
  assert.ok(p.ciblesPossibles("n_importe_qui", conciliabule?.moi, conciliabule?.porteurs).some(j => j.id === "j0"));

  p.jouer({ id: "designer", cibles: ["j1"] }); // mauvais choix
  assert.ok(p.aTag(p.joueur("j2"), "maudit"));

  allerALaNuit(p, 4);
  p.jouer({ id: "designer", cibles: ["j0"] }); // la Pleureuse, morte
  assert.ok(!p.aTag(p.joueur("j2"), "maudit") && !p.aTag(p.joueur("j4"), "maudit"));
  assert.ok(p.aTag(p.joueur("j0"), "apaisee"));
});

test("Pleureuse démasquée : elle ne marque plus personne", () => {
  const p = tableAvecPleureuse();
  donnerTag(p, p.joueur("j0"), "apaisee");
  allerALaNuit(p, 2);
  assert.equal(p.decisionCourante()?.alias, "pleureuse");
  assert.deepEqual(p.decisionCourante()?.decision.choix, []);
});

test("Loup voyante : sonde comme la Voyante, avant les loups, et vote avec eux", () => {
  const p = partieAvec(["loup-voyante", "voyante", "villageois", "villageois"]);
  assert.deepEqual(p.file, ["conciliabule", "reunion-amoureux", "voyante", "loup-voyante", "loup"]); // 80, 107, 120
  assert.deepEqual(p.porteursDe("loup").map(j => j.id), ["j0"]);

  p.jouer({ id: "sonder", cibles: ["j0"] });  // Voyante
  p.jouer({ id: "sonder", cibles: ["j1"] });  // Loup voyante
  assert.ok(p.infos.some(i => i.pour === "j0" && i.texte === "J1 est Voyante."));
});

/* ---------- Fêtard ---------- */

test("Fêtard : il a voté contre le loup éliminé, les loups ne peuvent pas le mordre cette nuit", () => {
  const p = partieAvec(["loup", "loup", "fetard", "villageois", "villageois"]);
  p.voter("j0");

  const question = p.decisionCourante();
  assert.equal(question?.alias, "fetard");
  assert.equal(question?.urgente, true);
  p.jouer({ id: "feter", cibles: [] });
  assert.ok(p.aTag(p.joueur("j2"), "fete"));

  p.nuitSuivante();
  p.jouer({ id: "devorer", cibles: ["j2"] });
  assert.ok(p.journal.some(e => e.type === "bloque" && e.tag === "mordu" && e.joueur === "j2"));
  p.leverLeJour();
  assert.equal(p.joueur("j2").vivant, true);
  assert.ok(!p.aTag(p.joueur("j2"), "fete")); // la fête ne dure qu'une nuit
});

test("Fêtard : rien si l'éliminé n'est pas un loup, ou s'il n'a pas voté contre lui", () => {
  const p = partieAvec(["loup", "loup", "fetard", "villageois", "villageois"]);
  p.voter("j3");
  assert.equal(p.decisionCourante(), undefined);

  p.voter("j0");
  p.jouer({ id: "non", cibles: [] });
  assert.ok(!p.aTag(p.joueur("j2"), "fete"));
});

/* ---------- Stratège ---------- */

test("Stratège : rappel au vote, question après le vote, réponse la nuit suivante", () => {
  const p = partieAvec(["loup", "stratege", "villageois", "villageois", "villageois"]);
  assert.ok(p.rappelsDuVote().some(r => r.includes("J1 (stratège)")));

  p.voter("j3");
  const question = p.decisionCourante();
  assert.equal(question?.alias, "stratege");
  assert.equal(question?.urgente, true);
  p.jouer({ id: "oui", cibles: [] });

  p.nuitSuivante(); // nuit 2 : le Stratège (85) joue avant les loups (120)
  const nuit = p.decisionCourante();
  assert.equal(nuit?.alias, "stratege");
  assert.match(nuit?.decision.message ?? "", /OUI/);
});

test("Stratège : questionné même si personne n'est éliminé ; pas appelé la nuit 1", () => {
  const p = partieAvec(["loup", "loup", "stratege", "villageois", "villageois"]);
  assert.ok(!p.file.includes("stratege"));
  p.voter(null);
  assert.equal(p.decisionCourante()?.alias, "stratege");
  p.jouer({ id: "non", cibles: [] });
  assert.equal(p.joueur("j2").memoire.loupAvecLui, false);
});

/* ---------- Skinwalker ---------- */

/** Joue la nuit en cours jusqu'à la carte demandée, en passant les autres. */
function jouerJusqua(p: Partie, alias: string) {
  while (p.decisionCourante() && p.decisionCourante()?.alias !== alias) p.passer();
}

test("Skinwalker : nuit 3, il tue, prend la carte, la joue, et la Voyante la voit", () => {
  const p = partieAvec(["loup", "skinwalker", "sorciere", "voyante", "villageois", "villageois", "villageois"]);
  assert.ok(!p.file.includes("skinwalker"));

  allerALaNuit(p, 3);
  jouerJusqua(p, "skinwalker");
  p.jouer({ id: "tuer", cibles: ["j2"] });
  assert.equal(p.joueur("j2").vivant, false);
  assert.equal(p.carteImitee(p.joueur("j1")), "sorciere");
  // La Sorcière (130) joue après lui : c'est lui qui la joue, potions neuves.
  assert.equal(p.decisionCourante()?.porteurs[0].id, "j1");
  assert.equal(p.joueur("j1").memoire.potionMort, true);

  allerALaNuit(p, 4);
  jouerJusqua(p, "voyante");
  p.jouer({ id: "sonder", cibles: ["j1"] });
  assert.ok(p.infos.some(i => i.texte === "J1 est Sorcière."));
});

test("Skinwalker : victime protégée par le Salvateur, rien cette nuit ni la suivante", () => {
  const p = partieAvec(["loup", "skinwalker", "salvateur", "villageois", "villageois", "villageois"]);
  allerALaNuit(p, 3);
  jouerJusqua(p, "salvateur");
  p.jouer({ id: "proteger", cibles: ["j3"] });
  jouerJusqua(p, "skinwalker");
  p.jouer({ id: "tuer", cibles: ["j3"] });
  assert.equal(p.joueur("j3").vivant, true);

  allerALaNuit(p, 4);
  jouerJusqua(p, "skinwalker");
  assert.deepEqual(p.decisionCourante()?.decision.choix, []);
});

test("Skinwalker : vivant, il vole la victoire du village", () => {
  const p = partieAvec(["loup", "skinwalker", "villageois"]);
  donnerTag(p, p.joueur("j0"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(p), "Le skinwalker");
  donnerTag(p, p.joueur("j1"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(p), "Le village");
});

/* ---------- Événements : tirage, remplacement, validation, minuteur ---------- */

/** Une partie au jour 1, maire élu (j1), prête pour l'événement. */
function jourAvecMaire(): Partie {
  const p = partieAvec(["loup", "villageois", "villageois", "villageois", "villageois"]);
  p.passer(); // loups
  p.leverLeJour();
  p.suiteDeLAube();
  assert.equal(p.phase, "election");
  p.elire("j1");
  assert.equal(p.phase, "evenement");
  return p;
}

test("Événement : aucun effet au tirage ; « Un autre » ne laisse rien derrière lui", () => {
  const p = jourAvecMaire();
  p.ouvrirEvenement("benediction");
  assert.deepEqual(p.joueursAvecTag("protege"), []); // tirée, pas encore appliquée

  p.autreEvenement();
  assert.notEqual(p.evenement?.alias, "benediction");
  assert.deepEqual(p.joueursAvecTag("protege"), []);
});

test("Événement : « Passer » force Soleil, et le débat attend la validation", () => {
  const p = jourAvecMaire();
  p.passerEvenement();
  assert.equal(p.evenement?.alias, "soleil");
  assert.throws(() => p.ouvrirDebat(), /Validez d'abord/);

  p.appliquerEvenement();
  assert.throws(() => p.autreEvenement(), /déjà eu lieu/);
  p.ouvrirDebat();
  assert.equal(p.phase, "debat");
});

test("Événement : la Rumeur n'est révélée qu'à la validation", () => {
  const p = jourAvecMaire();
  p.ouvrirEvenement("rumeur");
  assert.deepEqual(p.infosPubliques(["evenement"]), []);
  p.appliquerEvenement();
  assert.equal(p.infosPubliques(["evenement"]).length, 1);
});

test("Sablier : 8 min, le temps restant devient le débat du lendemain, sans autre événement", () => {
  const p = jourAvecMaire();
  p.ouvrirEvenement("sablier");
  assert.equal(p.dureeDuDebat(5), 8);
  p.appliquerEvenement();
  p.ouvrirDebat();
  p.ouvrirVote(125); // 2 min 05 restantes
  p.voter("j2");     // élimine un villageois (le loup j0 reste : la partie continue)
  p.nuitSuivante();
  p.passer();        // loups
  p.leverLeJour();
  p.suiteDeLAube();

  assert.equal(p.evenement?.alias, "sablier-suite");
  assert.equal(Math.round(p.dureeDuDebat(5)! * 60), 125);
  assert.throws(() => p.autreEvenement(), /ni remplacé ni passé/);
  assert.throws(() => p.passerEvenement(), /ni remplacé ni passé/);
});

test("Sablier : le second débat d'une plaidoirie ne change pas le report", () => {
  const p = jourAvecMaire();
  donnerTag(p, p.joueur("j2"), "or");
  p.ouvrirEvenement("sablier");
  p.appliquerEvenement();
  p.ouvrirDebat();
  p.ouvrirVote(300);
  p.voter("j2");          // il paie : nouveau débat
  assert.equal(p.phase, "debat");
  p.ouvrirVote(10);
  assert.equal(p.reportDuSablier, 300);
});

test("Soleil : le débat garde la durée réglée par le meneur", () => {
  const p = jourAvecMaire();
  p.passerEvenement();
  assert.equal(p.dureeDuDebat(5), 5); // Soleil : le réglage du meneur
});

/* ---------- Les événements un par un ---------- */

/** Jour 1 avec un maire, puis l'événement demandé, désigné sur cible si fourni. */
function jourAvecEvenement(roles: string[], alias: string, cible?: string): Partie {
  const p = partieAvec(roles);
  while (p.decisionCourante()) p.passer(); // toute la nuit 1
  p.leverLeJour();
  p.suiteDeLAube();
  p.elire("j1");
  p.ouvrirEvenement(alias);
  if (cible) p.jouer({ id: "designer", cibles: [cible] });
  else p.appliquerEvenement();
  return p;
}

const SIMPLE = ["loup", "villageois", "villageois", "villageois", "villageois"];

test("Événement avec choix : le maire désigne, mais jamais lui-même", () => {
  const p = partieAvec(SIMPLE);
  while (p.decisionCourante()) p.passer();
  p.leverLeJour();
  p.suiteDeLAube();
  p.elire("j1");
  p.ouvrirEvenement("sauf-conduit");

  const courante = p.decisionCourante();
  assert.equal(courante?.evenement, true);
  assert.equal(courante?.titre, "Sauf-conduit");
  assert.equal(courante?.moi?.id, "j1");
  const cibles = p.ciblesPossibles("un_autre", courante?.moi, courante?.porteurs).map(j => j.id);
  assert.ok(!cibles.includes("j1"));

  // « Passer » sur la décision d'un événement : Soleil.
  p.passer();
  assert.equal(p.evenement?.alias, "soleil");
});

test("Sauf-conduit : refusé au vote, même pour le second vote d'une plaidoirie", () => {
  const p = jourAvecEvenement(SIMPLE, "sauf-conduit", "j2");
  p.ouvrirDebat();
  p.ouvrirVote();
  assert.ok(p.rappelsDuVote().some(r => r.includes("J2 a un sauf-conduit")));
  assert.throws(() => p.voter("j2"), /sauf-conduit/);
  assert.equal(p.phase, "vote"); // rien n'a changé, le meneur peut recliquer
  p.voter("j3");
  assert.equal(p.joueur("j3").vivant, false);
});

test("Soupçon : rappel au vote, avec le nom du maire", () => {
  const p = jourAvecEvenement(SIMPLE, "soupcon", "j2");
  assert.ok(p.rappelsDuVote().includes("J2 part avec 2 voix contre lui ; le maire (J1) ne vote pas."));
});

test("Bénédiction : protégé comme par le Salvateur, même s'il l'avait été la veille", () => {
  const p = partieAvec(["loup", "villageois", "villageois", "salvateur", "villageois"]);
  // Nuit 1 : le Salvateur protège j2.
  while (p.decisionCourante()?.alias !== "salvateur") p.passer();
  p.jouer({ id: "proteger", cibles: ["j2"] });
  while (p.decisionCourante()) p.passer();
  p.leverLeJour();
  assert.ok(p.aTag(p.joueur("j2"), "protege_hier"));

  p.suiteDeLAube();
  p.elire("j1");
  p.ouvrirEvenement("benediction");
  p.jouer({ id: "designer", cibles: ["j2"] });
  assert.ok(p.aTagDe(p.joueur("j2"), "protege", "salvateur"));
  assert.ok(!p.aTag(p.joueur("j2"), "protege_hier"));

  // La nuit suivante, les loups ne peuvent pas le dévorer.
  p.ouvrirDebat();
  p.ouvrirVote();
  p.voter(null);
  p.nuitSuivante();
  while (p.decisionCourante()?.alias !== "loup") p.passer();
  p.jouer({ id: "devorer", cibles: ["j2"] });
  while (p.decisionCourante()) p.passer();
  p.leverLeJour();
  assert.equal(p.joueur("j2").vivant, true);
  assert.ok(p.aTag(p.joueur("j2"), "protege_hier")); // comme après une vraie protection
});

test("Passation : un seul maire", () => {
  const p = jourAvecEvenement(SIMPLE, "passation", "j3");
  assert.deepEqual(p.joueursAvecTag("maire").map(j => j.id), ["j3"]);
});

test("Contagion : la personne désignée meurt à la 3e aube", () => {
  const p = jourAvecEvenement(SIMPLE, "contagion", "j2");
  aube(p);
  aube(p);
  assert.equal(p.joueur("j2").vivant, true);
  aube(p);
  assert.equal(p.joueur("j2").vivant, false);
  assert.ok(p.morts(0).some(m => m.joueur.id === "j2" && m.cause === "peste"));
});

test("Clair de lune : la Voyante et le Loup voyante ne voient que le joueur éclairé", () => {
  const p = jourAvecEvenement(["loup-voyante", "villageois", "voyante", "villageois", "villageois"], "clair-de-lune", "j3");
  p.ouvrirDebat();
  p.ouvrirVote();
  p.voter(null);
  p.nuitSuivante();

  while (p.decisionCourante()?.alias !== "voyante") p.passer();
  assert.deepEqual(p.decisionCourante()?.decision.choix.map(c => c.id), ["sonder-eclaire"]);
  p.jouer({ id: "sonder-eclaire", cibles: [] });
  assert.ok(p.infos.some(i => i.pour === "j2" && i.texte === "J3 est Villageois."));

  assert.equal(p.decisionCourante()?.alias, "loup-voyante");
  p.jouer({ id: "sonder-eclaire", cibles: [] });
  assert.ok(p.infos.some(i => i.pour === "j0" && i.texte === "J3 est Villageois."));
});

test("Marché noir : la Sorcière retrouve ses potions, le tag ne traîne chez personne", () => {
  const p = partieAvec(["loup", "villageois", "sorciere", "villageois", "villageois"]);
  p.joueur("j2").memoire.potionVie = false;
  p.joueur("j2").memoire.potionMort = false;
  while (p.decisionCourante()) p.passer();
  p.leverLeJour();
  p.suiteDeLAube();
  p.elire("j1");
  p.ouvrirEvenement("marche-noir");
  p.appliquerEvenement();

  assert.equal(p.joueur("j2").memoire.potionVie, true);
  assert.equal(p.joueur("j2").memoire.potionMort, true);
  assert.deepEqual(p.joueursAvecTag("recharge"), []);
});

test("Urgence et Trêve : 2 minutes, puis pas de minuteur", () => {
  assert.equal(jourAvecEvenement(SIMPLE, "urgence").dureeDuDebat(5), 2);
  assert.equal(jourAvecEvenement(SIMPLE, "treve").dureeDuDebat(5), null);
});

test("Animations : aucun effet, la validation suffit", () => {
  for (const alias of ["baillon", "tenebres", "carnaval", "baton-de-parole", "murmures", "bouche-cousue"]) {
    const p = jourAvecEvenement(SIMPLE, alias);
    assert.equal(p.evenementApplique, true, alias);
    assert.equal(p.dureeDuDebat(5), 5, alias);
  }
});

/* ---------- Ancien éliminé par le village ---------- */

test("Ancien voté : seuls les loups gardent leurs pouvoirs, jusqu'à la fin de la partie", () => {
  const p = partieAvec(["loup", "ancien", "voyante", "chasseur", "villageois", "fou"]);
  p.voter("j1");
  assert.deepEqual(p.joueursAvecTag("impuissant").map(j => j.id), ["j2", "j3", "j4", "j5"]);
  assert.ok(!p.aTag(p.joueur("j0"), "impuissant"));

  // Le Chasseur, éliminé ensuite, ne tire pas.
  p.voter("j3");
  assert.equal(p.decisionCourante(), undefined);

  // Nuit suivante : la Voyante ne peut que passer, les loups dévorent normalement.
  p.nuitSuivante();
  assert.equal(p.decisionCourante()?.alias, "voyante");
  assert.deepEqual(p.decisionCourante()?.decision.choix, []);
  p.passer();
  assert.deepEqual(p.decisionCourante()?.decision.choix.map(c => c.id), ["devorer"]);

  // Le tag ne s'en va pas à l'aube.
  p.passer();
  p.leverLeJour();
  assert.ok(p.aTag(p.joueur("j2"), "impuissant"));
});

test("Ancien tué autrement que par le vote : personne ne perd ses pouvoirs", () => {
  const p = partieAvec(["loup", "ancien", "voyante", "villageois"]);
  donnerTag(p, p.joueur("j1"), "mort", { cause: "poison" });
  assert.equal(p.joueur("j1").vivant, false);
  assert.deepEqual(p.joueursAvecTag("impuissant"), []);
});

/* ---------- Ultimatum et Coup double ---------- */

/** Deux loups (j0, j2), maire j1 ; l'événement est validé et le vote ouvert. */
function voteAvecEvenement(alias: string): Partie {
  const p = jourAvecEvenement(["loup", "villageois", "loup", "villageois", "villageois", "villageois"], alias);
  p.ouvrirDebat();
  p.ouvrirVote();
  return p;
}

test("Ultimatum : un villageois éliminé, le maire meurt ; un loup éliminé, il vit", () => {
  const p = voteAvecEvenement("ultimatum");
  assert.ok(p.rappelsDuVote()[0].startsWith("Ultimatum"));
  p.voter("j3");
  assert.deepEqual(p.morts().map(m => [m.joueur.id, m.cause]), [["j3", "vote"], ["j1", "ultimatum"]]);
  assert.ok(p.infosPubliques(["resultat_vote"])[0].includes("J1, le maire"));

  const q = voteAvecEvenement("ultimatum");
  q.voter("j0");
  assert.equal(q.joueur("j1").vivant, true);
});

test("Ultimatum : personne n'est éliminé, le maire meurt aussi", () => {
  const p = voteAvecEvenement("ultimatum");
  p.voter(null);
  assert.equal(p.joueur("j1").vivant, false);
});

test("Ultimatum : le vote racheté par l'or ne compte pas, seul le second vote décide", () => {
  const p = voteAvecEvenement("ultimatum");
  donnerTag(p, p.joueur("j3"), "or");
  p.voter("j3");                 // il paie : plaidoirie
  assert.equal(p.joueur("j1").vivant, true);
  p.ouvrirVote();
  p.voter("j2");                 // un loup
  assert.equal(p.joueur("j1").vivant, true);
});

test("Coup double : un loup éliminé ouvre UN second vote", () => {
  const p = voteAvecEvenement("coup-double");
  p.voter("j3");                 // un villageois : rien
  assert.equal(p.peutRevoter, false);

  const q = voteAvecEvenement("coup-double");
  q.voter("j0");                 // un loup
  assert.equal(q.peutRevoter, true);
  q.revoter();
  assert.equal(q.phase, "vote");
  q.voter("j2");                 // encore un loup : pas de troisième vote
  assert.equal(q.peutRevoter, false);
  assert.throws(() => q.revoter(), /Aucun second vote/);
});

/* ---------- Aberration ---------- */

test("Aberration : elle horrifie, et des loups tous horrifiés ne mangent plus", () => {
  const p = partieAvec(["aberration", "loup", "villageois", "villageois"]);
  assert.equal(p.decisionCourante()?.alias, "aberration");
  p.jouer({ id: "horrifier", cibles: ["j1"] });
  assert.ok(p.aTag(p.joueur("j1"), "horrifie"));

  assert.equal(p.decisionCourante()?.alias, "loup");
  assert.deepEqual(p.decisionCourante()?.decision.choix, []);
});

test("Aberration : villageois tous horrifiés, le village ne peut pas voter", () => {
  const p = partieAvec(["aberration", "loup", "villageois", "villageois"]);
  donnerTag(p, p.joueur("j2"), "horrifie");
  assert.equal(p.voteImpossible(), undefined); // j3 n'est pas horrifié
  donnerTag(p, p.joueur("j3"), "horrifie");

  assert.ok(p.rappelsDuVote().some(r => r.includes("ne peut pas voter")));
  assert.throws(() => p.voter("j1"), /ne peut pas voter/);
  p.voter(null); // « Personne n'est éliminé » reste possible
  assert.equal(p.phase, "resultat_vote");
});

test("Aberration : la Voyante qui voit sa carte devient catatonique, puis meurt à l'aube", () => {
  const p = partieAvec(["aberration", "loup", "voyante", "villageois", "villageois"]);
  p.passer(); // Aberration
  p.jouer({ id: "sonder", cibles: ["j0"] });
  assert.ok(p.aTag(p.joueur("j2"), "catatonique"));
  assert.ok(!p.infos.some(i => i.pour === "j2"));

  // Catatonique : elle ne réagit plus à rien cette nuit (tag bloquant).
  p.mettreEnAttente("voyante", p.joueur("j2"));
  assert.deepEqual(p.attente, []);

  p.passer(); // loups
  p.leverLeJour();
  assert.deepEqual(p.morts().map(m => [m.joueur.id, m.cause]), [["j2", "horreur"]]);
});

test("Aberration morte : plus personne n'est horrifié", () => {
  const p = partieAvec(["aberration", "loup", "villageois", "villageois"]);
  donnerTag(p, p.joueur("j1"), "horrifie");
  donnerTag(p, p.joueur("j2"), "horrifie");
  donnerTag(p, p.joueur("j0"), "mort", { cause: "vote" });
  assert.deepEqual(p.joueurs.filter(j => p.aTag(j, "horrifie")), []);
});

test("Aberration : protégée par le Salvateur, la vision du Loup voyante échoue sans le tuer", () => {
  const p = partieAvec(["aberration", "loup-voyante", "salvateur", "villageois"]);
  p.passer(); // Aberration
  p.jouer({ id: "proteger", cibles: ["j0"] });
  p.jouer({ id: "sonder", cibles: ["j0"] });
  assert.equal(p.joueur("j1").vivant, true);
});

test("Aberration : vivante, personne d'autre ne gagne ; tous horrifiés, elle gagne", () => {
  const p = partieAvec(["aberration", "loup", "loup", "villageois"]);
  assert.equal(verifierVictoire(p), undefined); // 2 loups contre 1 : les loups auraient gagné

  for (const id of ["j1", "j2", "j3"]) donnerTag(p, p.joueur(id), "horrifie");
  assert.equal(verifierVictoire(p), "L'aberration");

  // Morte, les règles habituelles reprennent.
  donnerTag(p, p.joueur("j0"), "mort", { cause: "vote" });
  assert.equal(verifierVictoire(p), "Les loups-garous");
});

/* ---------- Loup-démon ---------- */

test("Loup-démon : brûlé au vote, il possède un villageois qui devient Loup-Garou", () => {
  const p = partieAvec(["loup-demon", "loup", "villageois", "voyante", "fou"], { aleatoire: () => 0 });
  p.voter("j0");
  // Seuls les villageois (camp village) peuvent être possédés : ni le loup, ni le Fou.
  const possedes = p.joueurs.filter(j => p.aTag(j, "possede"));
  assert.deepEqual(possedes.map(j => j.id), ["j2"]);
  assert.equal(p.joueur("j2").role, "loup");
  assert.ok(p.porteursDe("loup").some(j => j.id === "j2"));
  assert.ok(p.infos.some(i => i.pour === "j2" && i.texte.includes("possédé")));
});

test("Loup-démon : tué autrement que par le vote, personne n'est possédé", () => {
  const p = partieAvec(["loup-demon", "loup", "villageois", "voyante"]);
  donnerTag(p, p.joueur("j0"), "mort", { cause: "poison" });
  assert.equal(p.joueur("j0").vivant, false);
  assert.deepEqual(p.joueurs.filter(j => p.aTag(j, "possede")), []);
  assert.equal(p.joueur("j2").role, "villageois");
});

test("Loup-démon : rachète son vote avec l'or, personne n'est possédé", () => {
  const p = partieAvec(["loup-demon", "loup", "villageois", "voyante"]);
  donnerTag(p, p.joueur("j0"), "or");
  p.voter("j0");
  assert.equal(p.phase, "debat");
  assert.deepEqual(p.joueurs.filter(j => p.aTag(j, "possede")), []);
});

/* ---------- Loup barbare ---------- */

test("Loup barbare : il ne se réveille pas avec la meute, et reste caché sans erreur du village", () => {
  const p = partieAvec(["loup", "loup-barbare", "villageois", "villageois", "villageois"]);
  assert.deepEqual(p.porteursDe("loup").map(j => j.id), ["j0"]);
  assert.deepEqual(p.file.filter(a => a === "loup" || a === "loup-barbare"), ["loup", "loup-barbare"]);
  p.passer(); // loups
  assert.equal(p.decisionCourante()?.alias, "loup-barbare");
  assert.deepEqual(p.decisionCourante()?.decision.choix, []);
});

test("Loup barbare : le village élimine un innocent, il mord la nuit suivante, une seule fois", () => {
  // 6 villageois : la partie ne doit pas finir avant la 3e nuit.
  const p = partieAvec(["loup", "loup-barbare", "villageois", "villageois", "villageois", "villageois", "villageois", "villageois"]);
  p.voter("j2"); // un villageois
  p.nuitSuivante();
  p.jouer({ id: "devorer", cibles: ["j3"] }); // la meute
  assert.equal(p.decisionCourante()?.alias, "loup-barbare");
  p.jouer({ id: "mordre", cibles: ["j4"] });
  p.leverLeJour();
  assert.deepEqual(p.morts().map(m => m.joueur.id).sort(), ["j3", "j4"]);

  // La nuit d'après, sans nouvelle erreur du village : plus de morsure.
  p.voter(null);
  p.nuitSuivante();
  p.passer(); // loups
  assert.deepEqual(p.decisionCourante()?.decision.choix, []);
});

test("Loup barbare : un loup éliminé par le village ne lui donne rien", () => {
  const p = partieAvec(["loup", "loup", "loup-barbare", "villageois", "villageois", "villageois"]);
  p.voter("j0");
  p.nuitSuivante();
  p.passer(); // loups
  assert.equal(p.decisionCourante()?.alias, "loup-barbare");
  assert.deepEqual(p.decisionCourante()?.decision.choix, []);
});

/* ---------- Loup salamandre ---------- */

test("Loup salamandre : l'ignifuge ressort indemne des flammes, et le village apprend qu'un loup l'a protégé", () => {
  const p = partieAvec(["loup-salamandre", "villageois", "villageois", "villageois", "villageois"]);
  p.jouer({ id: "ignifuger", cibles: ["j2"] });
  p.passer(); // loups
  p.leverLeJour();
  assert.ok(p.aTag(p.joueur("j2"), "ignifuge")); // a survécu à l'aube

  p.voter("j2");
  assert.equal(p.joueur("j2").vivant, true);
  assert.equal(p.phase, "resultat_vote");
  assert.ok(p.infosPubliques(["resultat_vote"])[0].includes("J2 entre dans les flammes et en ressort indemne"));
});

test("Loup salamandre : l'or se rachète d'abord ; la salamandre n'agit qu'au vote final", () => {
  const p = partieAvec(["loup-salamandre", "villageois", "villageois", "villageois", "villageois"]);
  donnerTag(p, p.joueur("j2"), "ignifuge");
  donnerTag(p, p.joueur("j2"), "or");

  p.voter("j2");                          // premier vote : il paie avec son or
  assert.equal(p.phase, "debat");
  assert.ok(!p.aTag(p.joueur("j2"), "or"));

  p.ouvrirVote();
  p.voter("j2");                          // vote final : les flammes ne le tuent pas
  assert.equal(p.joueur("j2").vivant, true);
  assert.equal(p.phase, "resultat_vote");
});

test("Loup salamandre : jamais le même deux nuits de suite, et la protection s'arrête à l'aube suivante", () => {
  const p = partieAvec(["loup-salamandre", "villageois", "villageois", "villageois", "villageois"]);
  p.jouer({ id: "ignifuger", cibles: ["j2"] });
  p.passer(); // loups
  p.leverLeJour();
  p.voter(null);
  p.nuitSuivante();

  assert.ok(p.decisionCourante()?.decision.message?.includes("impossible : J2"));
  p.jouer({ id: "ignifuger", cibles: ["j2"] }); // refusé : rien n'est donné
  p.passer(); // loups
  p.leverLeJour();
  assert.ok(!p.aTag(p.joueur("j2"), "ignifuge"));
});

test("Loup salamandre : un vote bloqué compte comme « personne n'est éliminé » pour l'Ultimatum", () => {
  const p = jourAvecEvenement(["loup", "villageois", "villageois", "villageois", "villageois"], "ultimatum");
  donnerTag(p, p.joueur("j2"), "ignifuge");
  p.ouvrirDebat();
  p.ouvrirVote();
  p.voter("j2");
  assert.equal(p.joueur("j2").vivant, true);
  assert.equal(p.joueur("j1").vivant, false); // le maire paie l'ultimatum
});

/* ---------- Beau Parleur ---------- */

test("Beau Parleur : devenir Faux Parleur change sa carte, et il se réveille avec la meute dès la nuit 1", () => {
  const p = partieAvec(["beau-parleur", "loup", "villageois", "villageois"]);
  assert.equal(p.decisionCourante()?.alias, "beau-parleur");
  p.jouer({ id: "devenir", cibles: [] });
  assert.equal(p.joueur("j0").role, "faux-parleur");
  assert.equal(p.roleDe(p.joueur("j0")).camp, "loups");
  assert.equal(p.decisionCourante()?.alias, "loup");
  assert.deepEqual(p.decisionCourante()?.porteurs.map(j => j.id), ["j0", "j1"]);
});

test("Beau Parleur : deux vies face aux loups, une seule face au poison", () => {
  const p = partieAvec(["beau-parleur", "loup", "villageois", "villageois"]);
  donnerTag(p, p.joueur("j0"), "mort", { cause: "mordu" });
  assert.equal(p.joueur("j0").vivant, true);
  donnerTag(p, p.joueur("j0"), "mort", { cause: "mordu" });
  assert.equal(p.joueur("j0").vivant, false);

  const q = partieAvec(["beau-parleur", "loup", "villageois", "villageois"]);
  donnerTag(q, q.joueur("j0"), "mort", { cause: "poison" });
  assert.equal(q.joueur("j0").vivant, false);
});

test("Beau Parleur maire : il voit la carte de l'accusé, et relance le vote une seule fois", () => {
  const p = partieAvec(["beau-parleur", "loup", "voyante", "villageois", "villageois"]);
  donnerTag(p, p.joueur("j0"), "maire");

  p.voter("j2");                                   // suspendu : la voyante est encore en vie
  assert.equal(p.joueur("j2").vivant, true);
  const regard = p.decisionCourante();
  assert.ok(regard?.urgente && regard.decision.message?.includes("Voyante"));
  p.jouer({ id: "relancer", cibles: [] });
  assert.equal(p.phase, "vote");
  assert.equal(p.joueur("j2").vivant, true);

  p.voter("j2");                                   // second vote : il regarde, mais ne peut plus relancer
  assert.deepEqual(p.decisionCourante()?.decision.choix.map(c => c.id), ["executer"]);
  p.jouer({ id: "executer", cibles: [] });
  assert.equal(p.joueur("j2").vivant, false);
  assert.equal(p.phase, "resultat_vote");
});

test("Beau Parleur : pas maire, ou privé de pouvoir, le vote tue tout de suite", () => {
  const p = partieAvec(["beau-parleur", "loup", "villageois", "villageois", "villageois"]);
  p.voter("j2");
  assert.equal(p.joueur("j2").vivant, false);

  const q = partieAvec(["beau-parleur", "loup", "villageois", "villageois", "villageois"]);
  donnerTag(q, q.joueur("j0"), "maire");
  donnerTag(q, q.joueur("j0"), "impuissant");
  q.voter("j2");
  assert.equal(q.joueur("j2").vivant, false);
  assert.equal(q.decisionCourante(), undefined);
});
