import type { Role } from "../types";

/**
 * BEAU PARLEUR : un orateur du village. Il survit à une attaque des loups et, s'il devient maire,
 * peut sauver un accusé une fois dans la partie. La première nuit, il peut devenir Faux Parleur.
 *
 * Déroulé :
 *   1. Nuit 1 (priorité 72, avant les loups à 120) : « Rester Beau Parleur » ou « Devenir Faux
 *      Parleur ». Le second DONNE "devient" : sa carte devient le Faux Parleur (camp des loups),
 *      qui se réveille avec la meute dès cette nuit. Sa mémoire et ses tags le suivent.
 *   2. Deux vies face aux loups (comme l'Ancien) : sa première mort par morsure devient "vie_perdue".
 *   3. S'il est maire : avantVote() suspend chaque vote. Le meneur lui montre en secret la carte
 *      de l'accusé, puis il laisse la mort avoir lieu, ou, UNE fois par partie, relance le vote.
 *
 * PATTERN : carte qui en devient une autre (tag "devient"), comme le Rat → Rat-garou.
 * POURQUOI changer de carte plutôt que garder le camp dans la mémoire : TOUT le moteur lit
 * Role.camp (victoire, Ancien, Loup barbare, Aberration…). Changer de carte, c'est changer de camp
 * partout, sans toucher une seule règle.
 * POURQUOI ce code ressemble à faux-parleur.ts sans le réutiliser : chaque carte reste
 * indépendante, on peut jouer l'une sans l'autre, ou supprimer l'une sans casser l'autre.
 */
const beauParleur: Role = {
  alias: "beau-parleur",
  titre: "Beau Parleur",
  image: "🎙️",
  camp: "village",
  hybride: true,
  description: "Il survit à la première attaque des loups. Maire, il voit la carte de chaque accusé avant sa mort et peut, une fois par partie, relancer le vote. La 1re nuit, il peut devenir Faux Parleur.",
  explication: [
    "La première nuit (rang 72), il choisit en secret de rester Beau Parleur ou de devenir Faux Parleur, du camp des loups.",
    "Il a deux vies face aux loups : la première morsure qui devrait le tuer lui fait seulement perdre une vie.",
    "S'il est maire, chaque vote est suspendu avant la mort : le meneur lui montre en secret la carte de l'accusé.",
    "Il peut alors laisser la mort se produire, ou relancer le vote, une seule fois par partie.",
    "Privé de pouvoir (Ancien, Fée, Pleureuse), le vote tue tout de suite.",
    "Son pouvoir de maire ne compte que s'il a été élu grâce à son éloquence, sans avoir révélé sa carte. S'il s'est fait élire en laissant entendre qu'il était Beau Parleur, il n'a pas de pouvoir : c'est le meneur qui en juge.",
    "Dans ce cas, à chaque vote, le meneur choisit simplement « Laisser le vote », sans lui montrer la carte de l'accusé.",
    "Il peut aussi devenir maire plus tard dans la partie : il a donc intérêt à garder sa carte secrète jusqu'au bout.",
    "Carte hybride : à sa mort, le meneur annonce « Beau Parleur », sans jamais révéler le camp que le joueur avait choisi."
  ],
  priorite: 72,
  appelNuit: true,
  tours: { de: 1, a: 1 },

  init: () => ({ relanceUtilisee: false }),

  recevoir(tag, meta, r, partie, moi) {
    if (tag === "mort" && meta.cause === "mordu" && !partie.aTag(moi, "vie_perdue")) {
      return r.transformer("vie_perdue");
    }
  },

  // Maire : il suspend chaque vote (voir partie.voter). Bloqué (impuissant…), mettreEnAttente
  // l'ignore et le vote tue tout de suite.
  avantVote(partie, moi) {
    if (partie.aTag(moi, "maire")) partie.mettreEnAttente("beau-parleur", moi);
  },

  // POURQUOI ce test : decision() sert à DEUX moments. La nuit 1 (devenir Faux Parleur ou non) et
  // pendant un vote suspendu (décision urgente du maire, voir avantVote).
  decision(partie, moi) {
    if (partie.voteEnSuspens) {
      const accuse = partie.joueur(partie.voteEnSuspens);
      const peutRelancer = !moi.memoire.relanceUtilisee;
      return {
        message: `Montrez en secret au maire la carte de ${accuse.nom} : ${partie.titre(accuse.role)}.`
          + (peutRelancer ? " Il peut relancer le vote, une seule fois dans la partie." : " (Il a déjà relancé un vote.)"),
        choix: [
          { id: "executer", label: "Laisser le vote", cible: "aucune" },
          ...(peutRelancer ? [{ id: "relancer", label: "Relancer le vote", cible: "aucune" as const }] : [])
        ]
      };
    }
    return {
      message: `${partie.titre(moi.role)} choisit en secret son camp. Faux Parleur, il se réveillera avec la meute dès cette nuit.`,
      choix: [
        { id: "rester", label: "Rester Beau Parleur", cible: "aucune" },
        { id: "devenir", label: `Devenir ${partie.titre("faux-parleur")}`, cible: "aucune" }
      ]
    };
  },

  // ATTENTION : « Passer » la nuit 1 n'appelle pas agir() : il reste Beau Parleur.
  agir(choix, partie, moi) {
    if (partie.voteEnSuspens) {
      const relancer = choix.id === "relancer";
      if (relancer) moi.memoire.relanceUtilisee = true;
      partie.trancherLeVote(relancer);
      return;
    }
    if (choix.id === "devenir") {
      return { donner: [{ tag: "devient", a: moi.id, meta: { role: "faux-parleur" } }] };
    }
  }
};

export default beauParleur;
