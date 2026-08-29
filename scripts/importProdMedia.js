#!/usr/bin/env node
/**
 * Fetch media library from old production deployment,
 * download files, re-upload to current deployment, and
 * register each item in the media table.
 *
 * Usage:
 *   node scripts/importProdMedia.js [password]
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const PROD_URL = "https://dependable-octopus-848.convex.cloud";
const BACKUP_DIR = "prod-backup";
const MEDIA_DIR = join(BACKUP_DIR, "media-library");

const envFile = readFileSync(".env.local", "utf-8");
const devUrl = envFile.match(/VITE_CONVEX_URL=(.+)/)?.[1]?.trim();
if (!devUrl) { console.error("No VITE_CONVEX_URL in .env.local"); process.exit(1); }

const prodClient = new ConvexHttpClient(PROD_URL);
const devClient = new ConvexHttpClient(devUrl);
const PASSWORD = process.argv[2] || "daust";

async function main() {
  mkdirSync(MEDIA_DIR, { recursive: true });

  // 1. Fetch media library from prod
  console.log(`Fetching media library from ${PROD_URL}...`);
  const media = await prodClient.query(api.media.list, {});
  console.log(`  ${media.length} items found\n`);
  writeFileSync(join(BACKUP_DIR, "media.json"), JSON.stringify(media, null, 2));

  if (media.length === 0) {
    console.log("Nothing to import.");
    return;
  }

  // 2. Auth on dev
  console.log(`Logging into ${devUrl}...`);
  const { token: adminToken } = await devClient.mutation(api.auth.login, { password: PASSWORD });
  console.log(`  Authenticated\n`);

  // 3. Download, re-upload, register each item
  let ok = 0, fail = 0;
  for (const item of media) {
    const url = item.url;
    if (!url) { console.log(`  SKIP ${item.name} — no URL`); fail++; continue; }

    // Download from prod
    const res = await fetch(url);
    if (!res.ok) { console.log(`  SKIP ${item.name} — download failed (${res.status})`); fail++; continue; }
    const buffer = Buffer.from(await res.arrayBuffer());

    // Save locally
    const ext = item.type === "video" ? ".mp4" : ".jpeg";
    const filename = `${item.name.replace(/[^a-zA-Z0-9_-]/g, "_")}${ext}`;
    writeFileSync(join(MEDIA_DIR, filename), buffer);

    // Upload to dev
    const contentType = item.type === "video" ? "video/mp4" : "image/jpeg";
    const uploadUrl = await devClient.mutation(api.media.generateUploadUrl, { adminToken });
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: buffer,
    });
    const { storageId } = await uploadRes.json();

    // Register in media table
    await devClient.mutation(api.media.upload, {
      storageId,
      name: item.name,
      type: item.type,
      folder: item.folder || undefined,
      size: item.size || buffer.length,
      adminToken,
    });

    ok++;
    console.log(`  OK ${item.name} (${(buffer.length / 1024).toFixed(0)} KB)`);
  }

  console.log(`\nDone! ${ok} imported, ${fail} failed.`);
}

main().catch((err) => {
  console.error("Fatal:", err.message || err);
  process.exit(1);
});
