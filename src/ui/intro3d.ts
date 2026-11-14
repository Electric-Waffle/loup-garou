/* =====================================================================================
 *  intro3d.ts — la cinématique d'ouverture, en 3D (three.js)
 * =====================================================================================
 *
 *  FLUX (les secondes sont dans T, plus bas) :
 *    1. 0 → 6 s       : nuit, dix villageois assis autour du feu. La caméra descend du ciel, se glisse
 *                       entre deux d'entre eux et s'arrête au centre du cercle, près du feu.
 *    2. 6 → 15 s      : panorama : la caméra fait un tour complet et passe chaque joueur en revue.
 *                       Pendant ce temps, l'oracle (grand, bâton à la main) fait le tour du cercle
 *                       par l'extérieur ; la caméra le rattrape quand il arrive à sa place.
 *    3. 15 → 17 s     : il monte sur son estrade et s'assoit. Les villageois se tournent vers lui.
 *    4. 17 → 21,7 s   : la caméra s'approche de son œil blanc, aveugle. Un reflet y apparaît : les MÊMES
 *                       villageois, sous l'apparence de leur rôle. Plongée dans l'œil, clignement.
 *    5. 21,7 → 30,7 s : de l'autre côté, avec les yeux de l'oracle : on regarde devant, à gauche,
 *                       à droite ; les rôles tournent la tête vers nous.
 *    6. 30 → 37 s     : Inti se lève entre deux pics, « PAQARI » s'écrit lettre par lettre.
 *    7. 37 → 41,5 s   : tout s'éteint sauf le titre, seul sur fond noir ; puis fondu vers le site.
 *
 *  Autour de la place : des maisons incas (dont des maisons renforcées), des arbres, des temples.
 *
 *  PATTERN : deux scènes jumelles (village et rôles) construites par les mêmes fonctions.
 *  POURQUOI : le reflet de l'œil est un vrai rendu de la scène des rôles (render target), filmé
 *  depuis la place de l'oracle. Quand la caméra « entre » dans l'œil, on montre la même scène
 *  depuis le même point de vue : le raccord est invisible.
 *
 *  CONCEPT : tout est fabriqué avec des formes simples (cylindres, cônes, sphères), sans modèle
 *  3D à télécharger : le jeu reste léger et marche hors ligne.
 * ===================================================================================== */

import * as THREE from "three";

/** Le minutage de la cinématique, en secondes. */
const T = {
  descente: 6,   // la caméra arrive au centre du cercle
  panorama: 15,  // fin du tour de caméra ; l'oracle arrive derrière son estrade
  estrade: 16,   // il est monté sur l'estrade…
  assis: 17,     // …et assis : la caméra peut s'approcher de son œil
  oeil: 20.5,    // gros plan sur l'œil, le reflet est net
  entree: 21.7,  // plongée dans l'œil et clignement
  aube: 30,
  titre: 33,
  noir: 37,      // le décor s'éteint, le titre reste seul sur fond noir…
  fin: 41.5      // …pendant 2 secondes, puis fondu vers le site
};
/** L'oracle commence à marcher un peu après le début : on le voit partir. */
const DEPART_ORACLE = 0.5;
const TAILLE_ORACLE = 1.5;                // les villageois sont à l'échelle 1
const ANGLE_ORACLE = -Math.PI / 2;        // sa place est côté -z
const RAYON_MARCHE = 5.4;                 // il tourne derrière les villageois (assis à 3,2) et derrière l'estrade
const PLACE_ORACLE = new THREE.Vector3(0, 0.5, -4.4); // le dessus de l'estrade

/** 0 avant a, 1 après b, une courbe douce entre les deux (accélère puis freine). */
function lisse(a: number, b: number, t: number): number {
  const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}

type Costume =
  | "loup" | "chasseur" | "conquistador" | "sorciere" | "pretre"
  | "voyante" | "skinwalker" | "cupidon" | "fou" | null;

/** Les rôles des 10 places. Les places 3 à 6 sont en face de l'oracle : ce sont elles qu'on voit le mieux. */
const COSTUMES: Costume[] = [
  "loup", "chasseur", "conquistador", "sorciere", "loup", "pretre", "voyante", "skinwalker", "cupidon", "fou"
];
const PONCHOS = ["#b5322a", "#2f6f62", "#d98a2b", "#6b3a7a", "#8a5a2b", "#1f4e79", "#c0582f", "#4d6b2f", "#a8324e", "#3d7a8c"];
const PEAUX = ["#a9714b", "#8d5f3e", "#b98058"];
const FEU = new THREE.Vector3(0, 0.5, 0);
const FOND_APPLI = "#17100b"; // la couleur de fond du site : le fondu final y mène sans à-coup

/* -------------------------------------------------------------------------------------
 *  Petits outils
 * ------------------------------------------------------------------------------------- */

const mat = (couleur: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.85, ...extra });
/** Matière qui brille toute seule : elle ignore les lumières de la scène. */
const lum = (couleur: string) => new THREE.MeshBasicMaterial({ color: couleur });

function forme(geometrie: THREE.BufferGeometry, matiere: THREE.Material, x = 0, y = 0, z = 0) {
  const maillage = new THREE.Mesh(geometrie, matiere);
  maillage.position.set(x, y, z);
  return maillage;
}

/** Une texture de halo : un dégradé radial blanc → transparent, dessiné dans un canvas. */
function texteHalo(): THREE.CanvasTexture {
  const toile = document.createElement("canvas");
  toile.width = toile.height = 128;
  const ctx = toile.getContext("2d")!;
  const degrade = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  degrade.addColorStop(0, "rgba(255,255,255,1)");
  degrade.addColorStop(0.3, "rgba(255,255,255,0.35)");
  degrade.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(toile);
}

/** Un halo lumineux (lune, soleil, feu) : une image plate toujours tournée vers la caméra. */
function halo(texture: THREE.Texture, couleur: THREE.ColorRepresentation, taille: number) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, color: couleur, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  }));
  sprite.scale.setScalar(taille);
  return sprite;
}

/* -------------------------------------------------------------------------------------
 *  Les personnages (assis en tailleur, face au feu)
 * ------------------------------------------------------------------------------------- */

/*
 *  Les apparences s'inspirent des illustrations de docs/pictures : bandeau de jade, labret (bijou
 *  sous la lèvre), boucles d'oreilles, tresses ; capuche de cuir du Chasseur, chapeau et fioles de
 *  la Sorcière, turban et troisième œil de la Voyante, mannequin blanc du Skinwalker, lunettes en
 *  cœur de Cupidon, peau de loup sur la tête du Fou, casque à plumet du Conquistador.
 */
