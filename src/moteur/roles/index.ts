import type { Role } from "../types";
import ancien from "./ancien";
import arlequin from "./arlequin";
import batisseur from "./batisseur";
import chasseur from "./chasseur";
import cupidon from "./cupidon";
import fee from "./fee";
import fou from "./fou";
import loup from "./loup";
import loupAmoureux from "./loup-amoureux";
import loupHypnotiseur from "./loup-hypnotiseur";
import loupSavant from "./loup-savant";
import loupSuccube from "./loup-succube";
import loupVampire from "./loup-vampire";
import marchand from "./marchand";
import paysan from "./paysan";
import pretre from "./pretre";
import rat from "./rat";
import ratGarou from "./rat-garou";
import salvateur from "./salvateur";
import reunionAmoureux from "./reunion-amoureux";
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
  loupAmoureux,
  chasseur,
  ancien,
  rat,
  ratGarou,
  loupSavant,
  loupVampire,
  loupHypnotiseur,
  fou,
  fee,
  arlequin,
  marchand,
  pretre,
  paysan,
  batisseur
];

/**
 * Étapes de la nuit qui se jouent comme une carte, mais qu'aucun joueur ne reçoit.
 * Absentes de LISTE_ROLES (donc d'Options et de la distribution), présentes dans ROLES
 * pour que le moteur les retrouve par leur alias.
 */
const ETAPES: Role[] = [reunionAmoureux];

export const ROLES: Record<string, Role> = Object.fromEntries([...LISTE_ROLES, ...ETAPES].map(r => [r.alias, r]));
