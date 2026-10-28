/* =====================================================================================
 *  Table.tsx — une table ronde avec des sièges disposés en cercle
 * =====================================================================================
 *
 *  Utilisée par Preparation.tsx (placer les joueurs) et PartieVue.tsx (jouer).
 *
 *  PATTERN : composition de composants.
 *  POURQUOI : la table ne sait rien du jeu. Elle reçoit une liste de sièges, chacun avec un
 *  `contenu` déjà fabriqué par le parent (de type ReactNode : n'importe quel morceau de JSX),
 *  et elle se contente de les PLACER. Les deux pages affichent des sièges très différents
 *  (carte distribuée d'un côté, tags et état de vie de l'autre) avec la même table.
 *  Alternative écartée : une table qui connaîtrait les deux usages, avec des
 *  `if (mode === "partie")` à l'intérieur ; chaque nouvelle page compliquerait ce fichier.
 *  RÉUTILISABLE : tel quel, pour n'importe quel affichage d'éléments en cercle.
 * ===================================================================================== */

import type { ReactNode } from "react";

/** Ce que le parent doit fournir pour chaque siège. */
export interface Siege {
  id: string;            // sert de "key" React (voir plus bas)
  contenu: ReactNode;    // ce qui est affiché dans le siège
  classe?: string;       // classes CSS en plus de "siege" (sélection, mort, cible...)
  onClick?: () => void;  // si présent, le siège devient cliquable
}

/**
 * Rayon du cercle des sièges, en pourcentage de la largeur de la table.
 * 41 % (et pas 50 %) pour que les sièges, qui ont une certaine largeur, ne débordent pas
 * du cadre.
 */
const RAYON_EN_POURCENT = 41;

/**
 * Calcule la position d'un siège sur le cercle.
 *
 * @param indexSiege  numéro du siège (0 = le premier)
 * @param nombreSieges nombre total de sièges
 * @returns les propriétés CSS left et top, en pourcentage
 *
 * Le calcul, étape par étape :
 *   1. fractionDuTour : quelle part du tour complet ce siège occupe (0, 1/8, 2/8...) ;
 *   2. angle : cette part convertie en radians (un tour complet = 2π) ;
 *      on retire π/2 (un quart de tour) pour que le premier siège soit EN HAUT
 *      et non à droite (en trigonométrie, l'angle 0 pointe vers la droite) ;
 *   3. cos(angle) et sin(angle) donnent un point sur un cercle de rayon 1, entre -1 et 1 ;
 *      on le multiplie par le rayon et on l'ajoute au centre (50 %, 50 %).
 */
function positionSurLeCercle(indexSiege: number, nombreSieges: number): { left: string; top: string } {
  // Math.max(..., 1) évite une division par zéro s'il n'y a aucun siège.
  const fractionDuTour = indexSiege / Math.max(nombreSieges, 1);
  const angle = fractionDuTour * 2 * Math.PI - Math.PI / 2;

  const gauche = 50 + RAYON_EN_POURCENT * Math.cos(angle);
  const haut = 50 + RAYON_EN_POURCENT * Math.sin(angle);

  return { left: `${gauche}%`, top: `${haut}%` };
}

/**
 * La table : un plateau rond au centre, les sièges autour.
 *
 * @param sieges la liste des sièges, dans l'ordre (le premier est placé en haut, puis sens horaire)
 * @param centre ce qu'on affiche au milieu du plateau (facultatif)
 */
export function Table({ sieges, centre }: { sieges: Siege[]; centre?: ReactNode }) {
  const nombreSieges = sieges.length;

  return (
    <div className="table">
      <div className="table-plateau">{centre}</div>

      {sieges.map((siege, index) => {
        const position = positionSurLeCercle(index, nombreSieges);

        // POURQUOI changer de balise selon onClick : un <button> est accessible au clavier
        // (Tab pour s'y rendre, Entrée pour cliquer) et annoncé comme cliquable par les
        // lecteurs d'écran. Un siège non cliquable ne doit pas l'être : un simple <div> suffit.
        // CONCEPT : en JSX, une variable qui commence par une MAJUSCULE et contient un nom de
        // balise ("button", "div") peut s'utiliser comme une balise : <Balise>...</Balise>.
        // Avec une minuscule (<balise>), React chercherait une balise HTML appelée "balise".
        const Balise = siege.onClick ? "button" : "div";

        // "?? ''" : si aucune classe supplémentaire n'est fournie, on n'écrit pas "undefined".
        const classes = `siege ${siege.classe ?? ""}`;

        // CONCEPT : la prop "key". Quand React redessine une liste, il compare l'ancienne et la
        // nouvelle grâce à cette clé, pour savoir quel élément est lequel. Avec l'id du joueur
        // (stable), deux joueurs qui échangent leur place sont reconnus et simplement déplacés.
        // ATTENTION : ne jamais utiliser l'index comme key quand l'ordre peut changer : React
        // confondrait les éléments après un échange de places.
        return (
          <Balise key={siege.id} className={classes} style={position} onClick={siege.onClick}>
            {siege.contenu}
          </Balise>
        );
      })}
    </div>
  );
}
