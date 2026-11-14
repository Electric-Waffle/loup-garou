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
 *   - aberration : éclipse, déchirures violettes dans le ciel, le temple flotte puis disparaît.
 * PATTERN : toute l'animation est en CSS (styles.css, section « Cadran ») ; le composant ne fait
 * que choisir les classes. Il ne touche jamais à la partie.
 */

export type FinCadran = "loups" | "village" | "skinwalker" | "fou" | "aberration";
export const FINS_CADRAN: FinCadran[] = ["loups", "village", "skinwalker", "fou", "aberration"];

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
/** En fin de partie : la nuit pour les loups et le fou, le plein jour pour les autres. */
const ANGLES_FIN: Record<FinCadran, number> = { loups: 180, fou: 180, village: 0, skinwalker: 0, aberration: 0 };

/**
 * Traduit le texte du vainqueur (partie.vainqueur, écrit par victoire.ts) en animation de fin.
 * Les amoureux, ou un village désert, n'ont pas d'animation : undefined.
 * ATTENTION : on lit le DÉBUT du texte. Si victoire.ts change ses phrases, cadran.test.ts le signalera.
 */
export function finDuCadran(vainqueur: string | undefined): FinCadran | undefined {
  if (!vainqueur) return undefined;
  if (vainqueur.startsWith("Les loups")) return "loups";
  if (vainqueur.startsWith("Le village")) return "village";
  if (vainqueur.startsWith("Le skinwalker")) return "skinwalker";
  if (vainqueur.startsWith("Le fou")) return "fou";
  if (vainqueur.startsWith("L'aberration")) return "aberration";
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
  fou: { titre: "Hécatombe", faux: { titre: "Lune de Sang", camp: "loups", revele: () => 6 } },
  skinwalker: { titre: "Festin", faux: { titre: "Gloire", camp: "village", revele: revelationSkinwalker } }
};

/**
 * Sous l'horizon, en fin de partie : le titre de la fin, et le camp vainqueur sur une pancarte
 * qui déborde sur le bas de la table (son fond uni rend le texte lisible sur les rayons gravés).
 * Pour une fin sans animation (amoureux, village désert), on écrit le texte du vainqueur tel quel.
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
  const camp = LIBELLES_CAMPS[fin];
  return (
    <div className={`table-centre table-centre-partie titre-fin ${faux ? "avec-bascule" : ""}`}
      style={faux ? ({ "--revele": `${faux.revele(positionsFetards(survivants)).toFixed(2)}s` } as CSSProperties) : undefined}>
      <span className="table-titre titre-fin-nom">
        {faux && <span className="faux">{faux.titre}</span>}
        <span className="vrai">{titre}</span>
      </span>
      <span className="pancarte">
        {faux && <span className="faux">{LIBELLES_CAMPS[faux.camp]}</span>}
        <span className="vrai">{camp}</span>
      </span>
    </div>
  );
}

/**
 * @param fin     l'animation de fin à jouer (seulement quand phase = "fin")
 * @param rejouer un numéro qui change à chaque demande : il relance les animations (boutons de test)
 * @param survivants le nombre de joueurs vivants : autant de villageois en fête
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