function personnage(i: number, costume: Costume) {
  const corps = new THREE.Group();
  const loup = costume === "loup", blanc = costume === "skinwalker", soldat = costume === "conquistador";
  const tissu = blanc ? mat("#e9e8e4", { roughness: 0.45 })
    : loup ? mat("#4a4038")
    : soldat ? mat("#9aa0a8", { metalness: 0.8, roughness: 0.35 })
    : costume === "fou" ? mat("#5a4632")
    : costume === "cupidon" ? mat("#efe6cf")
    : mat(PONCHOS[i]);
  const peau = blanc ? tissu : mat(loup ? "#5a5048" : PEAUX[i % PEAUX.length]);

  // Jambes croisées (une sphère aplatie), buste, bande du poncho, bras posés sur les genoux.
  const jambes = forme(new THREE.SphereGeometry(0.36, 16, 10), tissu, 0, 0.13, 0.05);
  jambes.scale.y = 0.4;
  corps.add(jambes, forme(new THREE.CylinderGeometry(0.13, 0.32, 0.62, 12), tissu, 0, 0.47));
  if (!loup && !blanc && !soldat && costume !== "cupidon") {
    corps.add(forme(new THREE.CylinderGeometry(0.235, 0.255, 0.06, 12), mat("#e2a93b"), 0, 0.42));
  }
  for (const cote of [-1, 1]) {
    const bras = forme(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), tissu, cote * 0.22, 0.44, 0.16);
    bras.rotation.set(-0.9, 0, cote * 0.25);
    corps.add(bras, forme(new THREE.SphereGeometry(0.055, 10, 8), peau, cote * 0.17, 0.28, 0.33));
  }

  // La tête est un groupe à part : on la tourne seule (bavardage, puis regard vers la caméra).
  const tete = new THREE.Group();
  tete.position.y = 0.93;
  tete.add(forme(new THREE.SphereGeometry(0.17, 20, 16), peau));
  if (!loup && !blanc) {
    tete.add(forme(new THREE.SphereGeometry(0.022, 10, 8), peau, 0, -0.02, 0.165));
  }
  if (!blanc) { // le Skinwalker n'a pas d'yeux : un visage lisse, juste un sourire
    const yeux = loup ? lum("#f0b030") : mat("#120c08", { roughness: 0.3 });
    for (const x of [-0.06, 0.06]) tete.add(forme(new THREE.SphereGeometry(0.022, 8, 6), yeux, x, 0.03, 0.152));
  }
  corps.add(tete);

  /** Une calotte de sphère basculée vers l'arrière : elle couvre le crâne et dégage le visage. */
  const cheveux = (couleur: string, rayon = 0.18) => {
    const calotte = forme(new THREE.SphereGeometry(rayon, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(couleur));
    calotte.rotation.x = -0.55;
    tete.add(calotte);
    return calotte;
  };
  const bandeau = (y = 0.06) =>
    tete.add(forme(new THREE.CylinderGeometry(0.177, 0.177, 0.045, 16), mat("#2f8f6f", { roughness: 0.4 }), 0, y));
  /** La parure commune des cartes : labret et boucles d'oreilles en jade, et (souvent) deux tresses. */
  const parure = (tresses = true) => {
    const jade = mat("#3fae86", { roughness: 0.3 });
    tete.add(forme(new THREE.SphereGeometry(0.018, 8, 6), jade, 0, -0.085, 0.152));
    for (const cote of [-1, 1]) {
      tete.add(forme(new THREE.SphereGeometry(0.02, 8, 6), jade, cote * 0.168, -0.04, 0.01));
      if (tresses) tete.add(forme(new THREE.CapsuleGeometry(0.025, 0.22, 4, 6), mat("#1c120c"), cote * 0.14, -0.16, -0.06));
    }
  };
  /** Un museau de loup (cône pointé vers l'avant) avec sa truffe. */
  const museau = (matiere: THREE.Material, y: number, z: number) => {
    const cone = forme(new THREE.ConeGeometry(0.075, 0.2, 8), matiere, 0, y, z);
    cone.rotation.x = Math.PI / 2; // la pointe du cône (+y) passe vers l'avant (+z)
    tete.add(cone, forme(new THREE.SphereGeometry(0.025, 8, 6), mat("#1a1512"), 0, y, z + 0.1));
  };

  switch (costume) {
    case null: // villageois : bandeau de jade, ou bonnet andin (chullo) pour un sur trois
      cheveux("#1c120c");
      parure();
      if (i % 3 === 0) tete.add(forme(new THREE.ConeGeometry(0.175, 0.26, 10), mat(PONCHOS[(i + 4) % 10]), 0, 0.17, -0.02));
      else bandeau();
      break;
    case "loup": {
      const fourrure = mat("#5a5048");
      for (const x of [-0.1, 0.1]) tete.add(forme(new THREE.ConeGeometry(0.055, 0.17, 4), fourrure, x, 0.18, -0.02));
      museau(fourrure, -0.05, 0.2);
      const bajoues = forme(new THREE.SphereGeometry(0.15, 12, 8), mat("#8a7c6c"), 0, -0.09, 0.05);
      bajoues.scale.set(1.2, 0.6, 0.9);
      tete.add(bajoues);
      break;
    }
    case "chasseur": { // capuche et col de cuir
      const cuir = mat("#5a3b22");
      cheveux("#1c120c");
      const capuche = cheveux("#5a3b22", 0.215);
      capuche.rotation.x = -0.75;
      tete.add(forme(new THREE.TorusGeometry(0.15, 0.06, 8, 16), cuir, 0, -0.17, 0).rotateX(Math.PI / 2));
      parure(false);
      const arc = forme(new THREE.TorusGeometry(0.34, 0.012, 6, 20, Math.PI), mat("#6b4423"), 0, 0.55, -0.24);
      arc.rotation.z = Math.PI / 2;
      corps.add(arc);
      break;
    }
    case "conquistador": {
      const acier = mat("#b9c0c8", { metalness: 0.9, roughness: 0.25 });
      tete.add(forme(new THREE.SphereGeometry(0.185, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), acier, 0, 0.02));
      const bord = forme(new THREE.CylinderGeometry(0.25, 0.25, 0.015, 20), acier, 0, 0.02);
      bord.scale.z = 1.35; // le casque « morion » : un bord allongé devant et derrière
      const crete = forme(new THREE.TorusGeometry(0.185, 0.014, 6, 16, Math.PI), acier, 0, 0.02);
      crete.rotation.y = Math.PI / 2;
      tete.add(bord, crete);
      ["#c0392b", "#e2a93b"].forEach((couleur, k) => { // le plumet
        const plume = forme(new THREE.ConeGeometry(0.03, 0.3, 5), mat(couleur), (k - 0.5) * 0.05, 0.32, -0.12);
        plume.rotation.set(-0.45, 0, (0.5 - k) * 0.5);
        tete.add(plume);
      });
      for (const cote of [-1, 1]) { // la moustache
        const poil = forme(new THREE.CapsuleGeometry(0.013, 0.07, 4, 6), mat("#2a1a10"), cote * 0.04, -0.055, 0.158);
        poil.rotation.z = cote * 1.2;
        tete.add(poil);
      }
      const mousquet = forme(new THREE.CylinderGeometry(0.018, 0.024, 1, 8), mat("#3a2414"), 0, 0.31, 0.36);
      mousquet.rotation.z = Math.PI / 2.2;
      corps.add(mousquet);
      break;
    }
    case "sorciere": { // grand chapeau pointu de cuir, collier de fioles (vie et mort)
      cheveux("#1c120c");
      parure();
      const chapeau = mat("#4a3626");
      tete.add(forme(new THREE.CylinderGeometry(0.3, 0.3, 0.015, 20), chapeau, 0, 0.13));
      const pointe = forme(new THREE.ConeGeometry(0.15, 0.45, 12), chapeau, 0, 0.36, -0.03);
      pointe.rotation.x = -0.15;
      tete.add(pointe);
      corps.add(forme(new THREE.TorusGeometry(0.145, 0.008, 6, 20), mat("#c99a3a"), 0, 0.72, 0.01).rotateX(Math.PI / 2));
      corps.add(forme(new THREE.CapsuleGeometry(0.022, 0.05, 4, 8), lum("#59ff8a"), -0.06, 0.6, 0.2)); // potion de vie
      corps.add(forme(new THREE.CapsuleGeometry(0.022, 0.05, 4, 8), lum("#ff4d5e"), 0.06, 0.6, 0.2));  // potion de mort
      break;
    }
    case "pretre": {
      cheveux("#1c120c");
      parure();
      const or = mat("#e2a93b", { emissive: "#b97a12", emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.4 });
      const disque = forme(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 24), or, 0, 0.05, -0.13);
      disque.rotation.x = Math.PI / 2;
      tete.add(disque);
      for (let k = 0; k < 12; k++) { // les rayons d'Inti autour du disque
        const a = (k / 12) * Math.PI * 2;
        const rayon = forme(new THREE.ConeGeometry(0.03, 0.12, 4), or, Math.cos(a) * 0.35, 0.05 + Math.sin(a) * 0.35, -0.13);
        rayon.rotation.z = a - Math.PI / 2;
        tete.add(rayon);
      }
      break;
    }
    case "voyante": { // turban, bandeau de jade, troisième œil, boule de cristal bleu nuit
      parure();
      tete.add(forme(new THREE.CylinderGeometry(0.2, 0.17, 0.24, 18), mat("#6b4a2e"), 0, 0.21, -0.01));
      bandeau(0.09);
      tete.add(
        forme(new THREE.SphereGeometry(0.02, 10, 8), mat("#f4efe6", { roughness: 0.3 }), 0, 0.062, 0.158),
        forme(new THREE.SphereGeometry(0.009, 8, 6), mat("#120c08"), 0, 0.062, 0.176)
      );
      corps.add(forme(new THREE.SphereGeometry(0.09, 20, 14),
        mat("#1d2f6b", { emissive: "#2f5fd0", emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.2 }), 0, 0.38, 0.36));
      const lueur = new THREE.PointLight("#6f8cff", 3, 3);
      lueur.position.set(0, 0.45, 0.45);
      corps.add(lueur);
      break;
    }
    case "skinwalker": { // un mannequin blanc, lisse, sans yeux, avec un sourire
      const sourire = forme(new THREE.TorusGeometry(0.06, 0.007, 6, 16, Math.PI), mat("#3a3a3a"), 0, -0.035, 0.152);
      sourire.rotation.set(-0.3, 0, Math.PI); // l'arc tourné vers le bas : un U, donc un sourire
      tete.add(sourire);
      break;
    }
    case "cupidon": { // boucles blondes, couronne de fleurs, lunettes en cœur, petites ailes
      bandeau();
      const boucle = mat("#d9a441");
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        tete.add(forme(new THREE.SphereGeometry(0.065, 10, 8), boucle, Math.cos(a) * 0.13, 0.11 + 0.03 * Math.sin(3 * a), Math.sin(a) * 0.13 - 0.03));
      }
      tete.add(forme(new THREE.SphereGeometry(0.08, 10, 8), boucle, 0, 0.17, -0.03));
      for (const x of [-0.09, 0, 0.09]) tete.add(forme(new THREE.SphereGeometry(0.022, 8, 6), lum("#fff6e0"), x, 0.13, 0.12));
      const rose = new THREE.MeshBasicMaterial({ color: "#ff7fa8", transparent: true, opacity: 0.75 });
      for (const cote of [-1, 1]) {
        const verre = forme(new THREE.SphereGeometry(0.042, 12, 8), rose, cote * 0.06, 0.03, 0.165);
        verre.scale.set(1, 0.85, 0.25);
        const aile = forme(new THREE.SphereGeometry(1, 12, 8), mat("#f4efe6"), cote * 0.22, 0.6, -0.2);
        aile.scale.set(0.05, 0.26, 0.16);
        aile.rotation.z = -cote * 0.5;
        tete.add(verre);
        corps.add(aile);
      }
      break;
    }
    case "fou": { // une peau de loup sur la tête, un grand sourire
      parure(false);
      bandeau();
      const peauDeLoup = mat("#6a5a48");
      cheveux("#6a5a48", 0.205);
      museau(peauDeLoup, 0.17, 0.15);
      for (const x of [-0.09, 0.09]) tete.add(forme(new THREE.ConeGeometry(0.05, 0.15, 4), peauDeLoup, x, 0.26, 0));
      tete.add(forme(new THREE.BoxGeometry(0.09, 0.02, 0.01), lum("#f4efe6"), 0, -0.065, 0.158));
      break;
    }
  }
  return { corps, tete };
}

