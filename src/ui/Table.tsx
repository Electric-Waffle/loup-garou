/* =====================================================================================
 *  Table.tsx — une table ronde avec des sièges disposés en cercle
 * =====================================================================================
 *
 *  Utilisée par Preparation.tsx (placer les joueurs), PartieVue.tsx (jouer) et la page
 *  Explications (les cas particuliers).
 *
 *  Déroulé :
 *    1. useProportions() mesure la table (largeur / hauteur) et la remesure quand elle change ;
 *    2. pour chaque siège, on calcule DEUX positions normalisées (entre -1 et 1) :
 *       sur un cercle (--cos, --sin) et sur un carré arrondi (--x-carre, --y-carre) ;
 *    3. styles.css choisit la forme et la multiplie par le rayon : cercle sur ordinateur,
 *       carré arrondi au téléphone, où la table est haute et étroite.
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

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

/** Ce que le parent doit fournir pour chaque siège. */
export interface Siege {
  id: string;            // sert de "key" React (voir plus bas)
  contenu: ReactNode;    // ce qui est affiché dans le siège
  classe?: string;       // classes CSS en plus de "siege" (sélection, mort, cible...)
  onClick?: () => void;  // si présent, le siège devient cliquable
}

/** Un point normalisé : x et y entre -1 et 1, (0, 0) étant le centre de la table. */
interface Point { x: number; y: number }

/* -------------------------------------------------------------------------------------
 *  Géométrie
 *  POURQUOI des positions NORMALISÉES et pas left/top en pixels : le rayon dépend de la taille
 *  des sièges, que seul le CSS connaît (elle varie avec l'écran et le nombre de joueurs).
 *  FLUX : styles.css fait left = 50 % + rayon-x × x, top = 50 % + rayon-y × y.
 *  CONCEPT : un pourcentage dans `left` se rapporte à la LARGEUR du parent, dans `top` à sa
 *  HAUTEUR. Une table non carrée étire donc le cercle en ellipse sans aucun calcul en plus.
 * ------------------------------------------------------------------------------------- */

/**
 * L'angle d'un point du tour, le premier EN HAUT, puis dans le sens des aiguilles d'une montre.
 * On retire π/2 (un quart de tour) : en trigonométrie, l'angle 0 pointe vers la droite.
 */
function angleDuTour(fractionDuTour: number): number {
  return fractionDuTour * 2 * Math.PI - Math.PI / 2;
}

/**
 * Exposant du carré arrondi : 1 = le cercle ; plus il est petit, plus on s'approche d'un carré.
 * 0,6 : un point à 45° passe de 0,71 à 0,81 du rayon, vers le coin.
 */
const ARRONDI_DU_CARRE = 0.6;

/**
 * Élève une coordonnée du cercle à une puissance inférieure à 1, en gardant son signe.
 *   0,71 ** 0,6 → 0,81 (elle grandit : le point file vers le coin)
 *   1 et 0 ne bougent pas : le haut, le bas et les côtés restent en place.
 * POURQUOI Math.sign × Math.abs : une puissance non entière d'un nombre négatif donne NaN.
 * CONCEPT : c'est la « superellipse » (ou squircle), la forme des icônes d'iPhone.
 */
function versLeCarre(coordonnee: number): number {
  return Math.sign(coordonnee) * Math.abs(coordonnee) ** ARRONDI_DU_CARRE;
}

/** Finesse du tracé pour mesurer le tour : 720 petits segments, un tous les demi-degrés. */
const ECHANTILLONS = 720;

/**
 * Les places des sièges sur le carré arrondi, ESPACÉES ÉGALEMENT le long du tour.
 *
 * @param nombre      combien de sièges
 * @param proportions largeur / hauteur de la table (0,7 = plus haute que large)
 *
 * POURQUOI ne pas simplement prendre des angles réguliers, comme pour le cercle : sur une forme
 * étirée, des angles égaux ne donnent PAS des distances égales. Sur une table haute, les sièges
 * se serraient (et se chevauchaient) en haut et en bas, et laissaient des trous sur les côtés.
 *
 * Le calcul, étape par étape :
 *   1. on trace le tour en 720 points (comme une corde à nœuds) ;
 *   2. on mesure la longueur de chaque bout de corde, la table ÉTIRÉE à ses vraies proportions
 *      (x multiplié par `proportions`), et on les additionne : longueursCumulees[k] = distance
 *      parcourue depuis le haut jusqu'au point k ;
 *   3. le siège i se place au point où l'on a parcouru i / nombre du tour complet.
 */
function placesSurLeCarre(nombre: number, proportions: number): Point[] {
  // 1. Les points du tour. Array.from({ length }, fabrique) : un tableau de `length` éléments,
  //    chacun fabriqué à partir de son index k (comme range() + array_map en PHP).
  const trace: Point[] = Array.from({ length: ECHANTILLONS + 1 }, (_, k) => {
    const angle = angleDuTour(k / ECHANTILLONS);
    return { x: versLeCarre(Math.cos(angle)), y: versLeCarre(Math.sin(angle)) };
  });

  // 2. Les longueurs cumulées. POURQUOI une boucle et pas un reduce : chaque valeur dépend de la
  //    précédente ET de deux points voisins ; la boucle se lit d'un coup d'œil.
  const longueursCumulees = [0];
  for (let k = 1; k <= ECHANTILLONS; k++) {
    const dx = (trace[k].x - trace[k - 1].x) * proportions;
    const dy = trace[k].y - trace[k - 1].y;
    longueursCumulees.push(longueursCumulees[k - 1] + Math.hypot(dx, dy));
  }
  const tourComplet = longueursCumulees[ECHANTILLONS];

  // 3. Une place par siège : le premier point du tracé qui atteint la distance voulue.
  return Array.from({ length: nombre }, (_, i) => {
    const distanceVoulue = (i / nombre) * tourComplet;
    const k = longueursCumulees.findIndex(longueur => longueur >= distanceVoulue);
    return trace[k];
  });
}

