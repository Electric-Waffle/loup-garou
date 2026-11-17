/* =====================================================================================
 *  outils.ts — petites fonctions que plusieurs reliques partagent
 * =====================================================================================
 *  POURQUOI un fichier à part, alors que « chaque carte reste indépendante » : cette règle
 *  protège les RÔLES entre eux. Ici, ce sont des questions du moteur (« cette mort vient-elle
 *  des loups ? »), pas des règles propres à une relique ; les dupliquer dans quatre fichiers
 *  ferait diverger leur définition de « victime des loups ».
 * ===================================================================================== */

import type { Partie } from "../partie";
import type { Joueur, Meta } from "../types";
import { ROLES } from "../roles";

/**
 * La source d'un tag est-elle une carte du camp des loups ?
 * La source est l'alias de la CARTE qui a donné le tag (« loup », « loup-barbare »…), ou autre
 * chose qu'une carte (« vote », l'id d'un joueur…) : ROLES[...] vaut alors undefined, donc false.
 * POURQUOI le camp et pas seulement « loup » : le Loup barbare mord aussi, sous son propre alias.
 * Le Rat, lui, est du village : sa morsure (« agonisant ») n'est pas une victime des loups.
 */
export function estUnLoup(source: unknown): boolean {
  return typeof source === "string" && ROLES[source]?.camp === "loups";
}

/**
 * Ce tag « mort » est-il le résultat d'une morsure de loup ?
 * FLUX : les loups donnent « mordu » la nuit ; à l'aube, aube.ts le convertit en « mort » avec
 * cause « mordu » et la même source. C'est CE tag « mort » qui fait d'un joueur une vraie victime :
 * une morsure bloquée (Salvateur, Fêtard) ou soignée (Sorcière) n'arrive jamais jusqu'ici.
 */
export function estUneMorsureDeLoup(tag: string, meta: Meta): boolean {
  return tag === "mort" && meta.cause === "mordu" && estUnLoup(meta.source);
}

/** Les joueurs vivants du camp des loups, hybrides et loups cachés compris (comme victoire.ts). */
export function loupsVivants(partie: Partie): Joueur[] {
  return partie.vivants().filter(joueur => partie.roleDe(joueur).camp === "loups");
}