/** Assoit les 10 personnages en cercle, avec une ombre au sol, en laissant la place de l'oracle (côté -z). */
function placer(scene: THREE.Scene, costumes: Costume[], textureHalo: THREE.Texture) {
  return costumes.map((costume, i) => {
    const angle = THREE.MathUtils.degToRad(-60 + (300 / 9) * i);
    const { corps, tete } = personnage(i, costume);
    corps.position.set(Math.cos(angle) * 3.2, 0, Math.sin(angle) * 3.2);
    corps.lookAt(0, 0, 0);
    // Fausse ombre : un disque sombre et flou. Bien moins coûteux que de vraies ombres portées.
    const ombre = forme(
      new THREE.CircleGeometry(0.6, 20),
      new THREE.MeshBasicMaterial({ map: textureHalo, color: "#000000", transparent: true, opacity: 0.55, depthWrite: false }),
      corps.position.x, 0.02, corps.position.z
    );
    ombre.rotation.x = -Math.PI / 2;
    scene.add(corps, ombre);
    return tete;
  });
}

/** L'estrade de pierre où l'oracle viendra s'asseoir. */
function estrade() {
  const groupe = new THREE.Group();
  const pierre = mat("#4a4640", { flatShading: true });
  groupe.add(
    forme(new THREE.BoxGeometry(2.2, 0.18, 1.8), pierre, 0, 0.09),
    forme(new THREE.BoxGeometry(1.6, 0.18, 1.3), pierre, 0, 0.27),
    forme(new THREE.BoxGeometry(1.1, 0.14, 0.9), pierre, 0, 0.43)
  );
  groupe.position.set(PLACE_ORACLE.x, 0, PLACE_ORACLE.z);
  return groupe;
}

/**
 * L'oracle : plus grand que les villageois (× TAILLE_ORACLE), son bâton solaire à la main.
 * `poser(assis, pas)` le met dans n'importe quelle posture entre debout (assis = 0, il marche ;
 * `pas` fait balancer sa démarche) et assis en tailleur (assis = 1).
 *
 * PATTERN : une seule silhouette articulée plutôt que deux modèles (debout, assis) qu'on échangerait.
 * POURQUOI : la transition est continue. Le buste descend, la robe raccourcit, les jambes croisées
 * apparaissent et les bras suivent leurs mains : on le voit vraiment s'asseoir.
 * Renvoie aussi son œil droit (il portera le reflet) et sa tête (la caméra la suit).
 */
