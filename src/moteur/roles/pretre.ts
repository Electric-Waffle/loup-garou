import type { Role } from "../types";

/**
 * PRÊTRE : un villageois sans pouvoir de son vivant. Mort (et annoncé), il garde les yeux
 * fermés la nuit et ouverts le jour comme les vivants, ne vote plus, mais peut chuchoter au maire.
 *
 * POURQUOI aucune méthode : tout se passe autour de la table. Le moteur ne fait rien ;
 * l'interface rappelle seulement au meneur, pendant le débat, que le Prêtre mort peut parler au maire.
 */
const pretre: Role = {
  alias: "pretre",
  titre: "Prêtre",
  image: "⛪",
  camp: "village",
  description: "Après sa mort, il continue de faire semblant de jouer et peut chuchoter au maire pendant le débat. Il ne vote plus."
};

export default pretre;
