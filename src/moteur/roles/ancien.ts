import type { Role } from "../types";

// L'Ancien n'agit jamais : toute sa logique est côté RECEVOIR.
// La première fois qu'il devrait mourir d'une morsure, la mort est transformée en "vie_perdue".
const ancien: Role = {
  alias: "ancien",
  titre: "Ancien",
  image: "👴",
  camp: "village",
  description: "Il survit à la première attaque des loups. Le poison, le vote ou le chagrin le tuent normalement.",

  recevoir(tag, meta, r, partie, moi) {
    if (tag === "mort" && meta.cause === "mordu" && !partie.aTag(moi, "vie_perdue")) {
      return r.transformer("vie_perdue");
    }
    // sinon : rien, on laisse les règles générales décider
  }
};

export default ancien;
