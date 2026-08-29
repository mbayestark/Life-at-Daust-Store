#!/usr/bin/env node
/**
 * Backup all data and media from the old production Convex deployment.
 *
 * Usage:
 *   node scripts/backupProdMedia.js
 *
 * Output:
 *   prod-backup/
 *     products.json
 *     collections.json
 *     productSets.json
 *     media/          ← all downloaded images
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const PROD_URL = "https://dependable-octopus-848.convex.cloud";
const BACKUP_DIR = "prod-backup";
const MEDIA_DIR = join(BACKUP_DIR, "media");

const client = new ConvexHttpClient(PROD_URL);

async function downloadFile(url, filename) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  SKIP ${filename} (${res.status})`);
    return false;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(MEDIA_DIR, filename), buffer);
  console.log(`  OK ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
  return true;
}

function collectImageUrls(obj, label) {
  const urls = new Map();
  const json = JSON.stringify(obj);
  const matches = json.match(/https:\/\/[^"]+\.convex\.cloud\/api\/storage\/[^"]+/g) || [];
  for (const url of matches) {
    const id = url.split("/").pop().split("?")[0];
    urls.set(id || url, url);
  }
  console.log(`Found ${urls.size} images in ${label}`);
  return urls;
}

async function main() {
  mkdirSync(MEDIA_DIR, { recursive: true });

  console.log(`\nConnecting to ${PROD_URL}...\n`);

  console.log("Fetching products...");
  const products = await client.query(api.products.list, {});
  writeFileSync(join(BACKUP_DIR, "products.json"), JSON.stringify(products, null, 2));
  console.log(`  ${products.length} products saved\n`);

  console.log("Fetching collections...");
  const collections = await client.query(api.collections.list, {});
  writeFileSync(join(BACKUP_DIR, "collections.json"), JSON.stringify(collections, null, 2));
  console.log(`  ${collections.length} collections saved\n`);

  console.log("Fetching product sets...");
  const productSets = await client.query(api.products.listProductSets, {});
  writeFileSync(join(BACKUP_DIR, "productSets.json"), JSON.stringify(productSets, null, 2));
  console.log(`  ${productSets.length} product sets saved\n`);

  // Collect all image URLs from the fetched data
  const allUrls = new Map();
  for (const [k, v] of collectImageUrls(products, "products")) allUrls.set(k, v);
  for (const [k, v] of collectImageUrls(collections, "collections")) allUrls.set(k, v);
  for (const [k, v] of collectImageUrls(productSets, "productSets")) allUrls.set(k, v);

  console.log(`\nDownloading ${allUrls.size} unique images...\n`);

  let ok = 0, fail = 0;
  for (const [id, url] of allUrls) {
    const ext = url.includes(".png") ? ".png" : ".jpeg";
    const success = await downloadFile(url, `${id}${ext}`);
    success ? ok++ : fail++;
  }

  console.log(`\nDone! ${ok} downloaded, ${fail} failed.`);
  console.log(`Backup saved to ${BACKUP_DIR}/`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
