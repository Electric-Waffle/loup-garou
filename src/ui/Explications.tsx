/* =====================================================================================
 *  Explications.tsx — la page « Explications » : règles, cartes, événements, cas particuliers
 * =====================================================================================
 *
 *  Organisation du fichier :
 *    1. <Explications>         : la page, ses 5 sections et ce qui est ouvert ;
 *    2. <Regles>               : les règles de base, en texte ;
 *    3. <FinsDuJeu>            : comment chacun gagne, avec des conseils (données : finsDuJeu.ts) ;
 *    4. <FicheEvenement>       : la modale d'un événement ;
 *    5. <FicheCas>             : la modale d'un cas particulier, avec la table de la situation.
 *
 *  FLUX : la page lit tout dans le code (LISTE_ROLES, EVENEMENTS, CAS_PARTICULIERS, FINS_DU_JEU).
 *  Une carte, un événement, un cas ou une fin ajouté apparaît ici sans toucher à ce fichier.
 *  PATTERN : un état « ce qui est ouvert » par sorte de modale (alias, ou null = fermée).
 *  La modale n'existe que pendant qu'elle est ouverte : rendu conditionnel avec &&.
 *  POURQUOI `donnees` en props : les titres et images personnalisés dans les options doivent
 *  être les mêmes ici qu'à la table.
 * ===================================================================================== */

import { useState } from "react";
import { EVENEMENTS } from "../moteur/evenements";
import { LISTE_ROLES, ROLES } from "../moteur/roles";
import type { Evenement } from "../moteur/types";
import { CAS_PARTICULIERS, type CasParticulier } from "./casParticuliers";
import { BlocConseil, FicheCarte, PastilleCarte } from "./FicheCarte";
import { FINS_DU_JEU } from "./finsDuJeu";
import { groupeDe, LIBELLES_CAMPS, LIBELLES_GROUPES, ORDRE_GROUPES, TAGS } from "./libelles";
import { Modale } from "./Modale";
import type { Donnees } from "./stockage";
import { Table, type Siege } from "./Table";
import { Visuel } from "./Visuel";

/**
 * Les cartes qui apparaissent dans au moins un cas, triées par titre : les choix du filtre des cas.
 * CONCEPT : new Set(...) garde chaque alias une seule fois ; flatMap aplatit les listes de chaque cas.
 */
/** Affiché dans les règles ET au-dessus du groupe Hybride des cartes : un seul texte à tenir à jour. */
const TEXTE_HYBRIDES =
  "Une carte hybride existe en deux versions, une du village et une des loups. Le joueur décide lui-même s'il est bon ou mauvais : " +
  "le Prêtre et le Beau Parleur la première nuit, le Rat quand les loups le mordent. Une même carte peut donc être de deux camps différents.";

const ROLES_DES_CAS =[...new Set(CAS_PARTICULIERS.flatMap(cas => cas.roles))]
  .sort((a, b) => ROLES[a].titre.localeCompare(ROLES[b].titre));

