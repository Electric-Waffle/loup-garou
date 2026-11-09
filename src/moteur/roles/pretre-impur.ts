import type { Role } from "../types";

/**
 * PRÊTRE IMPUR : un prêtre au service des loups. Distribué directement, ou atteint par un Prêtre pur
 * qui choisit de le devenir la nuit 1 (tag "devient").
 *
 * Déroulé :
 *   1. Vivant : aucun pouvoir. Il ne se réveille PAS avec la meute (pas de rejoint) : les loups
 *      ignorent qu'il est des leurs.
 *   2. Mort : comme le Prêtre pur, il peut chuchoter au maire pendant le débat (rappel de PartieVue),
 *      mais pour le tromper.
 *   3. Il est du camp des loups : il compte comme un loup et gagne avec eux.
 *
 * ATTENTION : compter comme un loup change l'équilibre (victoire.ts). Tant qu'il est vivant, le
 * village n'a pas gagné, même si tous les vrais loups sont morts ; et il compte dans « autant de
 * loups que de villageois », ce qui rapproche la meute de la victoire.
 */
const pretreImpur: Role = {
  alias: "pretre-impur",
  titre: "Prêtre impur",
  image: "🩸",
  camp: "loups",
  hybride: true,
  description: "Un prêtre qui sert les loups sans qu'ils le sachent. Aucun pouvoir de son vivant ; mort, il peut chuchoter au maire pour le tromper. Il gagne avec les loups."
};

export default pretreImpur;
