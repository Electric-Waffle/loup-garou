import type { Partie } from "./partie";
import { donnerTag } from "./recevoir";
import type { Meta, Tag } from "./types";

/**
 * Deuxième vague de réception : les tags de la nuit produisent leurs conséquences.
 * L'ORDRE DE CE TABLEAU COMPTE : les morsures sont traitées avant les poisons.
 */
const CONSEQUENCES: { tag: string; devient: string; meta?: Meta; si?: (t: Tag) => boolean }[] = [
  { tag: "mordu",      devient: "mort", meta: { cause: "mordu" } },
  { tag: "empoisonne", devient: "mort", meta: { cause: "poison" } },
  // Seule une protection du Salvateur l'empêche de protéger la même personne la nuit suivante.
  { tag: "protege",    devient: "protege_hier", si: t => t.source === "salvateur" }
];

export function aube(partie: Partie): void {
  // 1. Ménage : la contrainte "protégé hier" ne dure qu'une nuit.
  for (const j of partie.joueurs) partie.retirerTag(j, "protege_hier");

  // 2. Conséquences, dans l'ordre du tableau. On repasse par donnerTag :
  //    l'Ancien, les amoureux et le Chasseur réagissent sans code supplémentaire.
  for (const c of CONSEQUENCES) {
    for (const j of partie.joueurs.filter(j => partie.aTag(j, c.tag))) {
      const tag = j.tags.find(t => t.type === c.tag)!;
      partie.retirerTag(j, c.tag);
      if (!j.vivant) continue;
      if (c.si && !c.si(tag)) continue;
      donnerTag(partie, j, c.devient, { source: tag.source, ...c.meta });
    }
  }

  // 3. Les tags restants qui expirent à l'aube disparaissent.
  for (const j of partie.joueurs) {
    for (const t of j.tags.filter(t => t.expire === "aube")) partie.retirerTag(j, t.type);
  }
}
