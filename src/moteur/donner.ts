import type { Partie } from "./partie";
import { donnerTag } from "./recevoir";
import type { ChoixFait, Joueur, ResultatAction } from "./types";

/**
 * ÉTAPE 3 — DONNER.
 * Le moteur ne connaît aucun rôle : il appelle role.agir(), puis distribue
 * ce que le rôle a décidé de donner (tags) ou d'apprendre (infos).
 */
export function tourDeCarte(partie: Partie, alias: string, choix: ChoixFait, moi: Joueur): void {
  const role = partie.role(alias);
  const noms = choix.cibles.map(id => partie.joueur(id).nom).join(" + ");
  partie.log({
    type: "action",
    source: alias,
    joueur: moi.id,
    texte: `${partie.titre(alias)} : ${choix.id}${noms ? ` → ${noms}` : ""}`
  });

  // Crochet estVise() : la cible apprend qu'une carte la désigne (le Hurleur), même sans recevoir de tag.
  // POURQUOI avant agir() : la cible lit l'état d'avant l'action (le libellé du bouton choisi).
  for (const id of choix.cibles) {
    const cible = partie.joueur(id);
    partie.roleDe(cible).estVise?.(partie, cible, alias, choix, moi);
  }

  appliquerResultat(partie, role.agir?.(choix, partie, moi), alias);
}

/** Partagé avec les événements : même chemin, même journal. */
export function appliquerResultat(partie: Partie, res: ResultatAction | void, source: string): void {
  const { donner = [], infos = [] } = res ?? {};

  for (const info of infos) partie.ajouterInfo(info);

  for (const d of donner) {
    donnerTag(partie, partie.joueur(d.a), d.tag, { source, ...d.meta });
  }
}
