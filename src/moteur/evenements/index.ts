import type { Evenement } from "../types";
import benediction from "./benediction";
import rumeur from "./rumeur";
import { sablier, sablierSuite } from "./sablier";
import soleil from "./soleil";

/**
 * Registre des événements. Ajouter un événement :
 *   1. créer evenements/<alias>.ts
 *   2. l'ajouter dans LISTE_EVENEMENTS (tirage au hasard)
 * Les événements utilisent le même chemin que les rôles : ils renvoient { donner, infos },
 * qui passent par donnerTag() et le journal.
 */
export const LISTE_EVENEMENTS: Evenement[] = [soleil, rumeur, benediction, sablier];

/** Jamais tirés au hasard, seulement imposés par le moteur (la suite du Sablier). */
const IMPOSES: Evenement[] = [sablierSuite];

export const EVENEMENTS: Record<string, Evenement> = Object.fromEntries(
  [...LISTE_EVENEMENTS, ...IMPOSES].map(e => [e.alias, e])
);
