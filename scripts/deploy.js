import { config } from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import SFTPClient from "ssh2-sftp-client";
import cliProgress from "cli-progress";

config({ quiet: true });

const localRoot = path.resolve("./dist");
const remoteRoot = process.env.FTP_REMOTE_ROOT;
const host = process.env.FTP_SERVER;
const username = process.env.FTP_USERNAME;
const password = process.env.FTP_PASSWORD;
const port = parseInt(process.env.FTP_PORT);
const ignoreImages = process.argv.includes("--ignore-images");

function calculateHash(data) {
  const hash = crypto.createHash("md5");
  hash.update(data);

  return hash.digest("hex");
}

async function getRemoteHash(client, remotePath) {
  try {
    const buffer = await client.get(remotePath);
    return calculateHash(buffer);
  } catch {
    return null;
  }
}

function walkLocal(dir, list = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (ignoreImages && entry.name === "images") {
        continue;
      }

      if (entry.isDirectory()) {
        walkLocal(full, list);
      } else {
        list.push(full);
      }
    }
  } catch {}

  return list;
}

async function walkRemote(client, base, map = new Map()) {
  try {
    const items = await client.list(base);
    for (const item of items) {
      const full = path.posix.join(base, item.name);
      
      if (ignoreImages && item.name === "images") {
        continue;
      }
      
      if (item.type === "d") {
        await walkRemote(client, full, map);
      } else {
        map.set(full, { size: item.size });
      }
    }
  } catch {}

  return map;
}

function relLocal(p) {
  return path.relative(localRoot, p).split(path.sep).join("/");
}

function toRemote(rel) {
  if (!remoteRoot || remoteRoot === "/") {
    return `/${rel}`;
  }

  return `${remoteRoot.replace(/\/+$/, "")}/${rel}`;
}

async function shouldUpload(client, localFile, remotePath, remoteInfo) {
  if (!remoteInfo) {
    return true;
  }

  const localStat = fs.statSync(localFile);

  if (localStat.size !== remoteInfo.size) {
    return true;
  }

  const localHash = calculateHash(fs.readFileSync(localFile));
  const remoteHash = await getRemoteHash(client, remotePath);

  return !remoteHash || localHash !== remoteHash;
}

async function deploy() {
  const errors = [];
  let newUploaded = 0;
  let updatedUploaded = 0;
  let skipped = 0;
  let deleted = 0;

  if (!host || !username) {
    errors.push("Missing FTP_SERVER or FTP_USERNAME");
    return {
      new: newUploaded,
      updated: updatedUploaded,
      uploaded: newUploaded + updatedUploaded,
      deleted,
      skipped,
      errors,
    };
  }

  if (!fs.existsSync(localRoot)) {
    errors.push("Local dist folder not found");
    return {
      new: newUploaded,
      updated: updatedUploaded,
      uploaded: newUploaded + updatedUploaded,
      deleted,
      skipped,
      errors,
    };
  }

  const client = new SFTPClient();
  const progressBar = new cliProgress.SingleBar({
    format: "Progress |{bar}| {percentage}% | {value}/{total} | {status}",
  });

  try {
    await client.connect({
      host,
      port,
      username,
      password,
      readyTimeout: 30000,
      retries: 2,
    });

    const remoteFiles = await walkRemote(client, remoteRoot);
    const localFiles = walkLocal(localRoot);

    const fileEntries = localFiles.map((localFile) => {
      const rel = relLocal(localFile);
      const remotePath = toRemote(rel);
      const existing = remoteFiles.get(remotePath);
      return { localFile, rel, remotePath, existing };
    });

    const newFiles = fileEntries.filter((f) => !f.existing);
    const existingFiles = fileEntries.filter((f) => f.existing);

    const localRelSet = new Set(fileEntries.map((f) => f.rel));
    const cleanRoot = remoteRoot ? remoteRoot.replace(/\/+$/, "") : "";
    const toDelete = [];
    for (const [remotePath] of remoteFiles) {
      const rel =
        cleanRoot && remotePath.startsWith(cleanRoot + "/")
          ? remotePath.slice(cleanRoot.length + 1)
          : remotePath.slice(1);

      if (!localRelSet.has(rel)) {
        toDelete.push(remotePath);
      }
    }

    const total = newFiles.length + existingFiles.length + toDelete.length;
    let processed = 0;
    progressBar.start(total, 0, { status: "Deploying..." });

    for (const f of newFiles) {
      progressBar.update(processed, { status: `New: ${f.rel}` });
      try {
        await client.mkdir(path.posix.dirname(f.remotePath), true);
        await client.put(f.localFile, f.remotePath);
        newUploaded++;
        processed++;
        progressBar.update(processed, { status: `Uploaded ${f.rel}` });
      } catch (e) {
        errors.push(`Failed to upload new file ${f.rel}: ${e.message}`);
        processed++;
        progressBar.update(processed, { status: `Error upload ${f.rel}` });
      }
    }

    for (const f of existingFiles) {
      progressBar.update(processed, { status: `Update: ${f.rel}` });
      let needsUpload = false;

      needsUpload = await shouldUpload(
        client,
        f.localFile,
        f.remotePath,
        f.existing,
      );

      if (!needsUpload) {
        skipped++;
        processed++;
        progressBar.update(processed, { status: `Skipped ${f.rel}` });
        continue;
      }

      try {
        await client.put(f.localFile, f.remotePath);
        updatedUploaded++;
        processed++;
        progressBar.update(processed, { status: `Updated ${f.rel}` });
      } catch (e) {
        errors.push(`Failed to update ${f.rel}: ${e.message}`);
        processed++;
        progressBar.update(processed, { status: `Error update ${f.rel}` });
      }
    }

    for (const remotePath of toDelete) {
      progressBar.update(processed, { status: `Delete: ${remotePath}` });
      try {
        await client.delete(remotePath);
        deleted++;
      } catch (e) {
        errors.push(`Failed to delete ${remotePath}: ${e.message}`);
        progressBar.update(processed, { status: `Error delete ${remotePath}` });
      } finally {
        processed++;
        progressBar.update(processed, { status: `Deleted ${remotePath}` });
      }
    }

    progressBar.stop();
  } catch (e) {
    progressBar?.stop();
    errors.push(`Connection error: ${e.message}`);
  } finally {
    await client.end();
  }

  return {
    new: newUploaded,
    updated: updatedUploaded,
    uploaded: newUploaded + updatedUploaded,
    deleted,
    skipped,
    errors,
  };
}

(async () => {
  const result = await deploy();
  console.log(
    `new: ${result.new}, updated: ${result.updated}, total uploaded: ${result.uploaded}, deleted: ${result.deleted}, skipped: ${result.skipped}, errors: ${result.errors.length}`,
  );
  if (result.errors.length > 0) {
    result.errors.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg}`);
    });
  }
})();
