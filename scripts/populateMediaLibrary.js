#!/usr/bin/env node
/**
 * Populate the media library table from all storage IDs
 * already used in products, collections, and product sets.
 *
 * Usage:
 *   node scripts/populateMediaLibrary.js [password]
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const convexUrl = envFile.match(/VITE_CONVEX_URL=(.+)/)?.[1]?.trim();
if (!convexUrl) { console.error("No VITE_CONVEX_URL in .env.local"); process.exit(1); }

const client = new ConvexHttpClient(convexUrl);
const PASSWORD = process.argv[2] || "daust";

async function main() {
  console.log(`Connecting to ${convexUrl}...\n`);
  const { token: adminToken } = await client.mutation(api.auth.login, { password: PASSWORD });
  console.log("Authenticated.\n");

  // Check what's already in media library to avoid duplicates
  const existingMedia = await client.query(api.media.list, {});
  const existingStorageIds = new Set(existingMedia.map((m) => m.storageId));
  console.log(`Media library already has ${existingMedia.length} items\n`);

  // Collect all storage IDs with names and folders
  const entries = []; // { storageId, name, folder }
  const seen = new Set();

  function add(storageId, name, folder) {
    if (!storageId || typeof storageId !== "string") return;
    // Skip URLs (already resolved), only want raw storage IDs
    if (storageId.startsWith("http")) return;
    if (seen.has(storageId) || existingStorageIds.has(storageId)) return;
    seen.add(storageId);
    entries.push({ storageId, name, folder });
  }

  // Fetch current data
  const products = await client.query(api.products.list, {});
  const collections = await client.query(api.collections.list, {});
  const productSets = await client.query(api.products.listProductSets, {});

  console.log(`Scanning ${products.length} products, ${collections.length} collections, ${productSets.length} product sets...\n`);

  // We need raw storage IDs, but list queries resolve them to URLs.
  // Read from prod-backup JSON which has both raw and resolved forms.
  const backupProducts = JSON.parse(readFileSync("prod-backup/products.json", "utf-8"));

  for (const p of backupProducts) {
    // Main image — check if it's a raw ID in the backup
    // The current deployment stores raw IDs, but list query resolves them
    // We need to find the storage IDs. Let's scan the backup for raw IDs.

    // Product main image: in the DB it's stored as a storage ID
    // We can find it by matching product names between backup and current data
    const currentProduct = products.find((cp) => cp.name === p.name);
    if (!currentProduct) continue;

    // The current product's image field in the DB is a storage ID,
    // but the query resolved it to a URL. We need to get the raw value.
    // Since we uploaded and inserted via addProduct, the image field IS the storage ID.
    // But list query resolves it. Let's use a different approach:
    // We know what we uploaded — let's track by backup structure.
  }

  // Better approach: since we can't easily get raw storage IDs from queries,
  // let's re-read what's actually stored by using the backup data structure
  // and the fact that each product was inserted with specific storage IDs.
  //
  // Actually, the simplest way: query each product individually via getById
  // which also resolves URLs. The storage IDs are in the DB but not accessible
  // through public queries.
  //
  // Best approach: create a temporary query, or just register the images
  // by downloading the current URLs and re-uploading to media.
  //
  // Simplest: use the product URLs from the list query — each URL contains
  // the storage UUID. We can extract it and find the matching storageId
  // by uploading a reference.
  //
  // ACTUALLY: The media.upload mutation just needs a storageId that already
  // exists in storage. The products already reference these storage IDs.
  // We just can't see the raw IDs through the list query.
  //
  // Let's use a workaround: read all _storage entries via a custom approach,
  // or simply re-download each URL and upload as new media entries.

  // Pragmatic approach: download each unique image URL from current products
  // and upload to media library as new entries.

  const urlEntries = []; // { url, name, folder }

  for (const p of products) {
    if (p.image?.startsWith("http")) {
      urlEntries.push({ url: p.image, name: `${p.name} - Main`, folder: "Products" });
    }
    for (const logo of (p.logos || [])) {
      if (logo.image?.startsWith("http")) {
        urlEntries.push({ url: logo.image, name: `${p.name} - Logo - ${logo.name}`, folder: "Logos" });
      }
    }
    for (const combo of (p.logoCombinations || [])) {
      if (combo.image?.startsWith("http")) {
        const logo1 = p.logos?.find((l) => l.id === combo.logoIds?.[0]);
        const logo2 = p.logos?.find((l) => l.id === combo.logoIds?.[1]);
        const comboName = `${logo1?.name || "?"} + ${logo2?.name || "?"}`;
        urlEntries.push({ url: combo.image, name: `${p.name} - Combo - ${comboName}`, folder: "Logo Combos" });
      }
    }
    const li = p.logoImages;
    if (li && typeof li === "object") {
      for (const [, colorMap] of Object.entries(li)) {
        if (colorMap && typeof colorMap === "object") {
          for (const [colorName, imgs] of Object.entries(colorMap)) {
            if (Array.isArray(imgs)) {
              imgs.forEach((img, i) => {
                if (typeof img === "string" && img.startsWith("http")) {
                  urlEntries.push({ url: img, name: `${p.name} - ${colorName}${imgs.length > 1 ? ` (${i + 1})` : ""}`, folder: "Color Images" });
                }
              });
            }
          }
        }
      }
    }
  }

  for (const c of collections) {
    if (c.image?.startsWith("http")) {
      urlEntries.push({ url: c.image, name: `${c.name} - Collection`, folder: "Collections" });
    }
  }

  for (const ps of productSets) {
    if (ps.image?.startsWith("http")) {
      urlEntries.push({ url: ps.image, name: `${ps.name} - Set`, folder: "Product Sets" });
    }
  }

  // Dedupe by URL
  const uniqueUrls = new Map();
  for (const e of urlEntries) {
    if (!uniqueUrls.has(e.url)) uniqueUrls.set(e.url, e);
  }

  console.log(`Found ${uniqueUrls.size} unique images to register\n`);

  let ok = 0;
  for (const [url, entry] of uniqueUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) { console.log(`  SKIP ${entry.name} (${res.status})`); continue; }
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const isVideo = contentType.startsWith("video");

      const uploadUrl = await client.mutation(api.media.generateUploadUrl, { adminToken });
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: buffer,
      });
      const { storageId } = await uploadRes.json();

      await client.mutation(api.media.upload, {
        storageId,
        name: entry.name,
        type: isVideo ? "video" : "image",
        folder: entry.folder,
        size: buffer.length,
        adminToken,
      });

      ok++;
      console.log(`  OK ${entry.name} (${(buffer.length / 1024).toFixed(0)} KB) → ${entry.folder}`);
    } catch (err) {
      console.error(`  FAIL ${entry.name}: ${err.message}`);
    }
  }

  console.log(`\nDone! ${ok} items added to media library.`);
}

main().catch((err) => {
  console.error("Fatal:", err.message || err);
  process.exit(1);
});
