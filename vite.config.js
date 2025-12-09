import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createHash } from "crypto";
import { existsSync, readdirSync, readFileSync, lstatSync } from "fs";
import { join, relative } from "path";

function isIncluded(path, ignore) {
  return (
    path
      .split(/[\\/]/)
      .every(
        (segment) => !ignore.includes(segment) && !segment.startsWith("."),
      ) && !lstatSync(path).isDirectory()
  );
}

function computeHash(root, ignore = []) {
  const hash = createHash("sha256");
  const files = readdirSync(root, { recursive: true })
    .map((f) => join(root, f))
    .filter(existsSync)
    .filter((path) => isIncluded(path, ignore))
    .sort();

  for (const file of files) {
    hash.update(relative(root, file));
    hash.update(readFileSync(file));
  }

  return hash.digest("hex").slice(0, 16);
}

function computeSourceHash() {
  const root = process.cwd();
  const srcPath = join(root, "src");
  return computeHash(srcPath);
}

function computeProjectHash() {
  const root = process.cwd();
  return computeHash(root, ["dist", "assets", "node_modules", "README.md"]);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    __BUILD_HASH__: JSON.stringify(computeSourceHash()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __PROJECT_HASH__: JSON.stringify(computeProjectHash()),
  },
});
