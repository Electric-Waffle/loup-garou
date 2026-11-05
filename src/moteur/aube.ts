import { appliquerResultat } from "./donner";
import type { Partie } from "./partie";
import { donnerTag } from "./recevoir";
import type { Meta, Tag } from "./types";

/**
 * Deuxième vague de réception : les tags de la nuit produisent leurs conséquences.
 * L'ORDRE DE CE TABLEAU COMPTE : les morsures sont traitées avant les poisons.
 */
const CONSEQUENCES: { tag: string; devient: string; meta?: Meta; si?: (t: Tag) => boolean }[] = [
  { tag: "mordu",      devient: "mort", meta: { cause: "mordu" } },
  // Le Rat qui a choisi de mordre : dévoré, sans sauvetage possible.
  { tag: "agonisant",  devient: "mort", meta: { cause: "mordu" } },
  // Une voyante qui a vu l'Aberration : figée la nuit (tag bloquant), morte au matin.
  { tag: "catatonique", devient: "mort", meta: { cause: "horreur" } },
  { tag: "empoisonne", devient: "mort", meta: { cause: "poison" } },
  // Seule une protection du Salvateur l'empêche de protéger la même personne la nuit suivante.
  { tag: "protege",    devient: "protege_hier", si: t => t.source === "salvateur" },

  // Peste : un cran par aube, mort à la 4e aube après la morsure du Rat (3 nuits plus tard).
  // ATTENTION : écrite À L'ENVERS. La boucle traite les lignes dans l'ordre, et un tag posé
  // par une ligne est vu par les lignes suivantes de la même aube. Dans l'ordre naturel
  // (peste → peste_active → … → mort), la peste tuerait dès la première aube.
  { tag: "peste_mortelle",  devient: "mort", meta: { cause: "peste" } },
  { tag: "peste_imminente", devient: "peste_mortelle" },
  { tag: "peste_active",    devient: "peste_imminente" },
  { tag: "peste",           devient: "peste_active" }
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

  // 3. Crochet aube() des rôles, APRÈS les conséquences : un rôle voit les morts de cette aube.
  //    FLUX : comme agir(), le rôle renvoie ce qu'il donne, et appliquerResultat le distribue.
  for (const j of partie.vivants()) {
    // ATTENTION : vivants() est la liste du début de la boucle ; un crochet précédent a pu tuer j.
    if (!j.vivant) continue;
    appliquerResultat(partie, partie.roleDe(j).aube?.(partie, j), j.role);
  }

  // 4. Les tags restants qui expirent à l'aube disparaissent.
  //    Un tag "aube_suivante" n'y passe pas : il devient "aube" et tiendra jusqu'à l'aube suivante.
  //    Ex. : les loups blessés par le Paysan (posé pendant l'aube), le silence du Loup hypnotiseur
  //    (posé la nuit, il doit durer pendant tout le vote du jour).
  for (const j of partie.joueurs) {
    for (const t of j.tags) {
      if (t.expire === "aube") partie.retirerTag(j, t.type);
      else if (t.expire === "aube_suivante") t.expire = "aube";
    }
  }
}
