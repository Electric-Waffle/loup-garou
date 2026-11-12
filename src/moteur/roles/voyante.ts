import type { OptionChoix, Role } from "../types";

/** Préfixe des options « sonder une carte hors jeu » : "carte:sorciere". */
const PREFIXE_CARTE = "carte:";

/** Option unique d'une nuit de Clair de lune : la cible est le joueur qui porte "eclaire". */
const OPTION_ECLAIRE = "sonder-eclaire";

// La voyante REGARDE : elle ne donne aucun tag, elle produit une info privée.
// Si le Loup savant est actif, elle peut aussi sonder une des 3 cartes hors jeu qu'il connaît.
const voyante: Role = {
  alias: "voyante",
  titre: "Voyante",
  image: "🔮",
  camp: "village",
  description: "Chaque nuit, elle découvre la carte d'un joueur, ou une des cartes hors jeu connues du Loup savant.",
  explication: [
    "Chaque nuit (rang 80), elle désigne un joueur, et le meneur lui montre sa carte en secret.",
    "Si le Loup savant est en jeu, elle peut à la place sonder une des 3 cartes que personne n'a reçues : elle apprend alors que cette carte n'est pas en jeu.",
    "Clair de lune : cette nuit-là, elle ne peut voir que la carte du joueur éclairé.",
    "Face à un Skinwalker déguisé, elle voit la carte qu'il a volée, pas la sienne.",
    "Si elle regarde la carte de l'Aberration, elle devient catatonique : elle ne fait plus rien et meurt à l'aube."
  ],
  priorite: 80,
  appelNuit: true,

  decision(partie) {
    // Clair de lune (événement) : une seule carte visible cette nuit, celle du joueur éclairé.
    const eclaire = partie.joueursAvecTag("eclaire")[0];
    if (eclaire) {
      return {
        message: `Le clair de lune éclaire ${eclaire.nom} : la voyante ne peut voir que sa carte.`,
        choix: [{ id: OPTION_ECLAIRE, label: `Sonder ${eclaire.nom}`, cible: "aucune", cibles: [eclaire.id] }]
      };
    }

    // POURQUOI une option par carte plutôt qu'un nouveau type de cible : une carte hors jeu
    // n'est pas un joueur, et TypeCible ne désigne que des joueurs.
    // Vide si le Loup savant n'est pas actif (partie.cartesDuSavant est alors []).
    const optionsCartes: OptionChoix[] = partie.cartesDuSavant.map(alias => ({
      id: PREFIXE_CARTE + alias,
      label: `Carte : ${partie.titre(alias)}`,
      cible: "aucune"
    }));
    return {
      message: "La voyante désigne un joueur, ou une carte hors jeu, dont elle veut voir la carte.",
      choix: [{ id: "sonder", label: "Sonder", cible: "un_autre" }, ...optionsCartes]
    };
  },

  agir(choix, partie, moi) {
    if (choix.id.startsWith(PREFIXE_CARTE)) {
      const alias = choix.id.slice(PREFIXE_CARTE.length);
      return { infos: [{ pour: moi.id, texte: `${partie.titre(alias)} n'a été distribuée à personne.` }] };
    }
    // Clair de lune compris : partie.jouer() a mis le joueur éclairé dans choix.cibles.
    const cible = partie.joueur(choix.cibles[0]);
    // Voir la carte de l'Aberration : aucune info, elle devient catatonique et meurt à l'aube.
    if (cible.role === "aberration") {
      return { donner: [{ tag: "catatonique", a: moi.id }] };
    }
    return {
      infos: [{ pour: moi.id, texte: `${cible.nom} est ${partie.titre(partie.carteImitee(cible) ?? cible.role)}.` }]
    };
  }
};

export default voyante;
