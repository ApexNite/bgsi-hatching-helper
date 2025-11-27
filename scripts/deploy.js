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
  let uploaded = 0;
  let skipped = 0;
  let deleted = 0;

  if (!host || !username) {
    errors.push("Missing FTP_SERVER or FTP_USERNAME");
    return { uploaded, deleted, skipped, errors };
  }

  if (!fs.existsSync(localRoot)) {
    errors.push("Local dist folder not found");
    return { uploaded, deleted, skipped, errors };
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
    const localRelSet = new Set(localFiles.map(relLocal));

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

    const totalUploads = localFiles.length;
    const totalDeletes = toDelete.length;
    const total = totalUploads + totalDeletes;
    let processed = 0;

    progressBar.start(total, 0, { status: "Uploading..." });

    for (const localFile of localFiles) {
      const rel = relLocal(localFile);
      const remotePath = toRemote(rel);
      const existing = remoteFiles.get(remotePath);

      progressBar.update(processed, { status: `Processing ${rel}` });

      const needsUpload = await shouldUpload(
        client,
        localFile,
        remotePath,
        existing,
      );
      if (!needsUpload) {
        skipped++;
        processed++;
        progressBar.update(processed, { status: `Skipped ${rel}` });
        continue;
      }

      try {
        await client.mkdir(path.posix.dirname(remotePath), true);
        await client.put(localFile, remotePath);
        uploaded++;
        processed++;
        progressBar.update(processed, { status: `Uploaded ${rel}` });
      } catch (e) {
        errors.push(`Failed to upload ${rel}: ${e.message}`);
        processed++;
        progressBar.update(processed, { status: `Error ${rel}` });
      }
    }

    for (const remotePath of toDelete) {
      try {
        progressBar.update(processed, { status: `Deleting ${remotePath}` });
        await client.delete(remotePath);
        deleted++;
      } catch (e) {
        errors.push(`Failed to delete ${remotePath}: ${e.message}`);
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

  return { uploaded, deleted, skipped, errors };
}

(async () => {
  const result = await deploy();
  console.log(
    `files uploaded: ${result.uploaded}, deleted: ${result.deleted}, skipped: ${result.skipped}, errors: ${result.errors.length}`,
  );
  if (result.errors.length > 0) {
    result.errors.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg}`);
    });
  }
})();
