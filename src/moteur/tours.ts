import type { Role } from "./types";

/**
 * Le rôle peut-il agir cette nuit ?
 *   tours absent          → toutes les nuits
 *   { de: 2 }             → à partir de la nuit 2
 *   { de: 1, a: 1 }       → uniquement la nuit 1
 *   { de: 2, chaque: 2 }  → nuits 2, 4, 6…
 */
export function peutAgir(role: Role, tour: number): boolean {
  const t = role.tours;
  if (!t) return true;
  if (t.de !== undefined && tour < t.de) return false;
  if (t.a !== undefined && tour > t.a) return false;
  if (t.chaque && (tour - (t.de ?? 1)) % t.chaque !== 0) return false;
  return true;
}
