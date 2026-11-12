import type { Evenement } from "../types";

/**
 * MARCHÉ NOIR : la Sorcière et le Loup hypnotiseur retrouvent toutes leurs charges.
 *
 * POURQUOI un tag "recharge" donné à TOUS les vivants, plutôt que modifier la memoire de la
 * Sorcière ici : une carte (ou un événement) ne touche jamais la memoire d'un rôle. Chaque rôle
 * décide dans son recevoir() ce que « recharger » veut dire pour lui ; recevoir.ts consomme
 * le tag chez les autres, pour qu'il ne traîne pas.
 * RÉUTILISABLE : un futur rôle à charges n'a qu'à répondre à "recharge".
 */
const marcheNoir: Evenement = {
  alias: "marche-noir",
  titre: "Caravane de lamas",
  image: "🦙",
  description: "Une caravane de lamas traverse la vallée : la Sorcière et le Loup hypnotiseur retrouvent toutes leurs potions et médaillons.",
  explication: [
    "Une caravane de lamas apporte plantes et obsidienne : la Sorcière retrouve ses deux potions, et le Loup hypnotiseur ses deux médaillons.",
    "Les potions et médaillons ne se cumulent pas : on revient simplement au plein.",
    "Les autres joueurs ne gagnent rien."
  ],

  appliquer: (partie) => ({
    donner: partie.vivants().map(joueur => ({ tag: "recharge", a: joueur.id }))
  })
};

export default marcheNoir;
