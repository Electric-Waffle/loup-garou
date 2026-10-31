import assert from "node:assert/strict";
import { test } from "node:test";
import { aube } from "./aube";
import { composer } from "./distribution";
import { Partie } from "./partie";
import { donnerTag } from "./recevoir";
import { ROLES } from "./roles";
import { nuitDeux, nuitUn, TABLE } from "./scenario";
import { peutAgir } from "./tours";
import { verifierVictoire } from "./victoire";

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

test("Cupidon et Loup succube : appelés les nuits 1 et 3 seulement", () => {
  const nuits = [1, 2, 3, 4, 5, 6, 7];
  assert.deepEqual(nuits.filter(tour => peutAgir(ROLES.cupidon, tour)), [1, 3]);
  assert.deepEqual(nuits.filter(tour => peutAgir(ROLES["loup-succube"], tour)), [1, 3]);
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

test("Maire : élu s'il n'y en a pas, puis plus d'élection", () => {
  const p = nuitUn(); // tour 2, nuit en cours ; on rejoue un jour complet
  p.jouer({ id: "sonder", cibles: ["chloe"] });
  p.jouer({ id: "proteger", cibles: ["alice"] });
  p.jouer({ id: "devorer", cibles: ["david"] });
  p.jouer({ id: "rien", cibles: [] });
  p.leverLeJour();
  p.ouvrirEvenement("calme");

  p.suiteDeLEvenement();
  assert.equal(p.phase, "election");
  p.elire("jules");
  assert.equal(p.phase, "debat");
  assert.ok(p.aTag(p.joueur("jules"), "maire"));
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
