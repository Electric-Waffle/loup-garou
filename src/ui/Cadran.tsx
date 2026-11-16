import { useRef, type CSSProperties } from "react";
import type { Phase } from "../moteur/types";
import { LIBELLES_CAMPS } from "./libelles";

/**
 * Le cadran du jour, en haut de la table, façon horloge de Minecraft.
 *
 * CONCEPT : la fenêtre est un demi-disque (le ciel au-dessus de l'horizon). Derrière, un disque
 * entier tourne : une moitié de jour avec le soleil, une moitié de nuit avec la lune, à l'opposé.
 * On ne voit que la moitié haute : en tournant, le soleil se lève à gauche, passe en haut, se couche
 * à droite, et la lune monte à sa place. Devant : les montagnes et un temple (un dessin SVG fixe).
 *
 * En fin de partie, le cadran raconte qui a gagné (classe CSS « cadran-fin-… ») :
 *   - loups      : lune de sang, le temple s'écroule ;
 *   - village    : soleil aux rayons tournants, temple doré, villageois qui sautent de joie ;
 *   - skinwalker : comme le village, mais les villageois disparaissent et le temple brûle ;
 *   - fou        : comme les loups, mais un œil à la place de la lune, et les ruines saignent ;
 *   - aberration : éclipse, déchirures violettes dans le ciel, le temple flotte puis disparaît ;
 *   - amoureux   : le soleil devient un cœur qui bat, le ciel et le temple rosissent, et les
 *                  amoureux encore vivants sautent de joie (un point chacun) ;
 *   - batisseur  : victoire du village par les maisons renforcées. Des murailles sortent de terre
 *                  autour du temple, un donjon pousse à son sommet, les torches s'allument sur les
 *                  remparts et les arbalètes tirent.
 * PATTERN : toute l'animation est en CSS (styles.css, section « Cadran ») ; le composant ne fait
 * que choisir les classes. Il ne touche jamais à la partie.
 */

/**
 * Les fins animées. Ce sont les camps du moteur (Camp), plus deux fins qui n'en sont pas :
 *   - « amoureux » : les amoureux ne sont pas un camp (un joueur garde sa carte) ;
 *   - « batisseur » : c'est le camp du village qui gagne, mais par une autre voie (le chantier).
 */
export type FinCadran = "loups" | "village" | "skinwalker" | "fou" | "aberration" | "amoureux" | "batisseur";
export const FINS_CADRAN: FinCadran[] = ["loups", "village", "batisseur", "skinwalker", "fou", "aberration", "amoureux"];

/**
 * Ce qu'écrit la pancarte pour chaque fin.
 * POURQUOI pas LIBELLES_CAMPS directement, comme avant : « amoureux » n'est pas un Camp, et le
 * Record<Camp, …> de libelles.ts ne le connaît pas. On reprend les libellés des camps, et on ajoute le sien.
 */
const LIBELLES_FINS: Record<FinCadran, string> = {
  loups: LIBELLES_CAMPS.loups,
  village: LIBELLES_CAMPS.village,
  skinwalker: LIBELLES_CAMPS.skinwalker,
  fou: LIBELLES_CAMPS.fou,
  aberration: LIBELLES_CAMPS.aberration,
  amoureux: "Amoureux",
  batisseur: LIBELLES_CAMPS.village // une victoire du camp du village
};

/** Le cœur qui remplace le soleil (fin des amoureux), dessiné dans un carré de 32 × 29. */
const COEUR = "M16 29C16 29 0 18.5 0 8.5 0 3.5 4 0 8.5 0 12 0 14.5 2 16 4.5 17.5 2 20 0 23.5 0 28 0 32 3.5 32 8.5 32 18.5 16 29 16 29Z";

/** Angle du disque pour chaque phase (0° = soleil tout en haut, 180° = lune tout en haut). */
const ANGLES: Partial<Record<Phase, number>> = {
  aube: -70,          // soleil à gauche, juste au-dessus des montagnes
  election: -50,
  evenement: -35,
  debat: 0,           // soleil au zénith
  vote: 35,
  resultat_vote: 70,  // soleil à droite
  nuit: 180           // soleil caché sous l'horizon, lune en haut
};
/**
 * En fin de partie : la nuit pour les loups et le fou, le plein jour pour les autres.
 * Amoureux : plein jour, pour que le cœur prenne la place du soleil, tout en haut.
 */
