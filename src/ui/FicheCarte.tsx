/* =====================================================================================
 *  FicheCarte.tsx — la pastille d'une carte, et sa fiche détaillée dans une modale
 * =====================================================================================
 *
 *  RÉUTILISABLE : la page Explications affiche les pastilles et ouvre la fiche au clic ;
 *  PartieVue ouvre la même fiche quand le meneur clique sur un joueur sans rien à cibler.
 *
 *  POURQUOI `titre` et `image` à part du rôle : le meneur peut renommer une carte ou changer
 *  son image dans les options. L'appelant passe l'apparence choisie ; le rôle donne le reste.
 * ===================================================================================== */

import { ROLES } from "../moteur/roles";
import type { Role } from "../moteur/types";
import { LIBELLES_CAMPS, libelleTours } from "./libelles";
import { Modale } from "./Modale";
import { Visuel } from "./Visuel";

/** Une carte en petit : image ronde, nom et camp. Cliquable. */
export function PastilleCarte({ role, titre, image, ouvrir }: {
  role: Role;
  titre: string;
  image: string;
  ouvrir: () => void;
}) {
  return (
    <button className="pastille" onClick={ouvrir}>
      <Visuel src={image} nom={titre} taille={56} />
      <span className="pastille-nom">{titre}</span>
      <span className={`badge camp-${role.camp}`}>{LIBELLES_CAMPS[role.camp]}</span>
    </button>
  );
}

/** La fiche complète d'une carte, dans une modale. */
export function FicheCarte({ role, titre, image, fermer }: {
  role: Role;
  titre: string;
  image: string;
  fermer: () => void;
}) {
  // Titres des cartes de groupe qu'elle rejoint (« Loup-Garou » pour un loup spécial).
  // CONCEPT : ?? [] donne un tableau vide si le rôle ne rejoint rien : map ne plante pas.
  const rejointes = (role.rejoint ?? []).map(alias => ROLES[alias]?.titre ?? alias);

  return (
    <Modale fermer={fermer}>
      <div className="fiche-entete">
        <Visuel src={image} nom={titre} taille={112} />
        <div>
          <h2>{titre}</h2>
          {/* Carte renommée dans les options : on rappelle son nom d'origine. */}
          {titre !== role.titre && <p className="aide">Carte : {role.titre}</p>}
          <div className="badges">
            <span className={`badge camp-${role.camp}`}>{LIBELLES_CAMPS[role.camp]}</span>
            {role.hybride && <span className="badge">Hybride</span>}
            {role.appelNuit
              ? <span className="badge">priorité {role.priorite ?? "fin de nuit"}</span>
              : <span className="badge">pas appelée la nuit</span>}
            {role.appelNuit && <span className="badge">{libelleTours(role.tours)}</span>}
            {rejointes.map(nom => <span key={nom} className="badge">se réveille avec : {nom}</span>)}
          </div>
        </div>
      </div>
      <p className="fiche-resume">{role.description}</p>
      {/* key={index} : la liste est fixe (texte du code), elle ne change jamais d'ordre. */}
      {role.explication?.map((ligne, index) => <p key={index}>{ligne}</p>)}
    </Modale>
  );
}
