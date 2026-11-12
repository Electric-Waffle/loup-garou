import type { Evenement } from "../types";
import baillon from "./baillon";
import batonDeParole from "./baton-de-parole";
import benediction from "./benediction";
import boucheCousue from "./bouche-cousue";
import carnaval from "./carnaval";
import clairDeLune from "./clair-de-lune";
import contagion from "./contagion";
import coupDouble from "./coup-double";
import marcheNoir from "./marche-noir";
import murmures from "./murmures";
import passation from "./passation";
import { sablier, sablierSuite } from "./sablier";
import saufConduit from "./sauf-conduit";
import soleil from "./soleil";
import soupcon from "./soupcon";
import tenebres from "./tenebres";
import treve from "./treve";
import ultimatum from "./ultimatum";
import urgence from "./urgence";

/**
 * Registre des événements. Ajouter un événement :
 *   1. créer evenements/<alias>.ts
 *   2. l'ajouter dans LISTE_EVENEMENTS (tirage au hasard)
 * Les événements utilisent le même chemin que les rôles : ils renvoient { donner, infos },
 * qui passent par donnerTag() et le journal.
 */
export const LISTE_EVENEMENTS: Evenement[] = [
  // Rien ou presque
  soleil,
  // Animations : le meneur lit la règle
  baillon,
  tenebres,
  carnaval,
  batonDeParole,
  murmures,
  boucheCousue,
  // Minuteur du débat
  sablier,
  urgence,
  treve,
  // Le maire désigne
  saufConduit,
  soupcon,
  benediction,
  passation,
  contagion,
  clairDeLune,
  // Sans choix
  marcheNoir,
  // Selon le résultat du vote
  ultimatum,
  coupDouble
];

/** Jamais tirés au hasard, seulement imposés par le moteur (la suite du Sablier). */
const IMPOSES: Evenement[] = [sablierSuite];

export const EVENEMENTS: Record<string, Evenement> = Object.fromEntries(
  [...LISTE_EVENEMENTS, ...IMPOSES].map(e => [e.alias, e])
);
