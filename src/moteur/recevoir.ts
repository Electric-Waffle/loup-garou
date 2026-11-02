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

    // La morsure devient une mort certaine : le tag "mordu" disparaît, donc la Sorcière
    // ne voit plus la victime et "sauve" n'a plus rien à annuler. L'aube le change en "mort".
    case "agonisant":
      partie.retirerTag(joueur, "mordu", profondeur + 1);
      return r.accepter();

    // Change la carte du joueur (le Rat devient rat-garou). Ses tags et sa memoire sont conservés.
    // POURQUOI un tag plutôt que joueur.role = ... dans le rôle : la transformation passe par
    // l'entrée unique, apparaît au journal, et sert à tout futur rôle qui se transforme.
    case "devient": {
      const nouveauRole = meta.role;
      if (typeof nouveauRole !== "string") return r.bloquer("aucun rôle indiqué");
      partie.role(nouveauRole); // ATTENTION : lève une erreur si l'alias est inconnu, avant toute modification
      joueur.role = nouveauRole;
      return r.consommer(`devient ${partie.titre(nouveauRole)}`);
    }

    case "protege":
      if (partie.aTag(joueur, "protege_hier")) return r.bloquer("déjà protégé la nuit dernière");
      return r.accepter({ expire: "aube" });

    case "mort": {
      if (!joueur.vivant) return r.bloquer("déjà mort");

      // Invulnérable (Loup vampire) : seul le vote du village peut le tuer.
      // POURQUOI une liste BLANCHE (« seul le vote passe ») plutôt qu'une liste noire (« bloquer
      // poison, Chasseur, chagrin… ») : toute FUTURE cause de mort sera bloquée d'office.
      // POURQUOI ici, avant l'or et la mort : bloquer AVANT d'accepter évite de déclencher le
      // chagrin de l'amoureux, le tir du Chasseur ou la transmission de l'or.
      // FLUX : un vote n'est pas bloqué et continue plus bas, or compris (un vampire qui a hérité
      // de l'or peut racheter son vote).
      const parLeVillage = meta.cause === "vote";
      if (partie.aTag(joueur, "invulnerable") && !parLeVillage) {
        return r.bloquer("invulnérable : seul le vote du village peut le tuer");
      }

      // L'or rachète un vote. POURQUOI ici et pas dans marchand.ts : l'or change de main,
      // la règle doit valoir pour TOUT porteur (un loup qui en a hérité, le Fou…).
      // POURQUOI consommer et pas accepter-puis-annuler : une fois acceptée, la mort a déjà
      // déclenché le chagrin de l'amoureux et le tir du Chasseur.
      if (meta.cause === "vote" && partie.aTag(joueur, "or")) {
        partie.retirerTag(joueur, "or", profondeur + 1);
        return r.consommer("paie avec son or : nouveau vote");
      }

      const issue = r.accepter();
      if (partie.aTag(joueur, "or")) transmettreLOr(partie, joueur, meta, profondeur);
      // Chaîne des amoureux : la mort de l'un entraîne celle de TOUS ses partenaires.
      // FLUX : en réseau, c'est une cascade (A → B → C). Elle s'arrête d'elle-même :
      // un partenaire déjà mort est ignoré ici, et "déjà mort" bloque plus haut.
      for (const partenaire of partie.partenairesDe(joueur)) {
        if (!partenaire.vivant) continue;
        donnerTag(partie, partenaire, "mort", { cause: "chagrin", source: joueur.id }, profondeur + 1);
      }
      return issue;
    }

    // Réseau d'amoureux : un nouveau lien S'AJOUTE aux anciens au lieu de les remplacer.
    // POURQUOI ici : sans cette règle, accepter() retire l'ancien tag (pas de doublon) et
    // le premier lien serait perdu. Valable pour toutes les cartes qui lient, présentes et futures.
    // CONCEPT : un Set retire les doublons (un même partenaire lié deux fois).
    case "amoureux": {
      const ancienTag = joueur.tags.find(t => t.type === "amoureux");
      const anciens = idsDe(ancienTag?.partenaires);
      const nouveaux = idsDe(meta.partenaires);
      const partenaires = [...new Set([...anciens, ...nouveaux])];
      return r.accepter({ partenaires });
    }

    default:
      return r.accepter();
  }
}

/** Une meta est « unknown » : on ne garde la valeur que si c'est bien une liste d'ids. */
function idsDe(valeur: unknown): string[] {
  if (!Array.isArray(valeur)) return [];
  return valeur.filter((id): id is string => typeof id === "string");
}

/**
 * Un porteur d'or vient de mourir : l'or va à un de ses tueurs vivants, sinon il choisit.
 *
 * CONCEPT : le "tueur" est meta.source, l'alias de la CARTE qui a donné la mort ("loup",
 * "sorciere"…). porteursDe() la change en joueurs vivants. Quand la source n'est pas une carte
 * jouée par un vivant (Chasseur déjà mort, peste du Rat, chagrin dont la source est un joueur),
 * la liste est vide : c'est le mourant qui choisit, via la décision de la carte Marchand.
 */
function transmettreLOr(partie: Partie, joueur: Joueur, meta: Meta, profondeur: number): void {
  const source = typeof meta.source === "string" ? meta.source : "";
  const tueurs = partie.porteursDe(source).filter(j => j.id !== joueur.id);
  const heritier = partie.auHasard(tueurs);

  if (!heritier) {
    // ATTENTION : l'or reste sur le mort jusqu'à sa décision ; s'il est enchanté, il ne se
    // réveille pas (mettreEnAttente l'ignore) et l'or est perdu avec lui.
    partie.mettreEnAttente("marchand", joueur);
    return;
  }
  partie.retirerTag(joueur, "or", profondeur + 1);
  donnerTag(partie, heritier, "or", { source: joueur.id, cause: "heritage" }, profondeur + 1);
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
