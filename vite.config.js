import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: resolve(projectRoot, "index.html"),
        montage: resolve(projectRoot, "montage/index.html"),
      },
    },
  },
});
