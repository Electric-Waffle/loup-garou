/* =====================================================================================
 *  intro3d.ts — la cinématique d'ouverture, en 3D (three.js)
 * =====================================================================================
 *
 *  FLUX (les secondes sont dans T, plus bas) :
 *    1. 0 → 10,5 s  : nuit, dix villageois assis autour du feu. La caméra descend du ciel,
 *                     se glisse entre deux d'entre eux, contourne le feu, arrive face à l'oracle.
 *    2. 10,5 → 14 s : elle s'approche de son œil blanc, aveugle. Un reflet y apparaît : les MÊMES
 *                     villageois, mais sous l'apparence de leur rôle.
 *    3. 14 → 15,2 s : la caméra plonge dans l'œil ; un clignement de paupières nous fait passer
 *                     de l'autre côté, dans la scène des rôles.
 *    4. 15,2 → 20 s : les rôles tournent la tête vers la caméra.
 *    5. 20 → 30 s   : Inti se lève entre deux pics, « PAQARI » s'écrit lettre par lettre, fondu.
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
const T = { arrivee: 10.5, oeil: 14, entree: 15.2, aube: 20, titre: 23, fin: 30 };

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

function personnage(i: number, costume: Costume) {
  const corps = new THREE.Group();
  const loup = costume === "loup", ombre = costume === "skinwalker", soldat = costume === "conquistador";
  const tissu = ombre ? mat("#060608")
    : loup ? mat("#3a3532")
    : soldat ? mat("#9aa0a8", { metalness: 0.8, roughness: 0.35 })
    : mat(PONCHOS[i]);
  const peau = ombre ? tissu : mat(loup ? "#4d4642" : costume === "fou" ? "#e8e0d0" : PEAUX[i % PEAUX.length]);

  // Jambes croisées (une sphère aplatie), buste, bande du poncho, bras posés sur les genoux.
  const jambes = forme(new THREE.SphereGeometry(0.36, 16, 10), tissu, 0, 0.13, 0.05);
  jambes.scale.y = 0.4;
  corps.add(jambes, forme(new THREE.CylinderGeometry(0.13, 0.32, 0.62, 12), tissu, 0, 0.47));
  if (!loup && !ombre && !soldat) {
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
  if (!loup && !ombre) {
    tete.add(forme(new THREE.SphereGeometry(0.022, 10, 8), peau, 0, -0.02, 0.165));
  }
  const yeux = loup ? lum("#ff3020") : ombre ? lum("#ffffff") : mat("#120c08", { roughness: 0.3 });
  for (const x of [-0.06, 0.06]) {
    tete.add(forme(new THREE.SphereGeometry(ombre ? 0.014 : 0.022, 8, 6), yeux, x, 0.03, 0.152));
  }
  corps.add(tete);

  /** Une calotte de sphère basculée vers l'arrière : elle couvre le crâne et dégage le visage. */
  const cheveux = (couleur: string) => {
    const calotte = forme(new THREE.SphereGeometry(0.18, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(couleur));
    calotte.rotation.x = -0.55;
    tete.add(calotte);
  };

  switch (costume) {
    case null: // villageois : un sur deux porte le bonnet andin (chullo), les autres sont tête nue
      cheveux("#1c120c");
      if (i % 2 === 0) tete.add(forme(new THREE.ConeGeometry(0.175, 0.26, 10), mat(PONCHOS[(i + 4) % 10]), 0, 0.17, -0.02));
      break;
    case "loup":
      for (const x of [-0.1, 0.1]) tete.add(forme(new THREE.ConeGeometry(0.05, 0.17, 4), tissu, x, 0.18, -0.02));
      tete.add(forme(new THREE.BoxGeometry(0.1, 0.08, 0.16), mat("#2c2826"), 0, -0.045, 0.17));
      for (const x of [-0.03, 0.03]) { // crocs
        tete.add(forme(new THREE.ConeGeometry(0.012, 0.05, 4), lum("#f4efe6"), x, -0.1, 0.22).rotateX(Math.PI));
      }
      break;
    case "chasseur": {
      cheveux("#1c120c");
      tete.add(forme(new THREE.CylinderGeometry(0.176, 0.176, 0.04, 14), mat("#b5322a"), 0, 0.07));
      for (const x of [-0.05, 0, 0.05]) tete.add(forme(new THREE.ConeGeometry(0.022, 0.26, 4), mat("#f2e6c9"), x, 0.22, -0.14));
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
      tete.add(bord, crete, forme(new THREE.ConeGeometry(0.06, 0.12, 6), mat("#2a1a10"), 0, -0.17, 0.1).rotateX(Math.PI));
      const mousquet = forme(new THREE.CylinderGeometry(0.018, 0.024, 1, 8), mat("#3a2414"), 0, 0.31, 0.36);
      mousquet.rotation.z = Math.PI / 2.2;
      corps.add(mousquet);
      break;
    }
    case "sorciere": {
      cheveux("#3a2a4a");
      const chapeau = mat("#2a1f3d");
      tete.add(forme(new THREE.CylinderGeometry(0.3, 0.3, 0.015, 20), chapeau, 0, 0.13));
      const pointe = forme(new THREE.ConeGeometry(0.14, 0.45, 12), chapeau, 0, 0.36, -0.03);
      pointe.rotation.x = -0.15;
      tete.add(pointe);
      corps.add(forme(new THREE.SphereGeometry(0.05, 12, 8), lum("#59ff8a"), -0.17, 0.36, 0.33)); // potion de vie
      corps.add(forme(new THREE.SphereGeometry(0.05, 12, 8), lum("#ff4d5e"), 0.17, 0.36, 0.33));  // potion de mort
      break;
    }
    case "pretre": {
      cheveux("#1c120c");
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
    case "voyante": {
      const voile = forme(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), mat("#4b2a6b"));
      voile.rotation.x = -0.5;
      tete.add(voile, forme(new THREE.SphereGeometry(0.02, 8, 6), lum("#e2ccff"), 0, 0.1, 0.145)); // troisième œil
      corps.add(forme(new THREE.SphereGeometry(0.09, 16, 12), lum("#c9a6ff"), 0, 0.38, 0.36));
      const lueur = new THREE.PointLight("#b48cff", 3, 3);
      lueur.position.set(0, 0.45, 0.45);
      corps.add(lueur);
      break;
    }
    case "skinwalker": { // une ombre sans visage, coiffée de bois de cerf
      const os = mat("#cfc8b8");
      for (const cote of [-1, 1]) {
        const bois = forme(new THREE.CylinderGeometry(0.01, 0.018, 0.32, 5), os, cote * 0.11, 0.28, 0);
        bois.rotation.z = -cote * 0.45;
        const branche = forme(new THREE.CylinderGeometry(0.008, 0.012, 0.16, 5), os, cote * 0.2, 0.33, 0);
        branche.rotation.z = -cote * 1.2;
        tete.add(bois, branche);
      }
      break;
    }
    case "cupidon": {
      cheveux("#d9a441");
      for (const cote of [-1, 1]) {
        const aile = forme(new THREE.SphereGeometry(1, 12, 8), mat("#f4efe6"), cote * 0.23, 0.62, -0.22);
        aile.scale.set(0.05, 0.32, 0.2);
        aile.rotation.z = -cote * 0.4;
        corps.add(aile);
      }
      tete.add(forme(new THREE.TorusGeometry(0.13, 0.016, 6, 20), lum("#ff8fb1"), 0, 0.27, 0).rotateX(Math.PI / 2));
      break;
    }
    case "fou": { // bonnet à deux cornes et grelots, nez rouge
      for (const cote of [-1, 1]) {
        const corne = forme(new THREE.ConeGeometry(0.07, 0.3, 8), mat(cote < 0 ? "#b5322a" : "#2f8f6f"), cote * 0.12, 0.2, 0);
        corne.rotation.z = -cote * 0.7;
        tete.add(corne, forme(new THREE.SphereGeometry(0.03, 8, 6), mat("#e2a93b", { metalness: 0.7, roughness: 0.3 }), cote * 0.22, 0.31, 0));
      }
      tete.add(forme(new THREE.SphereGeometry(0.03, 8, 6), lum("#e23b3b"), 0, -0.015, 0.19));
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

/** L'oracle sur son estrade. Renvoie aussi son œil droit : c'est lui qui portera le reflet. */
function oracle() {
  const groupe = new THREE.Group();
  const pierre = mat("#4a4640", { flatShading: true });
  groupe.add(
    forme(new THREE.BoxGeometry(2.2, 0.18, 1.8), pierre, 0, 0.09),
    forme(new THREE.BoxGeometry(1.6, 0.18, 1.3), pierre, 0, 0.27),
    forme(new THREE.BoxGeometry(1.1, 0.14, 0.9), pierre, 0, 0.43)
  );

  const assis = new THREE.Group(); // plus grand que les villageois (× 1,25)
  assis.position.y = 0.5;
  assis.scale.setScalar(1.25);
  const robe = mat("#1d1410");
  const peau = mat("#a07a5c");
  const or = mat("#e2a93b", { metalness: 0.7, roughness: 0.35, emissive: "#6b4708", emissiveIntensity: 0.5 });
  const jambes = forme(new THREE.SphereGeometry(0.38, 16, 10), robe, 0, 0.13, 0.05);
  jambes.scale.y = 0.4;
  assis.add(jambes, forme(new THREE.CylinderGeometry(0.13, 0.34, 0.62, 12), robe, 0, 0.47));
  assis.add(forme(new THREE.TorusGeometry(0.15, 0.03, 8, 20), or, 0, 0.72, 0).rotateX(Math.PI / 2)); // collier
  for (const cote of [-1, 1]) {
    const bras = forme(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), robe, cote * 0.22, 0.44, 0.16);
    bras.rotation.set(-0.9, 0, cote * 0.25);
    assis.add(bras, forme(new THREE.SphereGeometry(0.055, 10, 8), peau, cote * 0.17, 0.28, 0.33));
  }
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
  assis.add(tete);

  // Bâton surmonté d'un disque solaire.
  groupe.add(assis, forme(new THREE.CylinderGeometry(0.02, 0.025, 1.9, 8), mat("#3a2414"), 0.8, 0.95, 0.1));
  groupe.add(forme(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 20), or, 0.8, 1.95, 0.1).rotateX(Math.PI / 2));
  groupe.position.set(0, 0, -4.4);
  return { groupe, oeil: yeux[1] };
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
  for (let i = 0; i < 16; i++) {
    const degres = 125 + i * 19 + Math.random() * 6; // le reste de l'horizon, hors de la trouée du soleil
    montagne(degres, 9 + Math.random() * 7, 9 + Math.random() * 11);
  }

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

/** Un temple à degrés au loin, derrière l'oracle, avec sa porte éclairée. */
function temple() {
  const groupe = new THREE.Group();
  const pierre = mat("#3b3a48", { flatShading: true });
  for (let k = 0; k < 5; k++) {
    groupe.add(forme(new THREE.BoxGeometry(16 - k * 2.8, 1.8, 16 - k * 2.8), pierre, 0, 0.9 + k * 1.8));
  }
  groupe.add(forme(new THREE.BoxGeometry(3, 2.2, 3), pierre, 0, 10.1));
  groupe.add(forme(new THREE.PlaneGeometry(0.9, 1.5), lum("#ff9a3e"), 0, 9.8, 1.51));
  groupe.position.set(11, 0, -34);
  groupe.rotation.y = -0.3;
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
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, fog: false, depthWrite: false })
  );
  panneau.rotation.y = Math.PI; // face à la caméra, qui regarde vers +z
  function ecrire(part: number) {
    ctx.clearRect(0, 0, 1024, 256);
    ctx.font = '150px Marcellus, "Palatino Linotype", Georgia, serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ff9a2e";
    ctx.shadowBlur = 36;
    ctx.fillStyle = "#f6cc6a";
    ctx.lineWidth = 5; // contour sombre : les lettres restent lisibles sur le ciel clair de l'aube
    ctx.strokeStyle = "rgba(60, 25, 5, 0.6)";
    [..."PAQARI"].forEach((lettre, k) => {
      const visible = THREE.MathUtils.clamp(part * 8 - k, 0, 1); // chaque lettre démarre un peu après la précédente
      ctx.globalAlpha = visible;
      ctx.strokeText(lettre, 512 + (k - 2.5) * 150, 120 + (1 - visible) * 24);
      ctx.fillText(lettre, 512 + (k - 2.5) * 150, 120 + (1 - visible) * 24);
    });
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
  const { groupe: groupeOracle, oeil } = oracle();
  const lune = forme(new THREE.SphereGeometry(3.2, 24, 16), new THREE.MeshBasicMaterial({ color: "#ece6cf", fog: false }), -10, 17, -60);
  const lueurLune = halo(textureHalo, "#9fb4ff", 24);
  lueurLune.position.copy(lune.position);
  village.add(groupeOracle, temple(), lune, lueurLune);

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
  const { panneau, ecrire } = titre();
  panneau.position.set(0, 7.2, 24);
  roles.add(soleil, lueurSoleil, rayonsSoleil, lumiereSoleil, panneau);

  // CONCEPT : les positions de l'œil dépendent de l'oracle (estrade, échelle 1,25). Plutôt que de les
  // recalculer à la main, on demande à three.js sa position réelle dans le monde.
  village.updateMatrixWorld(true);
  const OEIL = oeil.getWorldPosition(new THREE.Vector3());
  const RAYON_OEIL = 0.034 * 1.25;

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
  const chemin = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 9, 8),           // au-dessus du village
    new THREE.Vector3(4.5, 4.5, 7),
    new THREE.Vector3(6, 1.6, 3.5),       // derrière le dos des villageois
    new THREE.Vector3(2.82, 1, 1.21),     // entre deux d'entre eux
    new THREE.Vector3(0.9, 0.95, 1.5),    // tout près du feu
    new THREE.Vector3(-1.4, 1.05, 0.5),
    new THREE.Vector3(-1, 1.4, -1.8),
    new THREE.Vector3(0.05, OEIL.y, -3.3) // face à l'oracle
  ]);
  const finChemin = chemin.getPointAt(1);
  const presOeil = OEIL.clone().add(new THREE.Vector3(0, 0, 0.22));
  const dansOeil = OEIL.clone().add(new THREE.Vector3(0, 0, RAYON_OEIL + 0.03));
  const arriveeRoles = new THREE.Vector3(0, 1.3, -1.6);
  const regard = new THREE.Vector3();

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

  /** Tourne chaque tête vers `cible` : part = 0 → elle regarde le feu, 1 → elle fixe la cible. */
  const face = new THREE.Quaternion(), versCible = new THREE.Quaternion();
  function tournerTetes(cible: THREE.Vector3, part: number) {
    for (const tete of tetesRoles) {
      tete.quaternion.identity();
      if (part === 0) continue;
      tete.lookAt(cible);
      versCible.copy(tete.quaternion);
      tete.quaternion.slerpQuaternions(face, versCible, part);
    }
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
      // Le village : descente, passage entre les villageois, puis l'œil de l'oracle.
      if (t < T.arrivee) {
        camera.position.copy(chemin.getPointAt(lisse(0, T.arrivee, t)));
        regard.lerpVectors(FEU, OEIL, lisse(6.5, 10, t));
      } else if (t < T.oeil) {
        camera.position.lerpVectors(finChemin, presOeil, lisse(T.arrivee, T.oeil, t));
        regard.copy(OEIL);
      } else {
        camera.position.lerpVectors(presOeil, dansOeil, lisse(T.oeil, T.entree - 0.2, t));
        regard.copy(OEIL);
      }
      camera.lookAt(regard);
      tetesVillage.forEach((tete, i) => { tete.rotation.y = 0.3 * Math.sin(t * 0.5 + i * 2.1); }); // ils bavardent
      animerVillage(t, dt, 0);

      const opacite = lisse(T.arrivee + 0.8, T.oeil - 0.6, t);
      reflet.material.opacity = 0.92 * opacite;
      if (opacite > 0) { // la 2e scène n'est dessinée que lorsque le reflet se voit
        animerRoles(t, dt, 0);
        tournerTetes(REGARD, 0);
        rendu.setRenderTarget(cibleReflet);
        rendu.render(roles, cameraReflet);
        rendu.setRenderTarget(null);
      }
      paupieres(lisse(T.entree - 0.45, T.entree, t));
      rendu.render(village, camera);
    } else {
      // Dans le reflet : même point de vue, puis la caméra avance et l'angle s'élargit.
      const aube = lisse(T.aube, T.aube + 5.5, t);
      camera.position.lerpVectors(REGARD, arriveeRoles, lisse(T.entree, T.fin - 2, t));
      camera.fov = THREE.MathUtils.lerp(42, 55, lisse(T.entree, T.entree + 5, t));
      camera.updateProjectionMatrix();
      regard.set(0, VISEE.y + 2.6 * aube, VISEE.z + 11.4 * aube);
      camera.lookAt(regard);
      tournerTetes(camera.position, lisse(T.entree + 0.9, T.entree + 2.8, t));
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

      if (t < T.fin - 1.5) {
        paupieres(1 - lisse(T.entree, T.entree + 0.6, t));
      } else {
        voile.style.background = FOND_APPLI;
        voile.style.opacity = String(lisse(T.fin - 1.5, T.fin, t));
      }
      rendu.render(roles, camera);
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
