import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" : le build fonctionne aussi ouvert depuis un dossier quelconque.
export default defineConfig({
  plugins: [react()],
  base: "./"
});
