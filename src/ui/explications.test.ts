import assert from "node:assert/strict";
import { test } from "node:test";
import { EVENEMENTS } from "../moteur/evenements";
import { LISTE_ROLES, ROLES } from "../moteur/roles";
import { CAS_PARTICULIERS } from "./casParticuliers";
import { TAGS } from "./libelles";

// POURQUOI ces tests : la page Explications lit ces données sans les vérifier. Une carte ajoutée
// sans explication, ou un cas qui cite une carte renommée, se verrait seulement à l'écran.

test("Explications : chaque carte et chaque événement a une explication détaillée", () => {
  for (const role of LISTE_ROLES) assert.ok(role.explication?.length, `${role.alias} sans explication`);
  for (const evenement of Object.values(EVENEMENTS)) assert.ok(evenement.explication?.length, `${evenement.alias} sans explication`);
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
