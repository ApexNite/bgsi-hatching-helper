import fs from "fs";
import path from "path";
import { createHash } from "crypto";

const ROOT = process.cwd();
const DATA_PATH = path.resolve(ROOT, "data");
const PUBLIC_PATH = path.resolve(ROOT, "public", "assets", "data");
const SRC_PATH = path.resolve(ROOT, "src", "data");

function clearDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  } else {
    fs.rmSync(dir, { recursive: true, force: true });
  }
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

if (fs.existsSync(PUBLIC_PATH)) {
  fs.rmSync(PUBLIC_PATH, { recursive: true, force: true });
}
if (fs.existsSync(SRC_PATH)) {
  fs.rmSync(SRC_PATH, { recursive: true, force: true });
}

clearDir(PUBLIC_PATH);
clearDir(SRC_PATH);

fs.cpSync(DATA_PATH, PUBLIC_PATH, { recursive: true });
fs.cpSync(DATA_PATH, SRC_PATH, { recursive: true });

const dataHash = computeHash(DATA_PATH);
const lastUpdated = new Date().toISOString();

const publicHashPath = path.join(PUBLIC_PATH, "hash.json");
const srcHashPath = path.join(SRC_PATH, "hash.json");

writeHashFile(publicHashPath, dataHash, lastUpdated);
writeHashFile(srcHashPath, dataHash, lastUpdated);
