import fs from "fs";
import path from "path";
import sharp from "sharp";
import chokidar from "chokidar";
import crypto from "node:crypto";

sharp.cache(false);

const INPUT_DIR = path.resolve(process.cwd(), "images-originals");
const OUTPUT_DIR = path.resolve(process.cwd(), "public", "assets", "images");
const SIZE = 96;
const WEBP_QUALITY = 85;
const AVIF_QUALITY = 60;
const CACHE_FILE = path.join(OUTPUT_DIR, ".image-cache.json");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function loadCache() {
  try {
    ensureDir(OUTPUT_DIR);
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { version: 1, files: {} };
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {}
}

function relKey(inputPath) {
  return path.relative(INPUT_DIR, inputPath).split(path.sep).join("/");
}

function hashFile(p) {
  const buf = fs.readFileSync(p);
  return crypto.createHash("sha1").update(buf).digest("hex");
}

const cache = loadCache();

function relOutPaths(inputPath) {
  const rel = path.relative(INPUT_DIR, inputPath);
  const dirname = path.dirname(rel);
  const base = path.basename(rel, path.extname(rel));
  const outDir = path.join(OUTPUT_DIR, dirname);
  return {
    outDir,
    png: path.join(outDir, base + ".png"),
    webp: path.join(outDir, base + ".webp"),
    avif: path.join(outDir, base + ".avif"),
  };
}

function isUpToDate(inputPath, outPaths, currentHash) {
  try {
    const key = relKey(inputPath);
    const meta = cache.files ? cache.files[key] : undefined;
    const outputsExist = [outPaths.png, outPaths.webp, outPaths.avif].every((p) => fs.existsSync(p));
    if (!outputsExist) {
      return false;
    }
    const cfg = `${SIZE}|${WEBP_QUALITY}|${AVIF_QUALITY}`;
    const hash = currentHash || hashFile(inputPath);
    if (!meta) {
      return false;
    }
    if (meta.hash !== hash) {
      return false;
    }
    if (meta.cfg !== cfg) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function removeEmptyDirs(dir) {
  let current = dir;
  while (current.startsWith(OUTPUT_DIR)) {
    if (!fs.existsSync(current)) {
      break;
    }
    const entries = fs.readdirSync(current);
    if (entries.length > 0) {
      break;
    }
    try {
      fs.rmdirSync(current);
    } catch {}
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
}

async function processFile(inputPath) {
  if (!inputPath.toLowerCase().endsWith(".png")) {
    return false;
  }
  const out = relOutPaths(inputPath);
  const currentHash = hashFile(inputPath);
  if (isUpToDate(inputPath, out, currentHash)) {
    return false;
  }
  try {
    ensureDir(out.outDir);
    await sharp(inputPath).resize(SIZE, SIZE, { fit: "cover" }).png({ compressionLevel: 9 }).toFile(out.png);
    await sharp(inputPath).resize(SIZE, SIZE, { fit: "cover" }).webp({ quality: WEBP_QUALITY }).toFile(out.webp);
    await sharp(inputPath).resize(SIZE, SIZE, { fit: "cover" }).avif({ quality: AVIF_QUALITY }).toFile(out.avif);
    const key = relKey(inputPath);
    cache.files[key] = { hash: currentHash, cfg: `${SIZE}|${WEBP_QUALITY}|${AVIF_QUALITY}` };
    saveCache();
    return true;
  } catch {
    return false;
  }
}

function removeOutputs(inputPath) {
  const out = relOutPaths(inputPath);
  try {
    fs.unlinkSync(out.png);
  } catch {}
  try {
    fs.unlinkSync(out.webp);
  } catch {}
  try {
    fs.unlinkSync(out.avif);
  } catch {}
  const key = relKey(inputPath);
  if (cache.files && cache.files[key]) {
    delete cache.files[key];
    saveCache();
  }
  removeEmptyDirs(out.outDir);
}

function pruneOrphans() {
  const keys = Object.keys(cache.files || {});
  if (keys.length === 0) {
    return 0;
  }
  let removedCount = 0;
  for (const key of keys) {
    const absIn = path.join(INPUT_DIR, key);
    if (!fs.existsSync(absIn)) {
      const out = relOutPaths(absIn);
      try {
        fs.unlinkSync(out.png);
      } catch {}
      try {
        fs.unlinkSync(out.webp);
      } catch {}
      try {
        fs.unlinkSync(out.avif);
      } catch {}
      delete cache.files[key];
      removeEmptyDirs(out.outDir);
      removedCount++;
    }
  }
  if (removedCount > 0) {
    saveCache();
  }
  return removedCount;
}

function isPng(p) {
  return p.toLowerCase().endsWith(".png");
}

function walkDir(dir, list = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const res = path.join(dir, e.name);
      if (e.isDirectory()) {
        walkDir(res, list);
      } else {
        if (e.isFile() && isPng(res)) {
          list.push(res);
        }
      }
    }
  } catch {}
  return list;
}

async function optimizeAll() {
  ensureDir(OUTPUT_DIR);
  if (!fs.existsSync(INPUT_DIR)) {
    const pruned = pruneOrphans();
    return { processed: 0, pruned };
  }
  function walk(dir, list = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const res = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(res, list);
      } else {
        if (e.isFile() && res.toLowerCase().endsWith(".png")) {
          list.push(res);
        }
      }
    }
    return list;
  }
  const files = walk(INPUT_DIR);
  let processed = 0;
  for (const f of files) {
    const did = await processFile(f);
    if (did) {
      processed++;
    }
  }
  const pruned = pruneOrphans();
  return { processed, pruned };
}

async function startWatch() {
  ensureDir(OUTPUT_DIR);
  const watcher = chokidar.watch(INPUT_DIR, {
    ignoreInitial: true,
    depth: Infinity,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 50 },
  });
  watcher.on("add", async (p) => {
    if (isPng(p)) {
      await processFile(p);
    }
  });
  watcher.on("change", async (p) => {
    if (isPng(p)) {
      await processFile(p);
    }
  });
  watcher.on("unlink", (p) => {
    if (isPng(p)) {
      removeOutputs(p);
    }
  });
  watcher.on("addDir", async (dir) => {
    setTimeout(async () => {
      const files = walkDir(dir);
      for (const f of files) {
        await processFile(f);
      }
    }, 300);
  });
  watcher.on("unlinkDir", (dir) => {
    pruneOrphans();
    const rel = path.relative(INPUT_DIR, dir);
    if (rel && rel !== "." && rel !== "..") {
      const outDir = path.join(OUTPUT_DIR, rel);
      try {
        fs.rmSync(outDir, { recursive: true, force: true });
      } catch {}
      removeEmptyDirs(path.dirname(outDir));
    }
  });
  console.log("watching", INPUT_DIR);
}

(async () => {
  const watch = process.argv.includes("--watch");
  const summary = await optimizeAll();
  console.log(`images processed: ${summary.processed}, pruned: ${summary.pruned}`);
  if (watch) {
    await startWatch();
  }
})();
