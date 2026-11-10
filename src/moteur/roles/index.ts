import type { Role } from "../types";
import aberration from "./aberration";
import ancien from "./ancien";
import beauParleur from "./beau-parleur";
import arlequin from "./arlequin";
import batisseur from "./batisseur";
import chasseur from "./chasseur";
import conciliabule from "./conciliabule";
import cupidon from "./cupidon";
import fauxParleur from "./faux-parleur";
import fee from "./fee";
import skinwalker from "./skinwalker";
import stratege from "./stratege";
import fetard from "./fetard";
import fou from "./fou";
import loup from "./loup";
import loupAmoureux from "./loup-amoureux";
import loupBarbare from "./loup-barbare";
import loupDemon from "./loup-demon";
import loupHypnotiseur from "./loup-hypnotiseur";
import loupSalamandre from "./loup-salamandre";
import loupSavant from "./loup-savant";
import loupSuccube from "./loup-succube";
import loupVampire from "./loup-vampire";
import loupVoyante from "./loup-voyante";
import marchand from "./marchand";
import paysan from "./paysan";
import pleureuse from "./pleureuse";
import pretre from "./pretre";
import pretreImpur from "./pretre-impur";
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
  loupVoyante,
  loupDemon,
  loupBarbare,
  loupSalamandre,
  fou,
  fee,
  arlequin,
  marchand,
  pretre,
  pretreImpur,
  beauParleur,
  fauxParleur,
  paysan,
  batisseur,
  pleureuse,
  fetard,
  stratege,
  aberration,
  skinwalker
];

/**
 * Étapes de la nuit qui se jouent comme une carte, mais qu'aucun joueur ne reçoit.
 * Absentes de LISTE_ROLES (donc d'Options et de la distribution), présentes dans ROLES
 * pour que le moteur les retrouve par leur alias.
 */
const ETAPES: Role[] = [reunionAmoureux, conciliabule];

export const ROLES: Record<string, Role> = Object.fromEntries([...LISTE_ROLES, ...ETAPES].map(r => [r.alias, r]));