function oracle() {
  const groupe = new THREE.Group();      // se déplace dans le monde
  const silhouette = new THREE.Group();  // tout le corps, à l'échelle de l'oracle
  silhouette.scale.setScalar(TAILLE_ORACLE);
  groupe.add(silhouette);
  const robe = mat("#1d1410");
  const peau = mat("#a07a5c");
  const or = mat("#e2a93b", { metalness: 0.7, roughness: 0.35, emissive: "#6b4708", emissiveIntensity: 0.5 });

  // Debout : une longue robe jusqu'au sol. Sa géométrie part de y = 0 (translate) : en l'étirant
  // en hauteur (scale.y), son pied reste au sol et seul son haut monte ou descend avec le buste.
  const geometrieRobe = new THREE.CylinderGeometry(0.3, 0.38, 1, 14);
  geometrieRobe.translate(0, 0.5, 0);
  const jupe = new THREE.Mesh(geometrieRobe, robe);
  // Assis : les jambes croisées.
  const jambes = forme(new THREE.SphereGeometry(0.38, 16, 10), robe, 0, 0.13, 0.05);

  // Le haut du corps (buste, collier, tête) : un groupe qu'on monte ou descend d'un bloc.
  const haut = new THREE.Group();
  haut.add(forme(new THREE.CylinderGeometry(0.13, 0.34, 0.62, 12), robe, 0, 0.47));
  haut.add(forme(new THREE.TorusGeometry(0.15, 0.03, 8, 20), or, 0, 0.72, 0).rotateX(Math.PI / 2)); // collier

  // Bras : une capsule qu'on étire entre l'épaule et la main (voir poser()).
  const bras = [0, 1].map(() => new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), robe));
  const mains = [0, 1].map(() => new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), peau));
  // Le bâton, tenu dans la main droite, surmonté du disque d'Inti.
  const baton = forme(new THREE.CylinderGeometry(0.02, 0.025, 2.1, 8), mat("#3a2414"), 0.42, 1.05, 0.05);
  const disque = forme(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 20), or, 0.42, 2.12, 0.05).rotateX(Math.PI / 2);
  silhouette.add(jupe, jambes, haut, ...bras, ...mains, baton, disque);

  const tete = new THREE.Group();
  tete.position.y = 0.93;
  tete.add(forme(new THREE.SphereGeometry(0.17, 24, 18), peau));
  tete.add(forme(new THREE.SphereGeometry(0.02, 10, 8), peau, 0, -0.035, 0.165));
  const cheveux = forme(new THREE.SphereGeometry(0.182, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), mat("#d8d4cc"));
  cheveux.rotation.x = -0.95; // bien en arrière : rien ne doit toucher les yeux
  tete.add(cheveux);
  // Couronne de plumes en éventail, derrière la tête.
  const plumes = ["#e2a93b", "#b5322a", "#2f8f6f"];
  for (let k = -4; k <= 4; k++) {
    const a = k * 0.3;
    const plume = forme(new THREE.ConeGeometry(0.035, 0.3, 4), mat(plumes[Math.abs(k) % 3]), Math.sin(a) * 0.24, 0.08 + Math.cos(a) * 0.24, -0.1);
    plume.rotation.z = -a;
    tete.add(plume);
  }
  // Les yeux aveugles : grands, blancs, légèrement lumineux, sans pupille.
  const blanc = mat("#f4f8ff", { emissive: "#bcd6ff", emissiveIntensity: 0.55, roughness: 0.15 });
  const yeux = [-0.065, 0.065].map(x => forme(new THREE.SphereGeometry(0.034, 32, 24), blanc, x, 0.035, 0.135));
  tete.add(...yeux);
  haut.add(tete);

  const epaule = new THREE.Vector3(), main = new THREE.Vector3(), axe = new THREE.Vector3();
  const VERTICAL = new THREE.Vector3(0, 1, 0);
  // Où sont les mains : debout (bâton tenu haut, bras gauche le long du corps), puis assis
  // (bâton tenu plus bas, main gauche sur le genou). Coordonnées de la silhouette.
  const MAINS = {
    debout: [new THREE.Vector3(-0.27, 0.95, 0.06), new THREE.Vector3(0.42, 1.0, 0.05)],
    assis: [new THREE.Vector3(-0.17, 0.28, 0.33), new THREE.Vector3(0.42, 0.42, 0.05)]
  };

  function poser(assis: number, pas: number) {
    const debout = 1 - assis;
    const hautY = debout * (0.62 + 0.025 * Math.abs(Math.sin(pas))); // le buste se soulève à chaque pas
    haut.position.y = hautY;
    jupe.visible = assis < 1;
    jupe.scale.y = 0.16 + hautY; // de la taille du buste jusqu'au sol
    jupe.rotation.x = 0.05 * Math.sin(pas) * debout;
    jambes.visible = assis > 0;
    jambes.scale.set(assis, 0.4 * assis, assis);
    [-1, 1].forEach((cote, k) => {
      epaule.set(cote * 0.21, 0.62 + hautY, 0.02);
      main.lerpVectors(MAINS.debout[k], MAINS.assis[k], assis);
      if (k === 0) main.y += 0.03 * Math.sin(pas) * debout; // le bras libre se balance
      mains[k].position.copy(main);
      // CONCEPT : setFromUnitVectors donne la rotation qui amène l'axe de la capsule (vertical)
      // sur la direction épaule → main. On la place au milieu, et on l'étire à la bonne longueur.
      axe.subVectors(main, epaule);
      bras[k].position.copy(epaule).addScaledVector(axe, 0.5);
      bras[k].scale.y = axe.length() / 0.4; // 0,4 = longueur de la capsule (0,3 + deux demi-sphères)
      bras[k].quaternion.setFromUnitVectors(VERTICAL, axe.normalize());
    });
  }
  poser(0, 0);
  return { groupe, oeil: yeux[1], tete, poser };
}

/* -------------------------------------------------------------------------------------
 *  Le décor, commun aux deux scènes
 * ------------------------------------------------------------------------------------- */

const c = (hex: string) => new THREE.Color(hex);
const NUIT = { haut: c("#03040c"), milieu: c("#0a1030"), bas: c("#1a2752"), brume: c("#141c3c") };
const AUBE = { haut: c("#27407a"), milieu: c("#d9806c"), bas: c("#ffc76e"), brume: c("#f0b27a") };

