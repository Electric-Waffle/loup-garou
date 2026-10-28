import type { Partie } from "./partie";
import type { Issue, Joueur, Meta, Reponses } from "./types";

const PROFONDEUR_MAX = 5;

/**
 * ÉTAPE 4 — RECEVOIR.
 * Point d'entrée unique : tout tag posé sur un joueur passe par ici,
 * qu'il vienne d'un rôle, de l'aube, d'un vote ou d'un événement.
 *
 * 1. Le rôle du receveur peut intercepter (recevoir) → s'il renvoie une Issue, on s'arrête.
 * 2. Sinon, les règles générales par tag (le switch qui grandit avec les mécaniques).
 */
export function donnerTag(partie: Partie, joueur: Joueur, tag: string, meta: Meta = {}, profondeur = 0): Issue {
  if (profondeur > PROFONDEUR_MAX) {
    throw new Error(`Boucle de tags sur ${joueur.nom} (${tag})`);
  }

  const r = reponses(partie, joueur, tag, meta, profondeur);

  // 1. Le rôle du joueur a-t-il son mot à dire ?
  const role = partie.roleDe(joueur);
  const reaction = role.recevoir?.(tag, meta, r, partie, joueur);
  if (reaction) return reaction;

  // 2. Règles générales par tag
  switch (tag) {
    case "mordu":
      if (partie.aTag(joueur, "protege")) return r.bloquer("protégé cette nuit");
      return r.accepter();

    case "sauve":
      if (!partie.aTag(joueur, "mordu")) return r.bloquer("n'était pas mordu");
      partie.retirerTag(joueur, "mordu", profondeur + 1);
      return r.consommer("morsure annulée");

    case "protege":
      if (partie.aTag(joueur, "protege_hier")) return r.bloquer("déjà protégé la nuit dernière");
      return r.accepter({ expire: "aube" });

    case "mort": {
      if (!joueur.vivant) return r.bloquer("déjà mort");
      const issue = r.accepter();
      // Chaîne des amoureux : la mort de l'un entraîne celle de l'autre.
      const partenaire = partie.partenaireDe(joueur);
      if (partenaire?.vivant) {
        donnerTag(partie, partenaire, "mort", { cause: "chagrin", source: joueur.id }, profondeur + 1);
      }
      return issue;
    }

    default:
      return r.accepter();
  }
}

/** Les cinq réponses possibles d'un receveur. Chacune écrit dans le journal. */
function reponses(partie: Partie, joueur: Joueur, tag: string, meta: Meta, profondeur: number): Reponses {
  const log = (type: "recu" | "bloque" | "consomme" | "transforme" | "redirige", extra: Record<string, unknown> = {}) =>
    partie.log({
      type,
      joueur: joueur.id,
      tag,
      source: meta.source,
      cause: meta.cause,
      profondeur,
      ...extra
    });

  return {
    accepter(opts = {}) {
      joueur.tags = joueur.tags.filter(t => t.type !== tag); // pas de doublon
      joueur.tags.push({ ...meta, ...opts, type: tag, tour: partie.tour });
      if (tag === "mort") joueur.vivant = false;
      log("recu");
      partie.roleDe(joueur).reagir?.(tag, meta, partie, joueur);
      return "accepte";
    },
    bloquer(raison) {
      log("bloque", { raison });
      return "bloque";
    },
    consommer(raison) {
      log("consomme", { raison });
      return "consomme";
    },
    transformer(nouveauTag, m = {}) {
      log("transforme", { en: nouveauTag });
      donnerTag(partie, joueur, nouveauTag, { ...meta, ...m }, profondeur + 1);
      return "transforme";
    },
    rediriger(autre) {
      log("redirige", { vers: autre.id });
      donnerTag(partie, autre, tag, meta, profondeur + 1);
      return "redirige";
    }
  };
}
