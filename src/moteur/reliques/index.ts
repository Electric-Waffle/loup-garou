import type { Relique } from "../types";
import boussoleDesMorts from "./boussole-des-morts";
import ecailleDeKukulkan from "./ecaille-de-quetzalcoatl";
import encensDeVerite from "./encens-de-verite";
import fontaineDeFee from "./fontaine-de-fee";
import graalDeSang from "./graal-de-sang";
import hacheDeGuerre from "./hache-de-guerre";
import larmeDeLune from "./larme-de-lune";
import masqueDeRumeurs from "./masque-de-rumeurs";
import oeilDeLOracle from "./oeil-de-l-oracle";
import siffletDeLaMort from "./sifflet-de-la-mort";
import templeDivin from "./temple-divin";
import toisonDOr from "./toison-d-or";

/**
 * Registre des reliques. Ajouter une relique :
 *   1. créer reliques/<alias>.ts (copier une relique proche comme modèle) ;
 *   2. l'ajouter dans cette liste.
 * Elle apparaît alors dans la liste de la page Préparer et dans la page Explications.
 * Ordre d'affichage : le camp du village d'abord, puis les loups.
 */
export const LISTE_RELIQUES: Relique[] = [
  templeDivin,
  fontaineDeFee,
  encensDeVerite,
  ecailleDeKukulkan,
  hacheDeGuerre,
  oeilDeLOracle,
  masqueDeRumeurs,
  boussoleDesMorts,
  siffletDeLaMort,
  graalDeSang,
  toisonDOr,
  larmeDeLune
];

export const RELIQUES: Record<string, Relique> = Object.fromEntries(LISTE_RELIQUES.map(r => [r.alias, r]));

/** La relique choisie tant que l'oracle n'en choisit pas une autre : celle qui ne change rien. */
export const RELIQUE_PAR_DEFAUT = "temple-divin";