/** Construit la nuit dans `scene` et renvoie `animer(t, dt, aube)`, avec aube de 0 (nuit) à 1 (jour). */
function decor(scene: THREE.Scene, textureHalo: THREE.Texture) {
  // Ciel : dégradé vertical à trois couleurs (zénith, milieu, horizon), repeint pendant l'aube.
  const toileCiel = document.createElement("canvas");
  toileCiel.width = 2;
  toileCiel.height = 256;
  const ctx = toileCiel.getContext("2d")!;
  const ciel = new THREE.CanvasTexture(toileCiel);
  ciel.colorSpace = THREE.SRGBColorSpace;
  scene.background = ciel;
  const couleur = new THREE.Color();
  function peindreCiel(aube: number) {
    const degrade = ctx.createLinearGradient(0, 0, 0, 256);
    degrade.addColorStop(0, `#${couleur.lerpColors(NUIT.haut, AUBE.haut, aube).getHexString()}`);
    degrade.addColorStop(0.6, `#${couleur.lerpColors(NUIT.milieu, AUBE.milieu, aube).getHexString()}`);
    degrade.addColorStop(0.85, `#${couleur.lerpColors(NUIT.bas, AUBE.bas, aube).getHexString()}`);
    ctx.fillStyle = degrade;
    ctx.fillRect(0, 0, 2, 256);
    ciel.needsUpdate = true;
  }
  peindreCiel(0);
  const brume = new THREE.FogExp2(NUIT.brume.getHex(), 0.022);
  scene.fog = brume;

  // Sol de terre, et place dallée autour du feu.
  const sol = forme(new THREE.CircleGeometry(100, 40), mat("#33271e"));
  sol.rotation.x = -Math.PI / 2;
  const place = forme(new THREE.CircleGeometry(5.6, 40), mat("#4a3c30"), 0, 0.01, 0);
  place.rotation.x = -Math.PI / 2;
  scene.add(sol, place);

  // Le feu : pierres en cercle, bûches en faisceau, flammes, lueur, braises.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    scene.add(forme(new THREE.DodecahedronGeometry(0.1), mat("#5a554e", { flatShading: true }), Math.cos(a) * 0.6, 0.06, Math.sin(a) * 0.6));
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const buche = forme(new THREE.CylinderGeometry(0.045, 0.06, 0.8, 6), mat("#3d2413"), Math.cos(a) * 0.22, 0.33, Math.sin(a) * 0.22);
    buche.lookAt(0, 1, 0);      // l'axe z de la bûche vise la pointe du faisceau…
    buche.rotateX(Math.PI / 2); // …puis on couche son axe long (y) sur cet axe z
    scene.add(buche);
  }
  const flammes = ["#ff4a14", "#ff7a1f", "#ffb23e", "#ffe08a"].map((teinte, i) => {
    const flamme = new THREE.Mesh(
      new THREE.ConeGeometry(0.34 - i * 0.07, 1.25 - i * 0.24, 9),
      new THREE.MeshBasicMaterial({ color: teinte, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    flamme.position.y = 0.62 - i * 0.1;
    scene.add(flamme);
    return flamme;
  });
  const lumiereFeu = new THREE.PointLight("#ff8a3d", 26, 18, 1.5);
  lumiereFeu.position.y = 0.9;
  const lueurFeu = halo(textureHalo, "#ff7a2a", 3.4);
  lueurFeu.position.y = 0.65;
  scene.add(lumiereFeu, lueurFeu);

  const NB_BRAISES = 120;
  const positions = new Float32Array(NB_BRAISES * 3);
  for (let i = 0; i < NB_BRAISES; i++) positions[i * 3 + 1] = Math.random() * 3.5;
  const geometrieBraises = new THREE.BufferGeometry();
  geometrieBraises.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(geometrieBraises, new THREE.PointsMaterial({
    color: "#ffae42", size: 0.04, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  })));

  // Étoiles, et montagnes à facettes. Deux grands pics côté +z : le soleil se lèvera entre eux.
  const etoiles = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(95);
    v.y = Math.abs(v.y) + 5;
    v.toArray(etoiles, i * 3);
  }
  const geometrieEtoiles = new THREE.BufferGeometry();
  geometrieEtoiles.setAttribute("position", new THREE.BufferAttribute(etoiles, 3));
  const matiereEtoiles = new THREE.PointsMaterial({ color: "#ffffff", size: 0.3, transparent: true, fog: false });
  scene.add(new THREE.Points(geometrieEtoiles, matiereEtoiles));

  const roche = new THREE.MeshStandardMaterial({ color: "#2b2a3a", roughness: 1, flatShading: true, fog: false });
  const montagne = (degres: number, rayon: number, hauteur: number, distance = 62) => {
    const a = THREE.MathUtils.degToRad(degres);
    const m = forme(new THREE.ConeGeometry(rayon, hauteur, 6), roche, Math.cos(a) * distance, hauteur / 2 - 1, Math.sin(a) * distance);
    m.rotation.y = degres;
    scene.add(m);
  };
  montagne(78, 13, 24);
  montagne(102, 13, 22);
  // ATTENTION : decor() est appelé pour les deux scènes. Avec Math.random(), le village et son reflet
  // n'auraient pas les mêmes montagnes ni les mêmes maisons. Un hasard « à graine » donne la même suite.
  const alea = hasard(7);
  for (let i = 0; i < 16; i++) {
    const degres = 125 + i * 19 + alea() * 6; // le reste de l'horizon, hors de la trouée du soleil
    montagne(degres, 9 + alea() * 7, 9 + alea() * 11);
  }
  scene.add(alentours(alea));

  const lumiereCiel = new THREE.HemisphereLight("#3a4a80", "#1a120c", 0.4);
  const lumiereLune = new THREE.DirectionalLight("#7f9cff", 0.6);
  lumiereLune.position.set(-10, 16, -40);
  scene.add(lumiereCiel, lumiereLune);
  const cielChaud = c("#ffd2a0"), cielFroid = c("#3a4a80");

  return function animer(t: number, dt: number, aube: number) {
    flammes.forEach((flamme, i) => {
      flamme.scale.y = 1 + 0.16 * Math.sin(t * 12 + i * 2) + 0.08 * Math.sin(t * 27 + i);
      flamme.scale.x = flamme.scale.z = 1 + 0.06 * Math.sin(t * 9 + i * 3);
      flamme.rotation.y = t * (1 + i);
    });
    lumiereFeu.intensity = 26 * (0.85 + 0.1 * Math.sin(t * 17) + 0.07 * Math.sin(t * 7.3)) * (1 - 0.65 * aube);
    for (let i = 0; i < NB_BRAISES; i++) {
      const y = positions[i * 3 + 1] + dt * (0.5 + (i % 6) * 0.18);
      if (y > 3.5) { // la braise s'éteint : elle repart du feu
        positions[i * 3] = (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = 0.4;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      } else {
        positions[i * 3 + 1] = y;
        positions[i * 3] += Math.sin(t * 2.5 + i) * dt * 0.18;
        positions[i * 3 + 2] += Math.cos(t * 2.1 + i * 1.7) * dt * 0.18;
      }
    }
    geometrieBraises.attributes.position.needsUpdate = true;

    if (aube > 0) {
      peindreCiel(aube);
      brume.color.lerpColors(NUIT.brume, AUBE.brume, aube);
      brume.density = 0.022 - 0.013 * aube;
      matiereEtoiles.opacity = 1 - aube;
      lumiereCiel.intensity = 0.4 + 1.1 * aube;
      lumiereCiel.color.lerpColors(cielFroid, cielChaud, aube);
      lumiereLune.intensity = 0.6 * (1 - aube);
    }
  };
}

/** Un temple à degrés, avec sa porte éclairée au sommet. `echelle` = 1 pour le grand temple. */
function temple(echelle: number) {
  const groupe = new THREE.Group();
  const pierre = mat("#3b3a48", { flatShading: true });
  for (let k = 0; k < 5; k++) {
    groupe.add(forme(new THREE.BoxGeometry(16 - k * 2.8, 1.8, 16 - k * 2.8), pierre, 0, 0.9 + k * 1.8));
  }
  groupe.add(forme(new THREE.BoxGeometry(3, 2.2, 3), pierre, 0, 10.1));
  groupe.add(forme(new THREE.PlaneGeometry(0.9, 1.5), lum("#ff9a3e"), 0, 9.8, 1.51));
  groupe.scale.setScalar(echelle);
  return groupe;
}

/**
 * Hasard « à graine » (algorithme mulberry32) : la même graine donne toujours la même suite de
 * nombres entre 0 et 1. RÉUTILISABLE partout où l'on veut de l'aléatoire… reproductible.
 */
function hasard(graine: number) {
  return () => {
    graine = (graine + 0x6d2b79f5) | 0;
    let x = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Maison inca : murs de pierre, porte trapézoïdale (sombre, ou éclairée de l'intérieur), toit de
 * chaume à quatre pans. Renforcée (le pouvoir du Bâtisseur) : socle large, gros blocs aux angles,
 * linteau de jade et toit de pierre.
 */
function maison(renforcee: boolean, alea: () => number) {
  const groupe = new THREE.Group();
  const largeur = 2.2 + alea() * 0.8, profondeur = 1.8 + alea() * 0.5, hauteur = 1.5 + alea() * 0.3;
  const pierre = mat(renforcee ? "#5f574d" : "#857563", { flatShading: true });
  groupe.add(forme(new THREE.BoxGeometry(largeur, hauteur, profondeur), pierre, 0, hauteur / 2, 0));

  // CONCEPT : un cylindre à 4 côtés est un tronc de pyramide. On le tourne d'un huitième de tour
  // pour aligner ses faces sur les axes, puis on l'aplatit : on obtient une porte en trapèze.
  // POURQUOI sur la géométrie (et pas sur l'objet) : ces opérations s'appliquent dans l'ordre écrit.
  const geometriePorte = new THREE.CylinderGeometry(0.22, 0.32, 0.9, 4);
  geometriePorte.rotateY(Math.PI / 4);
  geometriePorte.scale(Math.SQRT2, 1, 0.12);
  groupe.add(forme(geometriePorte, alea() < 0.4 ? lum("#ffae55") : mat("#120c08"), 0, 0.45, profondeur / 2));

  // Toit : une pyramide à base carrée (cône à 4 côtés), étirée à la taille de la maison, avec débord.
  const geometrieToit = new THREE.ConeGeometry(1, 1, 4);
  geometrieToit.rotateY(Math.PI / 4);
  geometrieToit.scale((largeur / 2 + 0.25) / Math.SQRT1_2, 1.1, (profondeur / 2 + 0.25) / Math.SQRT1_2);
  const toit = mat(renforcee ? "#4a443c" : "#a88a4a", { flatShading: true });
  groupe.add(forme(geometrieToit, toit, 0, hauteur + 0.55, 0));

  if (renforcee) {
    const blocs = mat("#4f483f", { flatShading: true });
    groupe.add(forme(new THREE.BoxGeometry(largeur + 0.4, 0.35, profondeur + 0.4), blocs, 0, 0.175, 0));
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      groupe.add(forme(new THREE.BoxGeometry(0.38, hauteur + 0.1, 0.38), blocs, x * largeur / 2, (hauteur + 0.1) / 2, z * profondeur / 2));
    }
    groupe.add(forme(new THREE.BoxGeometry(0.9, 0.12, 0.08), mat("#2f8f6f", { roughness: 0.4 }), 0, 0.98, profondeur / 2 + 0.03));
  }
  return groupe;
}

/** Un arbre : un tronc et trois touffes de feuillage à facettes. */
function arbre(alea: () => number) {
  const groupe = new THREE.Group();
  const hauteur = 1.6 + alea() * 1.4;
  groupe.add(forme(new THREE.CylinderGeometry(0.08, 0.14, hauteur, 6), mat("#4a3020"), 0, hauteur / 2, 0));
  const verts = ["#2e4a2a", "#3a5a32", "#24402a"];
  for (let k = 0; k < 3; k++) {
    const rayon = 0.55 + alea() * 0.45;
    groupe.add(forme(new THREE.IcosahedronGeometry(rayon, 0), mat(verts[k], { flatShading: true }),
      (alea() - 0.5) * 0.8, hauteur + rayon * 0.4 + k * 0.25, (alea() - 0.5) * 0.8));
  }
  return groupe;
}

/**
 * Le village autour de la place : deux anneaux de maisons (une sur trois renforcée), des arbres
 * entre elles, une forêt plus loin, et trois temples. Tout est au-delà de 8 m : ni l'oracle
 * (qui marche à 5,4 m) ni la caméra ne les traversent.
 */
function alentours(alea: () => number) {
  const groupe = new THREE.Group();
  const placerAutour = (objet: THREE.Object3D, degres: number, rayon: number) => {
    const a = THREE.MathUtils.degToRad(degres);
    objet.position.set(Math.cos(a) * rayon, 0, Math.sin(a) * rayon);
    objet.lookAt(0, 0, 0); // la porte (côté +z) regarde le feu
    groupe.add(objet);
  };
  for (let i = 0; i < 16; i++) {
    placerAutour(maison(i % 3 === 0, alea), i * 22.5 + alea() * 8, 9.5 + (i % 2) * 4 + alea() * 1.5);
    placerAutour(arbre(alea), i * 22.5 + 11.25 + (alea() - 0.5) * 6, 8.5 + alea() * 7);
  }

  const temples: [number, number, number, number][] = [ // x, z, rotation, échelle
    [11, -34, -0.3, 1],   // le grand temple, derrière l'oracle
    [-20, 14, 0.8, 0.45],
    [22, 6, -0.9, 0.35]
  ];
  for (const [x, z, rotation, echelle] of temples) {
    const t = temple(echelle);
    t.position.set(x, 0, z);
    t.rotation.y = rotation;
    groupe.add(t);
  }
  // La forêt, plus loin ; aucun arbre sur un temple.
  for (let i = 0; i < 40; i++) {
    const degres = alea() * 360, rayon = 18 + alea() * 10;
    const a = THREE.MathUtils.degToRad(degres);
    const x = Math.cos(a) * rayon, z = Math.sin(a) * rayon;
    if (temples.some(([tx, tz, , echelle]) => Math.hypot(x - tx, z - tz) < 9 * echelle + 1.5)) continue;
    placerAutour(arbre(alea), degres, rayon);
  }
  return groupe;
}

/** Les rayons du soleil : de fins triangles lumineux en étoile, qu'on fera tourner lentement. */
function rayons() {
  const sommets: number[] = [];
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const demi = k % 2 ? 0.035 : 0.07; // un rayon large, un rayon fin
    sommets.push(0, 0, 0, Math.cos(a - demi) * 48, Math.sin(a - demi) * 48, 0, Math.cos(a + demi) * 48, Math.sin(a + demi) * 48, 0);
  }
  const geometrie = new THREE.BufferGeometry();
  geometrie.setAttribute("position", new THREE.Float32BufferAttribute(sommets, 3));
  return new THREE.Mesh(geometrie, new THREE.MeshBasicMaterial({
    color: "#ffd27a", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide
  }));
}

/** « PAQARI » : `ecrire(part)` révèle les lettres une à une (part de 0 à 1), puis un trait doré. */
function titre() {
  const toile = document.createElement("canvas");
  toile.width = 1024;
  toile.height = 256;
  const ctx = toile.getContext("2d")!;
  const texture = new THREE.CanvasTexture(toile);
  texture.colorSpace = THREE.SRGBColorSpace;
  document.fonts.load("150px Marcellus").catch(() => {}); // demandée d'avance : prête quand le titre s'écrit
  const panneau = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 4),
    // toneMapped: false : le tone mapping ACES ternit les couleurs vives ; le doré du titre reste pur.
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, fog: false, depthWrite: false, toneMapped: false })
  );
  panneau.rotation.y = Math.PI; // face à la caméra, qui regarde vers +z
  function ecrire(part: number) {
    ctx.clearRect(0, 0, 1024, 256);
    ctx.font = '150px Marcellus, "Palatino Linotype", Georgia, serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    [..."PAQARI"].forEach((lettre, k) => {
      const visible = THREE.MathUtils.clamp(part * 8 - k, 0, 1); // chaque lettre démarre un peu après la précédente
      const x = 512 + (k - 2.5) * 150, y = 120 + (1 - visible) * 24;
      ctx.globalAlpha = visible;
      // 1er passage : un épais contour brun-noir, avec une ombre noire floue. Il détache les lettres
      // du ciel clair de l'aube (sans lui, du doré sur du jaune pâle se lit mal).
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 30;
      ctx.lineWidth = 12;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(30, 12, 2, 0.95)";
      ctx.strokeText(lettre, x, y);
      // 2e passage : la lettre dorée par-dessus, avec une légère lueur.
      ctx.shadowColor = "#ff9a2e";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#ffd36e";
      ctx.fillText(lettre, x, y);
    });
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffd36e";
    ctx.globalAlpha = 1;
    ctx.fillRect(512 - 400 * part, 214, 800 * part, 3);
    texture.needsUpdate = true;
  }
  return { panneau, ecrire };
}