/* -------------------------------------------------------------------------------------
 *  Mesure de la table
 * ------------------------------------------------------------------------------------- */

/**
 * Hook personnalisé : les proportions (largeur / hauteur) d'un élément, tenues à jour.
 *
 * CONCEPT : un custom hook est une simple fonction dont le nom commence par « use » et qui
 * appelle d'autres hooks. Il range un morceau de logique avec état (ici : observer une taille)
 * pour le réutiliser tel quel, comme un service qu'on injecte en Symfony.
 * FLUX :
 *   1. premier rendu : on renvoie 1 (carré), la table n'est pas encore dans la page ;
 *   2. React l'insère dans la page, puis appelle l'effet AVANT que l'écran soit peint : on mesure
 *      la table tout de suite (getBoundingClientRect) → setProportions → React refait le rendu,
 *      toujours avant la peinture ; l'œil ne voit jamais la version « carrée » ;
 *   3. l'effet branche aussi un ResizeObserver, que le navigateur appelle à chaque changement de
 *      taille (rotation du téléphone, panneau qui se replie…) → setProportions → nouveau rendu ;
 *   4. quand la table disparaît, le nettoyage débranche l'observateur.
 * CONCEPT : useLayoutEffect a le même contrat que useEffect, mais il s'exécute juste après la
 * mise à jour du DOM et AVANT la peinture, au lieu d'après. À réserver aux mesures de mise en
 * page : il retarde l'affichage du temps de son exécution.
 * POURQUOI pas seulement le ResizeObserver : son premier appel peut arriver une image plus tard
 * (bien plus dans un onglet en arrière-plan). Les sièges des coins sautaient alors à chaque
 * ouverture de l'onglet Partie, le temps que la vraie forme arrive.
 * POURQUOI arrondir au centième : un changement de taille d'un demi-pixel ne vaut pas un rendu.
 * React ignore un setState avec la MÊME valeur ; l'arrondi rend ce cas fréquent.
 * RÉUTILISABLE : pour tout composant qui doit s'adapter à SA taille (et non à celle de l'écran).
 */
function useProportions(element: RefObject<HTMLElement>): number {
  const [proportions, setProportions] = useState(1);

  useLayoutEffect(() => {
    const cible = element.current;
    if (!cible) return;

    const mesurer = (largeur: number, hauteur: number) => {
      if (largeur > 0 && hauteur > 0) setProportions(Math.round((largeur / hauteur) * 100) / 100);
    };

    const taille = cible.getBoundingClientRect();
    mesurer(taille.width, taille.height);

    // CONCEPT : ([entree]) déstructure le premier élément du tableau d'entrées observées.
    const observateur = new ResizeObserver(([entree]) => {
      mesurer(entree.contentRect.width, entree.contentRect.height);
    });
    observateur.observe(cible);
    return () => observateur.disconnect();
  }, [element]);

  return proportions;
}

/* -------------------------------------------------------------------------------------
 *  Le composant
 * ------------------------------------------------------------------------------------- */

/**
 * La table : un plateau rond au centre, les sièges autour.
 *
 * @param sieges la liste des sièges, dans l'ordre (le premier est placé en haut, puis sens horaire)
 * @param centre ce qu'on affiche au milieu du plateau (facultatif)
 */
export function Table({ sieges, centre }: { sieges: Siege[]; centre?: ReactNode }) {
  const nombreSieges = sieges.length;
  const table = useRef<HTMLDivElement>(null);
  const proportions = useProportions(table);

  // POURQUOI useMemo : 720 points mesurés à chaque rendu de PartieVue (chaque clic) seraient
  // recalculés pour rien. Le résultat ne change qu'avec le nombre de sièges ou la forme.
  const placesCarrees = useMemo(() => placesSurLeCarre(nombreSieges, proportions), [nombreSieges, proportions]);

  // --nb-sieges : le CSS rétrécit les sièges quand la table se remplit (voir .table dans styles.css).
  const styleTable = { "--nb-sieges": Math.max(nombreSieges, 1) } as CSSProperties;

  return (
    <div className="table" style={styleTable} ref={table}>
      <div className="table-plateau">{centre}</div>

      {sieges.map((siege, index) => {
        // Math.max(..., 1) évite une division par zéro s'il n'y a aucun siège.
        const angle = angleDuTour(index / Math.max(nombreSieges, 1));
        const carre = placesCarrees[index];
        // CONCEPT : React accepte les variables CSS (« --nom ») dans style, mais le type
        // CSSProperties ne les connaît pas : le « as » le rassure.
        const position = {
          "--cos": Math.cos(angle).toFixed(4),
          "--sin": Math.sin(angle).toFixed(4),
          "--x-carre": carre.x.toFixed(4),
          "--y-carre": carre.y.toFixed(4)
        } as CSSProperties;

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