const ANGLES_FIN: Record<FinCadran, number> = { loups: 180, fou: 180, village: 0, skinwalker: 0, aberration: 0, amoureux: 0, batisseur: 0 };

/**
 * Traduit le texte du vainqueur (partie.vainqueur, écrit par victoire.ts) en animation de fin.
 * Un village désert n'a pas d'animation : undefined.
 * ATTENTION : on lit le DÉBUT du texte. Si victoire.ts change ses phrases, cadran.test.ts le signalera.
 */
export function finDuCadran(vainqueur: string | undefined): FinCadran | undefined {
  if (!vainqueur) return undefined;
  if (vainqueur.startsWith("Les loups")) return "loups";
  // Le village gagne de deux façons : plus de loup (« Le village »), ou le chantier du Bâtisseur
  // (« Le village (toutes les maisons sont renforcées) »). La raison entre parenthèses les distingue.
  if (vainqueur.startsWith("Le village")) return vainqueur.includes("maisons sont renforcées") ? "batisseur" : "village";
  if (vainqueur.startsWith("Le skinwalker")) return "skinwalker";
  if (vainqueur.startsWith("Le fou")) return "fou";
  if (vainqueur.startsWith("L'aberration")) return "aberration";
  if (vainqueur.startsWith("Les amoureux")) return "amoureux";
  return undefined;
}

/**
 * Le prochain angle à afficher : l'angle de la phase, atteint par le plus court chemin.
 * POURQUOI garder un angle cumulé (au lieu de l'angle de la phase tel quel) : la transition CSS
 * anime de l'ancienne valeur à la nouvelle. Pour passer de la nuit (180°) à l'aube (-70°), elle
 * reculerait de 250°, le soleil repartirait en arrière ; en visant 290° (≡ -70°), il avance de 110°.
 */
export function prochainAngle(actuel: number, cible: number): number {
  const ecart = ((((cible - actuel) % 360) + 540) % 360) - 180; // entre -180 et 180
  return actuel + ecart;
}

/**
 * Les déchirures du ciel (aberration), dans le dessin de 200 × 100 :
 * 3 premières (vague 1), 5 suivantes qui se ramifient (vague 2), puis 3 qui partent du temple (vague 3).
 */
const DECHIRURES = [
  "M28,8 L37,20 L31,29 L43,42 L38,52",
  "M152,6 L145,19 L154,28 L147,41",
  "M96,2 L103,12 L95,20 L102,27",
  "M37,20 L48,17 L56,24 L66,21",
  "M145,19 L134,25 L127,22 L118,30",
  "M62,3 L67,13 L60,22 L68,33 L63,41",
  "M180,12 L171,25 L182,35 L175,49",
  "M6,28 L17,35 L11,46 L22,58",
  "M100,48 L87,55 L94,63 L78,72 L84,82",
  "M100,48 L113,57 L106,65 L122,73 L115,84",
  "M100,48 L101,36 L95,30 L102,27"
];

/**
 * Les villageois en fête : un point par survivant, au pied du temple (x dans le dessin de 200 × 100).
 * La moitié à gauche du temple (une de plus si le nombre est impair), le reste à droite, à intervalles
 * réguliers. Le premier est toujours en x = 26 : c'est là que l'intrus du skinwalker commence.
 * ATTENTION : le temple occupe x = 72 à 128 ; les deux zones s'arrêtent avant (64) et reprennent après (136).
 */
export function positionsFetards(survivants: number): number[] {
  const aGauche = Math.ceil(survivants / 2);
  const repartir = (nombre: number, debut: number, fin: number) =>
    Array.from({ length: nombre }, (_, k) => (nombre === 1 ? debut : debut + ((fin - debut) * k) / (nombre - 1)));
  return [...repartir(aGauche, 26, 64), ...repartir(survivants - aGauche, 136, 174)];
}

/*
 * Fin du skinwalker : le point le plus à gauche (x = 26) est l'intrus. Il fait la fête avec les
 * autres, puis, à DEPART_INTRUS, il se met à marcher vers la droite à VITESSE_INTRUS. Chaque villageois
 * qu'il croise s'arrête de sauter et disparaît ; le temple prend feu quand il l'atteint.
 * PATTERN : tous les instants se calculent ici, avec une seule fonction (passage), et partent dans le
 * CSS par des variables (--passage, --sauts, --feu). Si tu changes la vitesse, tout suit.
 * ATTENTION : seule l'animation « traverser » (styles.css) a ses étapes écrites à la main ; elles
 * reprennent ces mêmes nombres (départ 5,6 s de x = 26, arrêt en x = 180, vitesse 25).
 */
