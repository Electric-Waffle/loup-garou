/* =====================================================================================
 *  Modale.tsx — une fenêtre par-dessus la page, fermée par la croix, Échap ou un clic à côté
 * =====================================================================================
 *
 *  PATTERN : composant « coquille ». La Modale ne sait rien de ce qu'elle affiche : elle reçoit
 *  `children` (le contenu) et `fermer` (ce que le parent fait quand elle se ferme).
 *  POURQUOI l'élément natif <dialog> : showModal() fournit gratuitement le fond assombri
 *  (::backdrop), la fermeture par Échap, le focus gardé dans la fenêtre et l'accessibilité.
 *  Une <div> positionnée demanderait de recoder tout ça.
 *
 *  FLUX : le parent affiche <Modale> quand il veut l'ouvrir (rendu conditionnel), et la retire
 *  dans `fermer`. Toute fermeture (croix, Échap, clic sur le fond) passe par l'événement
 *  « close » du dialog, donc par un seul endroit : l'écouteur posé dans l'effet.
 * ===================================================================================== */

import { useEffect, useRef, type ReactNode } from "react";

export function Modale({ fermer, children }: { fermer: () => void; children: ReactNode }) {
  // CONCEPT : useRef donne accès à l'élément HTML réel, pour appeler ses méthodes (showModal, close).
  const dialogue = useRef<HTMLDialogElement>(null);

  // POURQUOI dans un effet : l'élément n'existe dans la page qu'APRÈS le rendu.
  // ATTENTION : l'événement « close » est écouté à la main. La prop onClose de React ne le reçoit
  // pas ici (vérifié dans le navigateur) : le dialog se fermait, mais le parent n'en savait rien
  // et la modale restait dans la page, fermée, sans pouvoir se rouvrir.
  // POURQUOI fermer n'est pas dans les dépendances : la modale est créée à l'ouverture et détruite
  // à la fermeture ; le fermer du premier rendu suffit (il ne fait que remettre l'état à null).
  useEffect(() => {
    const element = dialogue.current;
    if (!element) return;
    element.showModal();
    element.addEventListener("close", fermer);
    // CONCEPT : la fonction renvoyée par un effet est son nettoyage, appelé quand la modale disparaît.
    return () => element.removeEventListener("close", fermer);
  }, []);

  return (
    <dialog
      ref={dialogue}
      className="modale"
      // Clic sur le fond : la cible est le <dialog> lui-même, pas son contenu
      // (le contenu remplit toute la boîte, voir .modale-contenu dans styles.css).
      onClick={evenement => {
        if (evenement.target === dialogue.current) dialogue.current?.close();
      }}
    >
      <div className="modale-contenu">
        <button className="modale-fermer" onClick={() => dialogue.current?.close()} aria-label="Fermer">×</button>
        {children}
      </div>
    </dialog>
  );
}
