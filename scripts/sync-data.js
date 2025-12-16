import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import { createHash } from "crypto";

const ROOT = process.cwd();
const DATA_PATH = path.resolve(ROOT, "data");
const PUBLIC_PATH = path.resolve(ROOT, "public", "assets", "data");
const SRC_PATH = path.resolve(ROOT, "src", "data");
const CACHE_FILE = path.join(DATA_PATH, ".data-cache.json");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function computeHash(root) {
  const hash = createHash("sha256");
  const files = fs
    .readdirSync(root, { recursive: true })
    .map((f) => path.join(root, f))
    .filter(fs.existsSync)
    .filter((filePath) => !fs.lstatSync(filePath).isDirectory())
    .sort();

  for (const file of files) {
    hash.update(path.relative(root, file));
    hash.update(fs.readFileSync(file));
  }

  return hash.digest("hex").slice(0, 16);
}

function writeHashFile(filePath, hashValue, lastUpdated) {
  const obj = {
    hash: hashValue,
    lastUpdated: lastUpdated,
  };

  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
}

function loadCache() {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { version: 1, files: {}, hash: null, lastUpdated: null };
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {}
}

function relKey(inputPath) {
  const rel = path.relative(DATA_PATH, inputPath);
  return rel.split(path.sep).join("/");
}

function fileHash(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return createHash("sha256").update(buf).digest("hex");
  } catch {
    return null;
  }
}

function isFile(p) {
  try {
    return fs.existsSync(p) && fs.lstatSync(p).isFile();
  } catch {
    return false;
  }
}

function removeEmptyDirs(rootDir, dir) {
  let current = dir;

  while (current.startsWith(rootDir)) {
    if (!fs.existsSync(current)) break;
    const entries = fs.readdirSync(current);
    if (entries.length > 0) break;
    try {
      fs.rmdirSync(current);
    } catch {}
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
}

const cache = loadCache();

function outPaths(inputPath) {
  const rel = path.relative(DATA_PATH, inputPath);
  const outPublic = path.join(PUBLIC_PATH, rel);
  const outSrc = path.join(SRC_PATH, rel);
  return {
    rel,
    public: outPublic,
    src: outSrc,
    publicDir: path.dirname(outPublic),
    srcDir: path.dirname(outSrc),
  };
}

function isUpToDate(inputPath, out, currentHash) {
  try {
    const key = relKey(inputPath);
    const meta = cache.files ? cache.files[key] : undefined;

    const outputsExist =
      fs.existsSync(out.public) &&
      fs.existsSync(out.src) &&
      isFile(out.public) &&
      isFile(out.src);

    if (!outputsExist) return false;

    const hash = currentHash || fileHash(inputPath);
    if (!hash || !meta) return false;
    if (meta.hash !== hash) return false;

    return true;
  } catch {
    return false;
  }
}

function copyToOutputs(inputPath) {
  const out = outPaths(inputPath);
  ensureDir(out.publicDir);
  ensureDir(out.srcDir);

  fs.copyFileSync(inputPath, out.public);
  fs.copyFileSync(inputPath, out.src);

  const key = relKey(inputPath);
  cache.files[key] = { hash: fileHash(inputPath) };
  saveCache();
}

function removeOutputs(inputPath) {
  const out = outPaths(inputPath);

  try {
    fs.unlinkSync(out.public);
  } catch {}
  try {
    fs.unlinkSync(out.src);
  } catch {}

  const key = relKey(inputPath);
  if (cache.files && cache.files[key]) {
    delete cache.files[key];
    saveCache();
  }

  removeEmptyDirs(PUBLIC_PATH, out.publicDir);
  removeEmptyDirs(SRC_PATH, out.srcDir);
}

function walkDir(dir, list = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const e of entries) {
      const res = path.join(dir, e.name);

      if (e.isDirectory()) {
        walkDir(res, list);
      } else {
        if (e.isFile()) {
          list.push(res);
        }
      }
    }
  } catch {}

  return list;
}

