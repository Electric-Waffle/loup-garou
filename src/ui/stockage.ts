import { LISTE_ROLES } from "../moteur/roles";

/**
 * Prototype : les réglages sont gardés dans le localStorage du navigateur.
 * Plus tard, ces deux fonctions seront remplacées par des appels à l'API Express + SQLite,
 * sans rien changer au reste de l'interface.
 */

export interface JoueurProfil {
  id: string;
  nom: string;
  image: string;
}

export interface CarteReglage {
  titre?: string;
  image?: string;
  active: boolean;
}

export interface Donnees {
  joueurs: JoueurProfil[];
  cartes: Record<string, CarteReglage>;   // indexé par alias
  table: string[];                        // ids des joueurs, dans l'ordre autour de la table
  distribution: Record<string, string>;   // id joueur → alias
  dureeDebat: number;                     // minutes
}

const CLE = "loup-garou:donnees:v1";

function parDefaut(): Donnees {
  const noms = ["Alice", "Bob", "Chloé", "David", "Emma", "Hugo", "Inès", "Jules"];
  const joueurs = noms.map(nom => ({ id: nouvelId(), nom, image: "" }));
  return {
    joueurs,
    cartes: Object.fromEntries(LISTE_ROLES.map(r => [r.alias, { active: true }])),
    table: joueurs.map(j => j.id),
    distribution: {},
    dureeDebat: 3
  };
}

export function charger(): Donnees {
  const defaut = parDefaut();
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return defaut;
    const lu = JSON.parse(brut) as Partial<Donnees>;
    return {
      ...defaut,
      ...lu,
      // un rôle ajouté dans le code apparaît automatiquement, activé
      cartes: { ...defaut.cartes, ...lu.cartes }
    };
  } catch {
    return defaut;
  }
}

export function sauver(d: Donnees): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(d));
  } catch {
    // stockage plein ou indisponible : le prototype continue en mémoire
  }
}

export function nouvelId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Lit une image choisie par l'utilisateur et la réduit à 256 px pour ne pas saturer le stockage. */
export function lireImage(fichier: File, taille = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onerror = () => reject(lecteur.error);
    lecteur.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image illisible"));
      img.onload = () => {
        const echelle = Math.min(1, taille / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * echelle);
        canvas.height = Math.round(img.height * echelle);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = lecteur.result as string;
    };
    lecteur.readAsDataURL(fichier);
  });
}
