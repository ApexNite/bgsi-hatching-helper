import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createHash } from "crypto";
import { existsSync, readdirSync, readFileSync, lstatSync } from "fs";
import { join, relative } from "path";

const ignore = ["dist", "images-originals", "node_modules", "README.md"];

function isIncluded(path) {
  return (
    path
      .split(/[\\/]/)
      .every(
        (segment) => !ignore.includes(segment) && !segment.startsWith("."),
      ) && !lstatSync(path).isDirectory()
  );
}

function computeBuildHash() {
  const hash = createHash("sha256");
  const root = process.cwd();
  const files = readdirSync(root, { recursive: true })
    .map((f) => join(root, f))
    .filter(existsSync)
    .filter(isIncluded)
    .sort();

  for (const file of files) {
    console.log(file);
    hash.update(relative(root, file));
    hash.update(readFileSync(file));
  }

  return hash.digest("hex").slice(0, 16);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_HASH__: JSON.stringify(computeBuildHash()),
  },
});
