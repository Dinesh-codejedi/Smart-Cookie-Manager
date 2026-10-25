import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function extensionFiles() {
  return {
    name: "extension-files",
    closeBundle() {
      const output = resolve(process.cwd(), "dist");
      mkdirSync(output, { recursive: true });
      const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "manifest.json"), "utf8"));
      manifest.action.default_popup = "popup.html";
      writeFileSync(resolve(output, "manifest.json"), JSON.stringify(manifest, null, 2));
      copyFileSync(resolve(process.cwd(), "content.js"), resolve(output, "content.js"));
    }
  };
}

export default defineConfig({
  root: resolve(process.cwd(), "src"),
  base: "./",
  plugins: [react(), extensionFiles()],
  resolve: { alias: { "@": resolve(process.cwd(), "src") } },
  build: {
    outDir: resolve(process.cwd(), "dist"),
    emptyOutDir: true,
    rollupOptions: { input: resolve(process.cwd(), "src/popup.html") }
  }
});
