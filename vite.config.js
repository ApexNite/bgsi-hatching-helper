import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createHash } from "crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  lstatSync,
  writeFileSync,
  mkdirSync,
} from "fs";
import { join, relative, dirname } from "path";

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

function computeDataHash() {
  const root = process.cwd();
  const dataPath = join(root, "public", "assets", "data");
  return computeHash(dataPath);
}

function computeProjectHash() {
  const root = process.cwd();
  return computeHash(root, [
    "dist",
    "images-originals",
    "node_modules",
    "README.md",
  ]);
}

function writeHashFile(path, hashValue) {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, hashValue, "utf8");
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    {
      name: "write-hashes",
      buildStart() {
        const root = process.cwd();
        const dataHash = computeDataHash();
        const projectHash = computeProjectHash();
        const dataPath = join(root, "public", "assets", "data", ".data-hash");
        const projectPath = join(root, "public", ".project-hash");

        writeHashFile(dataPath, dataHash);
        writeHashFile(projectPath, projectHash);
      },
    },
  ],
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_HASH__: JSON.stringify(computeSourceHash()),
  },
});
