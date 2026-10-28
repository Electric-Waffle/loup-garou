import { LISTE_ROLES } from "../moteur/roles";
import type { Tours } from "../moteur/types";
import type { CarteReglage, Donnees, JoueurProfil } from "./stockage";
import { nouvelId } from "./stockage";
import { ChoixImage, Visuel } from "./Visuel";

const CAMPS = { village: "Village", loups: "Loups", solo: "Solo" } as const;

function libelleTours(t?: Tours): string {
  if (!t) return "toutes les nuits";
  if (t.de !== undefined && t.de === t.a) return `nuit ${t.de} uniquement`;
  const morceaux = [t.de && `dès la nuit ${t.de}`, t.a && `jusqu'à la nuit ${t.a}`, t.chaque && `une nuit sur ${t.chaque}`];
  return morceaux.filter(Boolean).join(", ");
}

export function Options({ donnees, modifier }: { donnees: Donnees; modifier: (d: Donnees) => void }) {
  function reglerCarte(alias: string, patch: Partial<CarteReglage>) {
    modifier({ ...donnees, cartes: { ...donnees.cartes, [alias]: { ...donnees.cartes[alias], ...patch } } });
  }

  function reglerJoueur(id: string, patch: Partial<JoueurProfil>) {
    modifier({ ...donnees, joueurs: donnees.joueurs.map(j => (j.id === id ? { ...j, ...patch } : j)) });
  }

  function ajouterJoueur() {
    const j = { id: nouvelId(), nom: `Joueur ${donnees.joueurs.length + 1}`, image: "" };
    modifier({ ...donnees, joueurs: [...donnees.joueurs, j], table: [...donnees.table, j.id], distribution: {} });
  }

  function supprimerJoueur(id: string) {
    modifier({
      ...donnees,
      joueurs: donnees.joueurs.filter(j => j.id !== id),
      table: donnees.table.filter(t => t !== id),
      distribution: {}
    });
  }

  return (
    <div className="page">
      <section>
        <h2>Cartes</h2>
        <p className="aide">
          Les règles de chaque carte sont dans <code>src/moteur/roles/</code>. Ici, on ne change que le titre, l'image et l'activation.
        </p>
        <div className="grille-cartes">
          {LISTE_ROLES.map(role => {
            const reglage = donnees.cartes[role.alias] ?? { active: true };
            return (
              <article key={role.alias} className={`carte ${reglage.active ? "" : "carte-inactive"}`}>
                <div className="carte-entete">
                  <Visuel src={reglage.image || role.image} nom={role.titre} taille={64} />
                  <label className="interrupteur">
                    <input
                      type="checkbox"
                      checked={reglage.active}
                      onChange={e => reglerCarte(role.alias, { active: e.target.checked })}
                    />
                    <span>{reglage.active ? "Activée" : "Désactivée"}</span>
                  </label>
                </div>
                <input
                  className="champ"
                  value={reglage.titre ?? ""}
                  placeholder={role.titre}
                  onChange={e => reglerCarte(role.alias, { titre: e.target.value })}
                  aria-label={`Titre de ${role.titre}`}
                />
                <p className="carte-description">{role.description}</p>
                <div className="badges">
                  <span className="badge">alias : {role.alias}</span>
                  <span className={`badge camp-${role.camp}`}>{CAMPS[role.camp]}</span>
                  {role.appelNuit && <span className="badge">priorité {role.priorite}</span>}
                  {role.appelNuit && <span className="badge">{libelleTours(role.tours)}</span>}
                </div>
                <div className="actions">
                  <ChoixImage onImage={image => reglerCarte(role.alias, { image })} />
                  {(reglage.image || reglage.titre) && (
                    <button className="bouton bouton-discret" onClick={() => reglerCarte(role.alias, { image: undefined, titre: undefined })}>
                      Réinitialiser
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Joueurs</h2>
        <ul className="liste-joueurs">
          {donnees.joueurs.map(j => (
            <li key={j.id}>
              <Visuel src={j.image} nom={j.nom} taille={44} />
              <input className="champ" value={j.nom} onChange={e => reglerJoueur(j.id, { nom: e.target.value })} aria-label="Nom du joueur" />
              <ChoixImage onImage={image => reglerJoueur(j.id, { image })} />
              <button className="bouton bouton-danger" onClick={() => supprimerJoueur(j.id)} aria-label={`Supprimer ${j.nom}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
        <button className="bouton" onClick={ajouterJoueur}>+ Ajouter un joueur</button>
      </section>
    </div>
  );
}
