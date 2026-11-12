import type { Role } from "../types";

const villageois: Role = {
  alias: "villageois",
  titre: "Villageois",
  image: "🧑‍🌾",
  camp: "village",
  description: "Un habitant du village, qui cultive le maïs et la pomme de terre. Aucun pouvoir, sinon celui de voter.",
  explication: [
    "Le Villageois n'a aucun pouvoir de nuit : il dort pendant que les autres cartes agissent.",
    "Le jour, il débat et vote comme tout le monde : c'est sa seule arme, et c'est la plus importante du village.",
    "Il est du camp du village : il gagne quand il n'y a plus aucun loup vivant.",
    "Il sert aussi de bouclier : plus il y a de villageois, plus il est difficile pour les loups de deviner qui a un pouvoir."
  ]
};

export default villageois;