const DEPART_INTRUS = 5.6;  // secondes après le début de la fin
const VITESSE_INTRUS = 25;  // unités du dessin par seconde
const DUREE_SAUT = 0.45;    // un aller (ou un retour) de l'animation « sauter »
const X_INTRUS = 26;        // le premier de positionsFetards()
const X_TEMPLE = 72;        // le bord gauche du temple : il prend feu quand l'intrus y arrive
/** L'instant où l'intrus passe à l'abscisse x. */
const passage = (x: number) => DEPART_INTRUS + (x - X_INTRUS) / VITESSE_INTRUS;
/**
 * Fin du skinwalker : l'instant où l'on comprend. Au premier villageois qui disparaît… ou, s'il n'y
 * a personne entre l'intrus et le temple (un ou deux survivants), quand le temple prend feu.
 */
const revelationSkinwalker = (fetards: number[]) => passage(Math.min(fetards[1] ?? X_TEMPLE, X_TEMPLE)) + 0.15;

/** Les variables CSS d'un fêtard : sa place (--i), et pour la fin du skinwalker, quand il s'éteint. */
function styleFetard(x: number, i: number): CSSProperties {
  const finDesSauts = i === 0 ? DEPART_INTRUS : passage(x);
  // Un nombre PAIR de demi-sauts : avec « alternate », le dernier se termine au sol.
  const sauts = 2 * Math.floor((finDesSauts - i * 0.07) / DUREE_SAUT / 2);
  return { "--i": i, "--passage": `${passage(x).toFixed(2)}s`, "--sauts": sauts } as CSSProperties;
}

/**
 * Le titre de chaque fin, et le camp écrit sur la pancarte.
 * Pour le fou et le skinwalker, on montre d'abord la fausse victoire (`faux` : celle des loups ou du
 * village), puis on bascule vers la vraie à l'instant `revele` (en secondes, selon les fêtards),
 * synchronisé avec l'animation : l'œil qui remplace la lune, ou le premier villageois qui disparaît.
 */
type Bascule = { titre: string; camp: FinCadran; revele: (fetards: number[]) => number };
const TITRES_FIN: Record<FinCadran, { titre: string; faux?: Bascule }> = {
  loups: { titre: "Lune de Sang" },
  village: { titre: "Gloire" },
  aberration: { titre: "Fracture" },
  amoureux: { titre: "Idylle" },
  batisseur: { titre: "Siège" },
  fou: { titre: "Hécatombe", faux: { titre: "Lune de Sang", camp: "loups", revele: () => 6 } },
  skinwalker: { titre: "Festin", faux: { titre: "Gloire", camp: "village", revele: revelationSkinwalker } }
};

/**
 * Sous l'horizon, en fin de partie : le titre de la fin, et le camp vainqueur sur une pancarte
 * qui déborde sur le bas de la table (son fond uni rend le texte lisible sur les rayons gravés).
 * Pour une fin sans animation (village désert), on écrit le texte du vainqueur tel quel.
 * PATTERN : la bascule fausse → vraie victoire est un fondu CSS entre deux textes superposés.
 * Les deux sont dans la page dès le départ ; seul le moment où chacun se montre change.
 */
