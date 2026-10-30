import type { Role } from "../types";
import ancien from "./ancien";
import chasseur from "./chasseur";
import cupidon from "./cupidon";
import loup from "./loup";
import loupSuccube from "./loup-succube";
import rat from "./rat";
import ratGarou from "./rat-garou";
import salvateur from "./salvateur";
import sorciere from "./sorciere";
import villageois from "./villageois";
import voyante from "./voyante";

/**
 * Registre des rôles. Ajouter un rôle :
 *   1. créer roles/<alias>.ts
 *   2. l'ajouter dans cette liste
 * Il apparaît alors automatiquement dans les options et la distribution.
 */
export const LISTE_ROLES: Role[] = [
  loup,
  villageois,
  voyante,
  sorciere,
  salvateur,
  cupidon,
  loupSuccube,
  chasseur,
  ancien,
  rat,
  ratGarou
];

export const ROLES: Record<string, Role> = Object.fromEntries(LISTE_ROLES.map(r => [r.alias, r]));