/* -------------------------------------------------------------------------------------
 *  Lancement
 * ------------------------------------------------------------------------------------- */

export function lancerIntro(toile: HTMLCanvasElement, voile: HTMLDivElement, fin: () => void): () => void {
  const rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true });
  rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  rendu.toneMapping = THREE.ACESFilmicToneMapping;
  rendu.toneMappingExposure = 1.2;
  const textureHalo = texteHalo();

  // Scène 1 : le village, la nuit.
  const village = new THREE.Scene();
  const animerVillage = decor(village, textureHalo);
  const tetesVillage = placer(village, COSTUMES.map(() => null), textureHalo);
  const { groupe: groupeOracle, oeil, tete: teteOracle, poser } = oracle();
  const lune = forme(new THREE.SphereGeometry(3.2, 24, 16), new THREE.MeshBasicMaterial({ color: "#ece6cf", fog: false }), -10, 17, -60);
  const lueurLune = halo(textureHalo, "#9fb4ff", 24);
  lueurLune.position.copy(lune.position);
  village.add(groupeOracle, estrade(), lune, lueurLune);

  // Scène 2 : les mêmes places, chacun sous l'apparence de son rôle.
  const roles = new THREE.Scene();
  const animerRoles = decor(roles, textureHalo);
  const tetesRoles = placer(roles, COSTUMES, textureHalo);
  const soleil = forme(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: "#ffd27a", fog: false }), 0, -8, 75);
  const lueurSoleil = halo(textureHalo, "#ffb347", 46);
  lueurSoleil.material.opacity = 0;
  const rayonsSoleil = rayons();
  const lumiereSoleil = new THREE.DirectionalLight("#ffb36b", 0);
  lumiereSoleil.position.set(0, 6, 40);
  roles.add(soleil, lueurSoleil, rayonsSoleil, lumiereSoleil);

  // Le titre a sa propre petite scène, dessinée APRÈS les autres et par-dessus tout (voir la boucle).
  // POURQUOI : à la fin, on noircit le reste de l'image sans toucher au titre, et aucune braise ni
  // aucun personnage ne peut passer devant lui.
  const { panneau, ecrire } = titre();
  panneau.position.set(0, 7.2, 24);
  const sceneTitre = new THREE.Scene();
  sceneTitre.add(panneau);
  // Le voile noir : un rectangle qui couvre tout l'écran, vu par une caméra « plate » (orthographique).
  const voileNoir = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0, depthTest: false, depthWrite: false })
  );
  voileNoir.position.z = -0.5;
  const sceneNoire = new THREE.Scene();
  sceneNoire.add(voileNoir);
  const cameraEcran = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // CONCEPT : la position de l'œil dépend de l'oracle (estrade, échelle, posture). Plutôt que de la
  // calculer à la main, on l'assoit à sa place et on demande à three.js où se trouve l'œil.
  poser(1, 0);
  groupeOracle.position.copy(PLACE_ORACLE);
  village.updateMatrixWorld(true);
  const OEIL = oeil.getWorldPosition(new THREE.Vector3());
  const RAYON_OEIL = 0.034 * TAILLE_ORACLE;

  // Le reflet : la scène des rôles, filmée de la place de l'oracle, rendue dans une texture.
  // POURQUOI HalfFloat : pas de tone mapping dans une texture ; en 8 bits le feu y serait tout blanc.
  const cibleReflet = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType });
  const REGARD = new THREE.Vector3(0, OEIL.y, OEIL.z + 0.1);
  const VISEE = new THREE.Vector3(0, 0.8, 2.6);
  const cameraReflet = new THREE.PerspectiveCamera(42, 1, 0.05, 300);
  cameraReflet.position.copy(REGARD);
  cameraReflet.lookAt(VISEE);

  // Une calotte de sphère posée sur l'œil, pour que le reflet en suive la courbure.
  // ATTENTION : les UV d'origine d'une sphère s'enroulent autour du pôle. On les remplace par une
  // projection à plat (x, y → u, v), inversée en x : un reflet est un miroir.
  const calotte = new THREE.SphereGeometry(0.0346, 40, 16, 0, Math.PI * 2, 0, 0.8);
  calotte.rotateX(Math.PI / 2); // le pôle de la calotte regarde vers +z, comme l'œil
  const rayonCalotte = 0.0346 * Math.sin(0.8);
  const points = calotte.attributes.position, uv = calotte.attributes.uv;
  for (let k = 0; k < points.count; k++) {
    uv.setXY(k, 0.5 - points.getX(k) / (2 * rayonCalotte), 0.5 + points.getY(k) / (2 * rayonCalotte));
  }
  const reflet = new THREE.Mesh(calotte, new THREE.MeshBasicMaterial({
    map: cibleReflet.texture, color: "#dfe8ff", transparent: true, opacity: 0
  }));
  oeil.add(reflet); // enfant de l'œil : il a le même centre, sans calcul de position

  const camera = new THREE.PerspectiveCamera(50, 1, 0.005, 300);
  // Panorama : la caméra tourne sur un petit cercle autour du feu, en regardant vers l'extérieur.
  // POURQUOI pas exactement au centre : le feu y est. Sur ce cercle, il reste toujours DERRIÈRE elle.
  const surCercle = (angle: number, rayon: number, y: number, sortie: THREE.Vector3) =>
    sortie.set(Math.cos(angle) * rayon, y, Math.sin(angle) * rayon);
  /** L'angle de la caméra : un tour complet entre T.descente et T.panorama, fini face à l'estrade. */
  const anglePanorama = (t: number) => ANGLE_ORACLE + Math.PI * 2 * lisse(T.descente, T.panorama, t);
  const pano = surCercle(ANGLE_ORACLE, 0.9, 1.15, new THREE.Vector3()); // départ et arrivée du tour
  const visePano = new THREE.Vector3();

  const chemin = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 10, 10),        // au-dessus du village
    new THREE.Vector3(5, 5, 7),
    new THREE.Vector3(5.5, 1.7, 2.6),    // derrière le dos des villageois
    new THREE.Vector3(2.94, 1.05, 1.27), // entre deux d'entre eux
    new THREE.Vector3(1.5, 1.1, 0.4),
    new THREE.Vector3(0.9, 1.15, -0.55),
    pano.clone()                          // le centre du cercle, dos au feu
  ]);
  const presOeil = OEIL.clone().add(new THREE.Vector3(0, 0, 0.25));
  const dansOeil = OEIL.clone().add(new THREE.Vector3(0, 0, RAYON_OEIL + 0.03));
  const arriveeRoles = new THREE.Vector3(0, 1.3, -1.6);
  const regard = new THREE.Vector3();
  const positionTete = new THREE.Vector3();

  /** L'oracle fait le tour du cercle par l'extérieur, monte sur l'estrade et s'assoit. */
  const finDuTour = surCercle(ANGLE_ORACLE, RAYON_MARCHE, 0, new THREE.Vector3());
  function placerOracle(t: number) {
    if (t < T.panorama) {
      const angle = ANGLE_ORACLE + Math.PI * 2 * THREE.MathUtils.clamp((t - DEPART_ORACLE) / (T.panorama - DEPART_ORACLE), 0, 1);
      surCercle(angle, RAYON_MARCHE, 0, groupeOracle.position);
      // Face au sens de la marche : la tangente au cercle est (-sin, 0, cos), soit une rotation de -angle.
      groupeOracle.rotation.y = -angle;
      poser(0, t * 6);
    } else {
      groupeOracle.position.lerpVectors(finDuTour, PLACE_ORACLE, lisse(T.panorama, T.estrade, t));
      // Il marchait vers +x (rotation -3π/2) ; il pivote d'un quart de tour pour faire face au feu (-2π ≡ 0).
      groupeOracle.rotation.y = THREE.MathUtils.lerp(-1.5 * Math.PI, -2 * Math.PI, lisse(T.panorama, T.panorama + 0.7, t));
      poser(lisse(T.estrade, T.assis, t), t * 6);
    }
  }

  // Après le clignement, on voit par les yeux de l'oracle : devant, puis d'un côté, de l'autre, et devant.
  // Chaque clé = [instant, point regardé] ; entre deux clés, le regard glisse en douceur.
  const E = T.entree;
  const COTE_A = new THREE.Vector3(3.4, 0.9, -0.6), COTE_B = new THREE.Vector3(-3.4, 0.9, -0.6);
  const CLES: [number, THREE.Vector3][] = [
    [E, VISEE], [E + 1.5, VISEE], [E + 3.3, COTE_A], [E + 4.3, COTE_A],
    [E + 6.5, COTE_B], [E + 7.3, COTE_B], [E + 9, VISEE]
  ];
  function suivreCles(t: number, sortie: THREE.Vector3) {
    for (let k = 1; k < CLES.length; k++) {
      if (t < CLES[k][0]) return sortie.lerpVectors(CLES[k - 1][1], CLES[k][1], lisse(CLES[k - 1][0], CLES[k][0], t));
    }
    return sortie.copy(CLES[CLES.length - 1][1]);
  }

  function redimensionner() {
    const largeur = toile.clientWidth, hauteur = toile.clientHeight;
    rendu.setSize(largeur, hauteur, false);
    camera.aspect = largeur / hauteur;
    camera.updateProjectionMatrix();
    // Écran étroit (téléphone debout) : on rétrécit le titre pour qu'il tienne dans la largeur visible.
    const largeurVisible = 2 * 26 * Math.tan(THREE.MathUtils.degToRad(55 / 2)) * camera.aspect;
    panneau.scale.setScalar(Math.min(1, (largeurVisible * 0.85) / 16));
  }
  redimensionner();
  window.addEventListener("resize", redimensionner);

  /**
   * Tourne chaque tête vers `cible` : part = 0 → elle garde sa pose (face au feu, ou en train de
   * bavarder si `t` est donné), 1 → elle fixe la cible.
   */
  const face = new THREE.Quaternion(), versCible = new THREE.Quaternion();
  function tournerTetes(tetes: THREE.Group[], cible: THREE.Vector3, part: number, t?: number) {
    tetes.forEach((tete, i) => {
      tete.quaternion.identity();
      if (t !== undefined) tete.rotation.y = 0.3 * Math.sin(t * 0.5 + i * 2.1); // ils bavardent
      if (part === 0) return;
      face.copy(tete.quaternion);
      tete.lookAt(cible);
      versCible.copy(tete.quaternion);
      tete.quaternion.slerpQuaternions(face, versCible, part);
    });
  }

  /** Le voile en paupières : deux bandes noires qui se rejoignent au milieu (ferme = 1 → œil clos). */
  function paupieres(ferme: number) {
    const bord = ferme * 50, flou = 6 * (1 - ferme);
    voile.style.opacity = ferme > 0 ? "1" : "0";
    voile.style.background =
      `linear-gradient(#000 ${bord}%, transparent ${bord + flou}%, transparent ${100 - bord - flou}%, #000 ${100 - bord}%)`;
  }

  let t = 0;
  let image = 0;
  let precedente = performance.now();
  let finie = false;
  let titreFini = false;

  function boucle(maintenant: number) {
    image = requestAnimationFrame(boucle);
    // dt plafonné : après un passage en arrière-plan, l'intro reprend où elle en était.
    const dt = Math.min((maintenant - precedente) / 1000, 0.1);
    precedente = maintenant;
    t += dt;

    if (t < T.entree) {
      // Le village : descente, panorama pendant que l'oracle marche, puis son œil.
      placerOracle(t);
      village.updateMatrixWorld();
      teteOracle.getWorldPosition(positionTete);
      surCercle(anglePanorama(t), 6, 1.25, visePano); // le point regardé pendant le panorama, vers l'extérieur

      if (t < T.descente) {
        camera.position.copy(chemin.getPointAt(lisse(0, T.descente, t)));
        regard.lerpVectors(FEU, visePano, lisse(3.8, T.descente, t)); // il regarde le feu, puis se retourne
      } else if (t < T.panorama) {
        const angle = anglePanorama(t);
        surCercle(angle, 0.9, 1.15, camera.position);
        // Dans la dernière seconde et demie, le regard quitte l'horizon pour l'oracle qui arrive.
        regard.lerpVectors(visePano, positionTete, lisse(T.panorama - 1.5, T.panorama, t));
      } else if (t < T.assis) {
        camera.position.copy(pano);
        regard.copy(positionTete); // elle le suit pendant qu'il monte et s'assoit
      } else if (t < T.oeil) {
        camera.position.lerpVectors(pano, presOeil, lisse(T.assis, T.oeil, t));
        regard.lerpVectors(positionTete, OEIL, lisse(T.assis, T.assis + 1.5, t));
      } else {
        camera.position.lerpVectors(presOeil, dansOeil, lisse(T.oeil, T.entree - 0.2, t));
        regard.copy(OEIL);
      }
      // Plan large pendant le panorama (on voit deux ou trois joueurs à la fois), normal ensuite.
      camera.fov = 50 + 18 * (lisse(T.descente - 1, T.descente, t) - lisse(T.panorama, T.assis, t));
      camera.updateProjectionMatrix();
      camera.lookAt(regard);
      // Ils bavardent ; quand l'oracle monte sur l'estrade, tous se tournent vers lui.
      tournerTetes(tetesVillage, positionTete, lisse(T.panorama, T.assis, t), t);
      animerVillage(t, dt, 0);

      const opacite = lisse(T.assis + 1.2, T.oeil - 0.6, t);
      reflet.material.opacity = 0.92 * opacite;
      if (opacite > 0) { // la 2e scène n'est dessinée que lorsque le reflet se voit
        animerRoles(t, dt, 0);
        tournerTetes(tetesRoles, REGARD, 0);
        rendu.setRenderTarget(cibleReflet);
        rendu.render(roles, cameraReflet);
        rendu.setRenderTarget(null);
      }
      paupieres(lisse(T.entree - 0.45, T.entree, t));
      rendu.render(village, camera);
    } else {
      // Dans le reflet : le point de vue de l'oracle. On regarde autour, puis la caméra avance vers l'aube.
      const aube = lisse(T.aube, T.aube + 5.5, t);
      camera.position.lerpVectors(REGARD, arriveeRoles, lisse(E + 7, T.noir + 1, t));
      camera.fov = THREE.MathUtils.lerp(42, 55, lisse(T.entree, T.entree + 5, t));
      camera.updateProjectionMatrix();
      suivreCles(t, regard);
      regard.y += 2.6 * aube; // le regard se lève vers le soleil
      regard.z += 11.4 * aube;
      camera.lookAt(regard);
      tournerTetes(tetesRoles, camera.position, lisse(T.entree + 0.9, T.entree + 2.8, t));
      animerRoles(t, dt, aube);

      soleil.position.y = -8 + 17 * aube;
      lueurSoleil.position.copy(soleil.position);
      lueurSoleil.material.opacity = aube;
      rayonsSoleil.position.copy(soleil.position);
      rayonsSoleil.rotation.z = t * 0.06;
      rayonsSoleil.material.opacity = 0.13 * aube;
      lumiereSoleil.intensity = 2.4 * aube;

      if (!titreFini) {
        const part = lisse(T.titre, T.titre + 3.2, t);
        ecrire(part);
        titreFini = part === 1;
      }

      if (t < T.fin - 0.8) {
        paupieres(1 - lisse(T.entree, T.entree + 0.6, t));
      } else { // tout à la fin, même le titre s'efface vers la couleur du site
        voile.style.background = FOND_APPLI;
        voile.style.opacity = String(lisse(T.fin - 0.8, T.fin, t));
      }

      // FLUX du dessin, en trois couches : la scène, puis le voile noir par-dessus (il monte à
      // partir de T.noir), puis le titre par-dessus tout. autoClear = false : chaque couche
      // s'ajoute à l'image au lieu de l'effacer ; clearDepth() fait passer le titre devant.
      rendu.render(roles, camera);
      rendu.autoClear = false;
      voileNoir.material.opacity = lisse(T.noir, T.noir + 1.5, t);
      if (voileNoir.material.opacity > 0) rendu.render(sceneNoire, cameraEcran);
      rendu.clearDepth();
      rendu.render(sceneTitre, camera);
      rendu.autoClear = true;
    }

    if (t >= T.fin && !finie) {
      finie = true;
      fin();
    }
  }
  image = requestAnimationFrame(boucle);

  return function arreter() {
    cancelAnimationFrame(image);
    window.removeEventListener("resize", redimensionner);
    cibleReflet.dispose();
    rendu.dispose();
    rendu.forceContextLoss(); // le navigateur limite le nombre de contextes WebGL : on rend le nôtre
  };
}