function pruneOrphans() {
  const keys = Object.keys(cache.files || {});
  if (keys.length === 0) return 0;

  let removedCount = 0;

  for (const key of keys) {
    const absIn = path.join(DATA_PATH, ...key.split("/"));

    if (!fs.existsSync(absIn)) {
      const out = outPaths(absIn);

      try {
        fs.unlinkSync(out.public);
      } catch {}
      try {
        fs.unlinkSync(out.src);
      } catch {}

      delete cache.files[key];
      removeEmptyDirs(PUBLIC_PATH, out.publicDir);
      removeEmptyDirs(SRC_PATH, out.srcDir);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    saveCache();
  }

  return removedCount;
}

function updateHashFiles() {
  try {
    const dataHash = computeHash(DATA_PATH);
    const lastUpdated = new Date().toISOString();

    const publicHashPath = path.join(PUBLIC_PATH, "hash.json");
    const srcHashPath = path.join(SRC_PATH, "hash.json");

    ensureDir(PUBLIC_PATH);
    ensureDir(SRC_PATH);

    writeHashFile(publicHashPath, dataHash, lastUpdated);
    writeHashFile(srcHashPath, dataHash, lastUpdated);

    cache.hash = dataHash;
    cache.lastUpdated = lastUpdated;
    saveCache();
  } catch {}
}

async function syncAll() {
  ensureDir(PUBLIC_PATH);
  ensureDir(SRC_PATH);

  if (!fs.existsSync(DATA_PATH)) {
    const pruned = pruneOrphans();
    updateHashFiles();
    return { processed: 0, pruned };
  }

  const files = walkDir(DATA_PATH);
  let processed = 0;

  for (const f of files) {
    const out = outPaths(f);
    const currentHash = fileHash(f);

    if (!isUpToDate(f, out, currentHash)) {
      copyToOutputs(f);
      processed++;
    }
  }

  const pruned = pruneOrphans();
  updateHashFiles();
  return { processed, pruned };
}

async function startWatch() {
  ensureDir(PUBLIC_PATH);
  ensureDir(SRC_PATH);

  const watcher = chokidar.watch(DATA_PATH, {
    ignoreInitial: true,
    depth: Infinity,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 50,
    },
  });

  watcher.on("add", async (p) => {
    if (isFile(p)) {
      const out = outPaths(p);
      if (!isUpToDate(p, out)) {
        copyToOutputs(p);
        updateHashFiles();
      }
    }
  });

  watcher.on("change", async (p) => {
    if (isFile(p)) {
      const out = outPaths(p);
      if (!isUpToDate(p, out)) {
        copyToOutputs(p);
        updateHashFiles();
      }
    }
  });

  watcher.on("unlink", (p) => {
    removeOutputs(p);
    updateHashFiles();
  });

  watcher.on("addDir", async (dir) => {
    setTimeout(async () => {
      const files = walkDir(dir);
      for (const f of files) {
        const out = outPaths(f);
        if (!isUpToDate(f, out)) {
          copyToOutputs(f);
        }
      }
      updateHashFiles();
    }, 300);
  });

  watcher.on("unlinkDir", (dir) => {
    pruneOrphans();
    const rel = path.relative(DATA_PATH, dir);

    if (rel && rel !== "." && rel !== "..") {
      const outPublic = path.join(PUBLIC_PATH, rel);
      const outSrc = path.join(SRC_PATH, rel);
      try {
        fs.rmSync(outPublic, { recursive: true, force: true });
      } catch {}
      try {
        fs.rmSync(outSrc, { recursive: true, force: true });
      } catch {}
      removeEmptyDirs(PUBLIC_PATH, path.dirname(outPublic));
      removeEmptyDirs(SRC_PATH, path.dirname(outSrc));
    }

    updateHashFiles();
  });

  console.log("watching", DATA_PATH);
}

(async () => {
  const watch = process.argv.includes("--watch");
  const summary = await syncAll();
  console.log(`data synced: ${summary.processed}, pruned: ${summary.pruned}`);

  if (watch) {
    await startWatch();
  }
})();
