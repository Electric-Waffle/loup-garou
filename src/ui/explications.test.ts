import assert from "node:assert/strict";
import { test } from "node:test";
import { EVENEMENTS } from "../moteur/evenements";
import { LISTE_RELIQUES, RELIQUE_PAR_DEFAUT, RELIQUES } from "../moteur/reliques";
import { LISTE_ROLES, ROLES } from "../moteur/roles";
import { CAS_PARTICULIERS } from "./casParticuliers";
import { FINS_DU_JEU } from "./finsDuJeu";
import { TAGS } from "./libelles";

// POURQUOI ces tests : la page Explications lit ces données sans les vérifier. Une carte ajoutée
// sans explication, ou un cas qui cite une carte renommée, se verrait seulement à l'écran.

test("Explications : chaque carte et chaque événement a une explication détaillée", () => {
  for (const role of LISTE_ROLES) assert.ok(role.explication?.length, `${role.alias} sans explication`);
  for (const evenement of Object.values(EVENEMENTS)) assert.ok(evenement.explication?.length, `${evenement.alias} sans explication`);
});

// Le Loup-Garou et le Villageois n'en ont pas : choix assumé, ce sont des cartes qu'on ne met presque jamais en jeu.
const SANS_CONSEIL = ["loup", "villageois"];

test("Reliques : chacune a une explication, et la Pyramide de Chichén Itzá est le défaut", () => {
  for (const relique of LISTE_RELIQUES) assert.ok(relique.explication?.length, `${relique.alias} sans explication`);
  assert.ok(RELIQUES[RELIQUE_PAR_DEFAUT], "la relique par défaut doit exister");
  assert.equal(new Set(LISTE_RELIQUES.map(r => r.alias)).size, LISTE_RELIQUES.length, "alias en double");
});

test("Conseils : chaque carte en a un, sauf le Loup-Garou et le Villageois", () => {
  for (const role of LISTE_ROLES) {
    if (SANS_CONSEIL.includes(role.alias)) continue;
    assert.ok(role.conseil?.length, `${role.alias} sans conseil`);
  }
});

test("Fin du jeu : chaque fin a des conseils, et ses cartes existent", () => {
  for (const fin of FINS_DU_JEU) {
    if (fin.carte) assert.ok(ROLES[fin.carte], `${fin.titre} : carte ${fin.carte} inconnue`);
    const conseils = fin.conseilDeLaCarte ? ROLES[fin.conseilDeLaCarte]?.conseil : fin.conseils;
    assert.ok(conseils?.length, `${fin.titre} sans conseil`);
  }
});

test("Cas particuliers : cartes et tags connus, au plus 4 cas par carte", () => {
  const nombreDeCas: Record<string, number> = {};
  for (const cas of CAS_PARTICULIERS) {
    for (const alias of [...cas.roles, ...cas.table.map(s => s.role)]) assert.ok(ROLES[alias], `${cas.titre} : carte ${alias} inconnue`);
    for (const tag of cas.table.flatMap(s => s.tags ?? [])) assert.ok(TAGS[tag], `${cas.titre} : tag ${tag} sans libellé`);
    for (const alias of cas.roles) nombreDeCas[alias] = (nombreDeCas[alias] ?? 0) + 1;
  }
  for (const [alias, nombre] of Object.entries(nombreDeCas)) assert.ok(nombre <= 4, `${alias} : ${nombre} cas`);
});