export function Explications({ donnees }: { donnees: Donnees }) {
  // "" = pas de filtre.
  const [filtreCarte, setFiltreCarte] = useState("");
  const [filtreCas, setFiltreCas] = useState("");
  // Ce qui est ouvert en modale (null = rien).
  const [carteOuverte, setCarteOuverte] = useState<string | null>(null);
  const [evenementOuvert, setEvenementOuvert] = useState<Evenement | null>(null);
  const [casOuvert, setCasOuvert] = useState<CasParticulier | null>(null);

  // Titre et image choisis dans les options, sinon ceux du code.
  // ATTENTION : "||" et pas "??" : un titre vidé ("") doit revenir au titre du code.
  const titreDe = (alias: string) => donnees.cartes[alias]?.titre || ROLES[alias].titre;
  const imageDe = (alias: string) => donnees.cartes[alias]?.image || ROLES[alias].image;

  const casAffiches = filtreCas ? CAS_PARTICULIERS.filter(cas => cas.roles.includes(filtreCas)) : CAS_PARTICULIERS;

  return (
    <div className="page explications">
      <section>
        <h2>Règles</h2>
        <Regles />
      </section>

      <section>
        <h2>Fin du jeu</h2>
        <p className="aide">Chaque façon de gagner la partie, et comment s'y prendre.</p>
        <FinsDuJeu imageDe={imageDe} />
      </section>

      <section>
        <div className="titre-section">
          {/* Le filtre AVANT le titre, comme demandé : on choisit une carte, puis on lit. */}
          <select className="champ filtre" value={filtreCarte} onChange={e => setFiltreCarte(e.target.value)} aria-label="Afficher une seule carte">
            <option value="">Toutes les cartes</option>
            {ORDRE_GROUPES.map(groupe => {
              const roles = LISTE_ROLES.filter(role => groupeDe(role) === groupe);
              if (roles.length === 0) return null;
              return (
                <optgroup key={groupe} label={LIBELLES_GROUPES[groupe]}>
                  {roles.map(role => <option key={role.alias} value={role.alias}>{titreDe(role.alias)}</option>)}
                </optgroup>
              );
            })}
          </select>
          <button className="bouton bouton-discret bouton-petit" onClick={() => setFiltreCarte("")} disabled={!filtreCarte} aria-label="Enlever le filtre">×</button>
          <h2>Cartes</h2>
        </div>

        {/* Même regroupement que les options : un titre et une grille par groupe. */}
        {ORDRE_GROUPES.map(groupe => {
          const roles = LISTE_ROLES.filter(role => groupeDe(role) === groupe && (!filtreCarte || role.alias === filtreCarte));
          if (roles.length === 0) return null;
          return (
            <div key={groupe}>
              <h3>{LIBELLES_GROUPES[groupe]}</h3>
              {groupe === "hybride" && <p className="aide">{TEXTE_HYBRIDES} Le camp choisi n'est jamais révélé.</p>}
              <div className="grille-pastilles">
                {roles.map(role => (
                  <PastilleCarte
                    key={role.alias}
                    role={role}
                    titre={titreDe(role.alias)}
                    image={imageDe(role.alias)}
                    ouvrir={() => setCarteOuverte(role.alias)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <h2>Événements</h2>
        <p className="aide">Tirés chaque jour après l'élection du maire. L'oracle peut en demander un autre, ou passer.</p>
        <div className="liste-evenements">
          {Object.values(EVENEMENTS).map(evenement => (
            <button key={evenement.alias} className="ligne-cliquable" onClick={() => setEvenementOuvert(evenement)}>
              <Visuel src={evenement.image} nom={evenement.titre} taille={40} />
              <span>
                <strong>{evenement.titre}</strong>
                <span className="aide"> — {evenement.description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="titre-section">
          <select className="champ filtre" value={filtreCas} onChange={e => setFiltreCas(e.target.value)} aria-label="Cas d'une seule carte">
            <option value="">Toutes les cartes</option>
            {ROLES_DES_CAS.map(alias => <option key={alias} value={alias}>{titreDe(alias)}</option>)}
          </select>
          <button className="bouton bouton-discret bouton-petit" onClick={() => setFiltreCas("")} disabled={!filtreCas} aria-label="Enlever le filtre">×</button>
          <h2>Cas particuliers</h2>
        </div>
        <div className="grille-cas">
          {casAffiches.map(cas => (
            <button key={cas.titre} className="cas" onClick={() => setCasOuvert(cas)}>
              <h3>{cas.titre}</h3>
              <p className="aide">{cas.contexte}</p>
              <span className="badges">
                {cas.roles.map(alias => (
                  <span key={alias} className={`badge camp-${ROLES[alias].camp}`}>{titreDe(alias)}</span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </section>

      {carteOuverte && (
        <FicheCarte
          role={ROLES[carteOuverte]}
          titre={titreDe(carteOuverte)}
          image={imageDe(carteOuverte)}
          fermer={() => setCarteOuverte(null)}
        />
      )}
      {evenementOuvert && <FicheEvenement evenement={evenementOuvert} fermer={() => setEvenementOuvert(null)} />}
      {casOuvert && <FicheCas cas={casOuvert} titreDe={titreDe} imageDe={imageDe} fermer={() => setCasOuvert(null)} />}
    </div>
  );
}

/* =====================================================================================
 *  Règles de base
 * ===================================================================================== */

function Regles() {
  return (
    <div className="regles">
      <p>
        Au temps de l'Empire inca, un village des Andes s'endort au pied des montagnes. Mais quand Inti, le Soleil,
        disparaît, des loups-garous sortent de l'ombre : ils se cachent parmi les villageois et dévorent l'un d'eux chaque nuit.
        <em> Paqari</em>, c'est l'aube en quechua, la langue des Incas : le moment où le village découvre qui la nuit a emporté.
      </p>
      <p>
        Chaque joueur reçoit une carte secrète : elle dit son camp et son pouvoir. L'oracle, qui utilise cette application,
        connaît toutes les cartes et guide la partie.
      </p>
      <h3>Les camps</h3>
      <p>
        Le village et les loups s'affrontent, mais d'autres peuvent leur voler la victoire : le Fou, le Skinwalker,
        l'Aberration, les amoureux. Chaque façon de gagner est détaillée juste en dessous, dans la partie <em>Fin du jeu</em>.
      </p>
      <h3>La nuit</h3>
      <p>
        Mama Killa, la Lune, se lève et tout le monde ferme les yeux. L'oracle appelle les cartes une par une, dans l'ordre de leur priorité :
        chacune ouvre les yeux, agit en silence en désignant un joueur, puis se rendort.
        Les loups se réveillent ensemble et choisissent une victime à dévorer.
      </p>
      <h3>L'aube</h3>
      <p>
        Inti se lève et le village se réveille. L'oracle annonce qui est mort cette nuit, et révèle sa carte.
        Un joueur mort ne parle plus et ne vote plus jusqu'à la fin de la partie.
      </p>
      <h3>Le jour</h3>
      <ol>
        <li><strong>Élection du maire</strong> : le premier jour, et chaque fois qu'il n'y a plus de maire, le village en élit un.</li>
        <li><strong>Événement</strong> : un événement du jour est tiré ; il change les règles de la journée.</li>
        <li><strong>Débat</strong> : chacun accuse, se défend, bluffe. Un minuteur limite la discussion.</li>
        <li><strong>Vote</strong> : le village élimine un joueur, qui révèle sa carte. Il peut aussi n'éliminer personne.</li>
      </ol>
      <p>Puis la nuit retombe, jusqu'à ce qu'un camp gagne.</p>
      <h3>Les liens et les tags</h3>
      <p>
        Les pouvoirs laissent des marques sur les joueurs (mordu, protégé, amoureux, maudit…), visibles de l'oracle sur la table.
        C'est leur combinaison qui crée les cas particuliers expliqués plus bas.
      </p>
      {/* Les amoureux sont expliqués dans la partie « Fin du jeu » (finsDuJeu.ts). */}
      <h3>Les cartes hybrides</h3>
      <p>{TEXTE_HYBRIDES}</p>
      <p>
        Le camp choisi n'est jamais révélé : à la mort d'un Prêtre, on annonce « Prêtre », pas « pur » ou « impur ».
        Même chose pour le Beau Parleur et le Rat.
      </p>
      <h3>Les cartes partagées</h3>
      <p>
        La Pleureuse, le Fêtard, le Marchand et le Bâtisseur partagent la même carte. À la mort de l'un d'eux, le village
        apprend seulement qu'un villageois est mort : seuls le joueur et l'oracle savent lequel des quatre rôles c'était.
      </p>
    </div>
  );
}

/* =====================================================================================
 *  Fin du jeu : comment chacun gagne
 * ===================================================================================== */

/**
 * Une carte par façon de gagner : image, titre, badge du camp, conditions de victoire, conseils.
 * @param imageDe l'image d'une carte, telle que choisie dans les options
 * FLUX des conseils : écrits dans la fin (fin.conseils), ou repris de la carte (fin.conseilDeLaCarte,
 * lu dans ROLES). « ?? [] » : une carte sans conseil donne une liste vide, et l'encadré n'apparaît pas.
 */
function FinsDuJeu({ imageDe }: { imageDe: (alias: string) => string }) {
  return (
    <div className="grille-fins">
      {FINS_DU_JEU.map(fin => {
        const conseils = fin.conseilDeLaCarte ? ROLES[fin.conseilDeLaCarte].conseil ?? [] : fin.conseils ?? [];
        const image = fin.carte ? imageDe(fin.carte) : fin.image;
        // « amoureux » n'est pas un Camp du moteur : son libellé est écrit ici.
        const libelleDuCamp = fin.camp === "amoureux" ? "Amoureux" : LIBELLES_CAMPS[fin.camp];
        return (
          <article key={fin.titre} className="fin-du-jeu">
            <div className="fin-du-jeu-entete">
              <Visuel src={image} nom={fin.titre} taille={48} />
              <h3>{fin.titre}</h3>
              <span className={`badge camp-${fin.camp}`}>{libelleDuCamp}</span>
            </div>
            {fin.victoire.map((ligne, index) => <p key={index}>{ligne}</p>)}
            {conseils.length > 0 && <BlocConseil lignes={conseils} />}
          </article>
        );
      })}
    </div>
  );
}

/* =====================================================================================
 *  Modale d'un événement
 * ===================================================================================== */

function FicheEvenement({ evenement, fermer }: { evenement: Evenement; fermer: () => void }) {
  return (
    <Modale fermer={fermer}>
      <div className="fiche-entete">
        <Visuel src={evenement.image} nom={evenement.titre} taille={112} />
        <div>
          <h2>{evenement.titre}</h2>
          <div className="badges">
            {/* Ce que l'événement fait dans le moteur, lu dans ses champs. */}
            {evenement.decision && <span className="badge">le maire désigne</span>}
            {typeof evenement.minuteur === "number" && <span className="badge">débat de {evenement.minuteur} min</span>}
            {evenement.minuteur === null && <span className="badge">pas de minuteur</span>}
            {evenement.force && <span className="badge">imposé</span>}
          </div>
        </div>
      </div>
      <p className="fiche-resume">{evenement.description}</p>
      {evenement.explication?.map((ligne, index) => <p key={index}>{ligne}</p>)}
    </Modale>
  );
}

/* =====================================================================================
 *  Modale d'un cas particulier
 * ===================================================================================== */

function FicheCas({ cas, titreDe, imageDe, fermer }: {
  cas: CasParticulier;
  titreDe: (alias: string) => string;
  imageDe: (alias: string) => string;
  fermer: () => void;
}) {
  // RÉUTILISABLE : la même Table que la partie, avec des sièges fabriqués à partir du cas.
  // key = index : deux sièges peuvent porter la même carte (deux loups), et la liste ne bouge pas.
  const sieges: Siege[] = cas.table.map((siege, index) => ({
    id: String(index),
    classe: siege.tags?.includes("mort") ? "siege-mort" : undefined,
    contenu: (
      <>
        <Visuel src={imageDe(siege.role)} nom={titreDe(siege.role)} taille={36} />
        <span className="siege-nom">{titreDe(siege.role)}</span>
        {siege.tags && (
          <span className="siege-tags">
            {siege.tags.map(tag => <span key={tag} className={`tag tag-${tag}`}>{TAGS[tag] ?? tag}</span>)}
          </span>
        )}
      </>
    )
  }));

  return (
    <Modale fermer={fermer}>
      <h2>{cas.titre}</h2>
      <p className="fiche-resume">{cas.contexte}</p>
      <div className="table-cas">
        <Table sieges={sieges} />
      </div>
      <ol className="etapes">
        {cas.etapes.map((etape, index) => (
          <li key={index}>
            <p>{etape.quoi}</p>
            <p className="aide"><strong>Pourquoi :</strong> {etape.pourquoi}</p>
          </li>
        ))}
      </ol>
      <div className="badges">
        {cas.roles.map(alias => (
          <span key={alias} className={`badge camp-${ROLES[alias].camp}`}>{LIBELLES_CAMPS[ROLES[alias].camp]} · {titreDe(alias)}</span>
        ))}
      </div>
    </Modale>
  );
}
