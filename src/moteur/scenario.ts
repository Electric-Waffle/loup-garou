import { Partie } from "./partie";

/**
 * Le cas particulier détaillé dans cas-particulier.md :
 * l'Ancien amoureux du Chasseur.
 */
export const TABLE = [
  { id: "alice", nom: "Alice", image: "", role: "salvateur" },
  { id: "bob",   nom: "Bob",   image: "", role: "loup" },
  { id: "chloe", nom: "Chloé", image: "", role: "sorciere" },
  { id: "david", nom: "David", image: "", role: "villageois" },
  { id: "emma",  nom: "Emma",  image: "", role: "ancien" },
  { id: "hugo",  nom: "Hugo",  image: "", role: "chasseur" },
  { id: "ines",  nom: "Inès",  image: "", role: "cupidon" },
  { id: "jules", nom: "Jules", image: "", role: "voyante" }
];

export function nuitUn(): Partie {
  const p = new Partie(TABLE, { aleatoire: () => 0 });
  p.jouer({ id: "lier",     cibles: ["emma", "hugo"] }); // Cupidon
  p.passer();                                            // Réunion des amoureux (60 s)
  p.jouer({ id: "sonder",   cibles: ["bob"] });          // Voyante
  p.jouer({ id: "proteger", cibles: ["david"] });        // Salvateur
  p.jouer({ id: "devorer",  cibles: ["david"] });        // Loup
  p.jouer({ id: "rien",     cibles: [] });               // Sorcière
  p.leverLeJour();
  p.suiteDeLAube();                                      // pas de maire : élection
  p.elire("jules");                                      // puis l'événement est tiré
  p.passerEvenement();                                   // Soleil, quel que soit le tirage
  p.appliquerEvenement();
  p.ouvrirDebat();
  p.ouvrirVote();
  p.voter(null);
  p.nuitSuivante();
  return p;
}

export function nuitDeux(p: Partie): void {
  p.passer();                                            // Réunion des amoureux (60 s)
  p.jouer({ id: "sonder",   cibles: ["chloe"] });        // Voyante
  p.jouer({ id: "proteger", cibles: ["david"] });        // Salvateur (refusé : protégé hier)
  p.jouer({ id: "devorer",  cibles: ["emma"] });         // Loup
  p.jouer({ id: "tuer",     cibles: ["hugo"] });         // Sorcière
  p.leverLeJour();                                       // aube : la cascade
  p.jouer({ id: "tirer",    cibles: ["bob"] });          // Chasseur (décision urgente)
  p.suiteDeLAube();                                      // → vérification de victoire
}
