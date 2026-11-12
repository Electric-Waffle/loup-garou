// npm run scenario : affiche le journal du cas particulier, comme le verrait l'oracle.
import { nuitDeux, nuitUn } from "./scenario";

const p = nuitUn();
const debut = p.journal.length;
nuitDeux(p);

for (const e of p.journal.slice(debut)) {
  const nom = e.joueur ? p.joueur(e.joueur).nom : "";
  const indent = "  ".repeat(e.profondeur ?? 0);
  const details = [
    e.source && `source=${e.source}`,
    e.cause && `cause=${e.cause}`,
    e.raison && `raison="${e.raison}"`,
    e.en && `en=${e.en}`
  ].filter(Boolean).join(" ");
  const ligne = e.tag ? `${e.type} ${e.tag} → ${nom}` : `${e.type} ${e.texte ?? ""}`;
  console.log(`[${e.phase.padEnd(9)}] ${indent}${ligne}${details ? `  (${details})` : ""}`);
}
console.log(`\nVainqueur : ${p.vainqueur}`);