export function TitreDeFin({ fin, vainqueur, survivants }: { fin?: FinCadran; vainqueur?: string; survivants: number }) {
  if (!fin) {
    return (
      <div className="table-centre table-centre-partie titre-fin">
        <span className="table-titre titre-fin-nom">Fin de partie</span>
        {vainqueur && <span className="pancarte">{vainqueur}</span>}
      </div>
    );
  }
  const { titre, faux } = TITRES_FIN[fin];
  const camp = LIBELLES_FINS[fin];
  return (
    <div className={`table-centre table-centre-partie titre-fin ${faux ? "avec-bascule" : ""}`}
      style={faux ? ({ "--revele": `${faux.revele(positionsFetards(survivants)).toFixed(2)}s` } as CSSProperties) : undefined}>
      <span className="table-titre titre-fin-nom">
        {faux && <span className="faux">{faux.titre}</span>}
        <span className="vrai">{titre}</span>
      </span>
      <span className="pancarte">
        {faux && <span className="faux">{LIBELLES_FINS[faux.camp]}</span>}
        <span className="vrai">{camp}</span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------------------
 *  Fin du Bâtisseur : les remparts
 *  Repères du dessin (200 × 100, l'horizon en bas) : le temple occupe x = 72 à 128, son sanctuaire
 *  le haut (x = 94 à 106, y = 65 à 73), et le sol est en y = 97.
 *  POURQUOI tout calculer depuis le côté gauche : le décor est symétrique. miroir() donne la
 *  position du même élément à droite ; une retouche à gauche se reporte toute seule.
 *  POURQUOI pas un attribut transform="scale(-1 1)" pour retourner le côté droit : styles.css anime
 *  la propriété CSS transform de ces éléments, qui remplacerait l'attribut. Des coordonnées
 *  calculées n'ont pas ce conflit.
 * ------------------------------------------------------------------------------------- */

/** La position x, à droite, d'un élément de largeur `largeur` placé en x à gauche. */
const miroir = (x: number, largeur: number) => 200 - x - largeur;

/** Les murailles : du pied de la tour d'angle jusqu'au temple. */
const MUR = { x: 51, y: 86, largeur: 21, hauteur: 11 };
/** Les tours d'angle, au bout des murailles. */
const TOUR = { x: 42, y: 79, largeur: 10, hauteur: 18 };
/** Un créneau (merlon) : le petit bloc qui dépasse en haut d'un mur. */
const CRENEAU = { largeur: 2.2, hauteur: 2.4 };

/**
 * Les x des créneaux posés sur un mur de x à x + largeur, espacés régulièrement.
 * Ex. creneaux(51, 21) → [51, 55.7, 60.4, 65.1, 69.8] : le premier au bord gauche, le dernier au bord droit.
 */
function creneaux(x: number, largeur: number, nombre: number): number[] {
  const pas = (largeur - CRENEAU.largeur) / (nombre - 1);
  return Array.from({ length: nombre }, (_, k) => x + k * pas);
}

/** Les torches, plantées sur le chemin de ronde des murailles (x à gauche ; la droite en miroir). */
const TORCHES = [61, 68];
/** Les arbalètes : une sur la tour d'angle, une sur la muraille, de chaque côté. */
const ARBALETES = [{ x: 47, y: 73.5 }, { x: 55, y: 81 }];

/**
 * Un pan de muraille, ou une tour, avec ses créneaux. Les deux ne diffèrent que par leurs
 * dimensions et leur nombre de créneaux.
 */
function MurCrenele({ x, y, largeur, hauteur, nombreDeCreneaux }: { x: number; y: number; largeur: number; hauteur: number; nombreDeCreneaux: number }) {
  return (
    <>
      <rect className="rempart-pierre" x={x} y={y} width={largeur} height={hauteur} />
      {creneaux(x, largeur, nombreDeCreneaux).map(xCreneau => (
        <rect key={xCreneau} className="rempart-pierre" x={xCreneau} y={y - CRENEAU.hauteur} width={CRENEAU.largeur} height={CRENEAU.hauteur} />
      ))}
    </>
  );
}

/**
 * Une arbalète vue de profil, tournée vers l'extérieur.
 * @param sens -1 = elle vise la gauche, 1 = la droite. Chaque abscisse est écrite « cx + sens × écart » :
 *             le même dessin, retourné pour l'autre côté.
 * @param i    son numéro : les tirs se décalent (styles.css, --i), elles ne tirent pas toutes ensemble.
 */
function Arbalete({ cx, cy, sens, i }: { cx: number; cy: number; sens: number; i: number }) {
  const x = (ecart: number) => cx + sens * ecart;
  return (
    <g className="arbalete" style={{ "--i": i, "--sens": sens } as CSSProperties}>
      <path className="arbalete-crosse" d={`M${x(-3)},${cy} L${x(2.5)},${cy}`} />
      <path className="arbalete-arc" d={`M${x(2)},${cy - 3} Q${x(4)},${cy} ${x(2)},${cy + 3}`} />
      <path className="arbalete-corde" d={`M${x(2)},${cy - 3} L${x(0.5)},${cy} L${x(2)},${cy + 3}`} />
      {/* Le carreau (la flèche de l'arbalète) : c'est lui qui part, en boucle. */}
      <path className="carreau" d={`M${x(1)},${cy} L${x(4.5)},${cy}`} />
    </g>
  );
}

/** Une torche : un manche planté sur le rempart et une flamme qui vacille. */
function Torche({ x, i }: { x: number; i: number }) {
  return (
    <g style={{ "--i": i } as CSSProperties}>
      <rect className="torche-manche" x={x - 0.45} y={81} width={0.9} height={5} />
      <path className="torche-flamme" d={`M${x},81 C${x - 1.6},79 ${x - 0.6},77.5 ${x},76.3 C${x + 0.6},77.5 ${x + 1.6},79 ${x},81 Z`} />
    </g>
  );
}

/**
 * Tout le décor de la fin du Bâtisseur, caché tant que cette fin ne joue pas.
 * FLUX (styles.css) : les murailles sortent de terre, puis les tours d'angle, puis le donjon pousse
 * au sommet du temple ; les torches s'allument une à une, et les arbalètes se mettent à tirer.
 */
function Remparts() {
  const torches = [...TORCHES, ...TORCHES.map(x => miroir(x, 0))];
  const arbaletes = [
    ...ARBALETES.map(a => ({ ...a, sens: -1 })),
    ...ARBALETES.map(a => ({ x: miroir(a.x, 0), y: a.y, sens: 1 }))
  ];
  return (
    <g className="remparts">
      <g className="muraille">
        <MurCrenele {...MUR} nombreDeCreneaux={5} />
        <MurCrenele {...MUR} x={miroir(MUR.x, MUR.largeur)} nombreDeCreneaux={5} />
      </g>
      <g className="tours-angle">
        <MurCrenele {...TOUR} nombreDeCreneaux={3} />
        <MurCrenele {...TOUR} x={miroir(TOUR.x, TOUR.largeur)} nombreDeCreneaux={3} />
        {/* Les meurtrières des tours. */}
        <rect className="meurtriere" x={TOUR.x + 4.4} y={85} width={1.2} height={4} />
        <rect className="meurtriere" x={miroir(TOUR.x + 4.4, 1.2)} y={85} width={1.2} height={4} />
      </g>
      {/* Le donjon, posé sur le sanctuaire du temple, et son fanion aux couleurs du village. */}
      <g className="donjon">
        <MurCrenele x={92} y={49} largeur={16} hauteur={17} nombreDeCreneaux={5} />
        <rect className="meurtriere" x={99.3} y={54} width={1.4} height={4.5} />
        <path className="donjon-hampe" d="M100,46.6 L100,37" />
        <path className="fanion" d="M100.4,37 L108,39.2 L100.4,41.4 Z" />
      </g>
      <g className="torches">
        {torches.map((x, i) => <Torche key={x} x={x} i={i} />)}
      </g>
      <g className="arbaletes">
        {arbaletes.map((a, i) => <Arbalete key={`${a.x}-${a.y}`} cx={a.x} cy={a.y} sens={a.sens} i={i} />)}
      </g>
    </g>
  );
}

/**
 * @param fin     l'animation de fin à jouer (seulement quand phase = "fin")
 * @param rejouer un numéro qui change à chaque demande : il relance les animations (boutons de test)
 * @param survivants le nombre de points en fête au pied du temple : les joueurs vivants (village,
 *                   skinwalker), ou les amoureux vivants (fin des amoureux) ; PartieVue choisit
 */
export function Cadran({ phase, fin, rejouer = 0, survivants }: { phase: Phase; fin?: FinCadran; rejouer?: number; survivants: number }) {
  // ATTENTION : on modifie la ref pendant le rendu. C'est sans danger ici, car le calcul est
  // idempotent : refait une 2e fois (StrictMode), il trouve un écart nul et ne change rien.
  const angle = useRef<number | null>(null);
  const finAffichee = phase === "fin" ? fin : undefined;
  const cible = finAffichee ? ANGLES_FIN[finAffichee] : ANGLES[phase];
  if (cible !== undefined) {
    angle.current = angle.current === null ? cible : prochainAngle(angle.current, cible);
  }

  return (
    <div className={`cadran ${finAffichee ? `cadran-fin-${finAffichee}` : ""}`} aria-hidden="true">
      <div className="cadran-disque" style={{ transform: `rotate(${angle.current ?? 180}deg)` }}>
        <span className="cadran-rayons" />
        <span className="cadran-soleil" />
        <span className="cadran-lune" />
        <span className="cadran-oeil" />
        {/* Le cœur des amoureux, posé à la place du soleil : caché, il attend sa fin.
            POURQUOI un SVG et pas un dégradé CSS comme le soleil : un cœur ne se dessine pas avec
            des cercles, et un SVG garde un contour net à toutes les tailles. */}
        <svg className="cadran-coeur" viewBox="0 0 32 29"><path d={COEUR} /></svg>
      </div>
      <div className="cadran-voile" />

      {/* CONCEPT : la prop key. Quand elle change, React jette l'ancien dessin et en crée un neuf :
          les animations CSS repartent de zéro (utile pour rejouer une fin avec les boutons de test). */}
      <svg key={`paysage-${finAffichee}-${rejouer}`} className="cadran-paysage" viewBox="0 0 200 100" preserveAspectRatio="none">
        {/* Les déchirures de l'aberration, en trois vagues (voir styles.css).
            pathLength={1} : quelle que soit sa vraie longueur, chaque trait « mesure » 1 ; l'animation
            qui le dessine (stroke-dashoffset de 1 à 0) marche donc pour tous. */}
        <g className="dechirures">
          {DECHIRURES.map((d, i) => (
            <path key={d} className={`vague-${i < 3 ? 1 : i < 8 ? 2 : 3}`} d={d} pathLength={1} />
          ))}
          {/* Le trou dans la réalité, là où était le temple. */}
          <polygon className="trou" points="88,52 97,40 104,44 112,38 109,53 116,62 101,60 92,66" />
        </g>
        <polygon className="montagnes" points="0,100 0,91 20,86 36,92 58,83 80,91 104,86 126,94 148,85 172,92 200,88 200,100" />

        {/* Le temple à degrés : quatre étages, l'escalier, le sanctuaire et sa porte. */}
        <g className="temple-intact">
          <rect className="temple-pierre" x="72" y="91" width="56" height="6" />
          <rect className="temple-pierre" x="78" y="85" width="44" height="6" />
          <rect className="temple-pierre" x="84" y="79" width="32" height="6" />
          <rect className="temple-pierre" x="90" y="73" width="20" height="6" />
          <rect className="temple-pierre" x="94" y="65" width="12" height="8" />
          <rect className="temple-escalier" x="97" y="73" width="6" height="24" />
          <rect className="temple-porte" x="98" y="68" width="4" height="5" />
        </g>
        {/* Après le temple : le donjon doit être dessiné PAR-DESSUS son sommet. */}
        <Remparts />
        <g className="temple-ruines">
          <polygon className="temple-pierre" points="72,97 128,97 128,91 121,91 117,86 109,89 101,84 93,88 86,85 80,91 72,91" />
          <rect className="temple-pierre" x="56" y="92" width="7" height="4" transform="rotate(18 59 94)" />
          <rect className="temple-pierre" x="136" y="91" width="6" height="4" transform="rotate(-14 139 93)" />
          <rect className="temple-pierre" x="131" y="94" width="4" height="3" />
        </g>
        <g className="temple-sang">
          <polygon points="80,91 86,85 93,88 101,84 109,89 117,86 121,91 116,92 108,91 100,90 92,92 84,92" />
          <rect className="goutte" x="86" y="88" width="1.6" height="7" />
          <rect className="goutte" x="101" y="87" width="1.6" height="9" />
          <rect className="goutte" x="116" y="89" width="1.6" height="6" />
        </g>
        {/* Le feu prend quand l'intrus atteint le bord gauche du temple (x = 72). */}
        <g className="flammes" style={{ "--feu": `${passage(X_TEMPLE).toFixed(2)}s` } as CSSProperties}>
          {[88, 100, 112].map((x, i) => (
            <g key={x} className="flamme" style={{ "--i": i } as CSSProperties}>
              <path className="flamme-dehors" d={`M${x},80 C${x - 6},72 ${x - 2},64 ${x},56 C${x + 2},64 ${x + 6},72 ${x},80 Z`} />
              <path className="flamme-dedans" d={`M${x},80 C${x - 3},75 ${x - 1},70 ${x},65 C${x + 1},70 ${x + 3},75 ${x},80 Z`} />
            </g>
          ))}
        </g>
        <g className="fetards">
          {positionsFetards(survivants).map((x, i) => (
            <circle key={x} className={i === 0 ? "fetard fetard-intrus" : "fetard"} cx={x} cy="95" r="2.6" style={styleFetard(x, i)} />
          ))}
        </g>
      </svg>
      {/* Le « temps arrêté » de l'aberration : un calque qui inverse les couleurs de tout ce qu'il
          recouvre (backdrop-filter). Même key que le dessin : il repart de zéro à chaque fin rejouée. */}
      <div key={`negatif-${finAffichee}-${rejouer}`} className="cadran-negatif" />
    </div>
  );
}
