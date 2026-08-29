#!/usr/bin/env node
/**
 * Wipe all current dev data and re-import from prod-backup/.
 *
 * Usage:
 *   node scripts/clearAndImport.js [password]
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const BACKUP_DIR = "prod-backup";
const MEDIA_DIR = join(BACKUP_DIR, "media");

const envFile = readFileSync(".env.local", "utf-8");
const convexUrl = envFile.match(/VITE_CONVEX_URL=(.+)/)?.[1]?.trim();
if (!convexUrl) { console.error("No VITE_CONVEX_URL in .env.local"); process.exit(1); }

const client = new ConvexHttpClient(convexUrl);
const PASSWORD = process.argv[2] || "daust";

function extractUrlId(url) {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return null;
  return url.split("/").pop().split("?")[0];
}

function findLocalFile(urlId) {
  const files = readdirSync(MEDIA_DIR);
  return files.find((f) => f.startsWith(urlId));
}

async function main() {
  console.log(`Connecting to ${convexUrl}...\n`);

  // Auth
  const { token: adminToken } = await client.mutation(api.auth.login, { password: PASSWORD });
  console.log("Authenticated.\n");

  // ── PHASE 1: CLEAR EVERYTHING ──
  console.log("=== CLEARING ALL DATA ===\n");

  // Clear product sets first (they reference products)
  console.log("Clearing product sets...");
  const sets = await client.query(api.products.listProductSets, {});
  for (const s of sets) {
    await client.mutation(api.products.removeProductSet, { id: s._id, adminToken });
  }
  console.log(`  Deleted ${sets.length} product sets`);

  // Clear products
  console.log("Clearing products...");
  const products = await client.query(api.products.list, {});
  for (const p of products) {
    await client.mutation(api.products.removeProduct, { id: p._id, adminToken });
  }
  console.log(`  Deleted ${products.length} products`);

  // Clear collections
  console.log("Clearing collections...");
  const collections = await client.query(api.collections.list, {});
  for (const c of collections) {
    await client.mutation(api.collections.removeCollection, { id: c._id, adminToken });
  }
  console.log(`  Deleted ${collections.length} collections`);

  // Clear orders
  console.log("Clearing orders...");
  await client.mutation(api.orders.clearAllOrders, { adminToken });
  console.log("  Cleared all orders");

  // Clear media library
  console.log("Clearing media library...");
  try {
    const media = await client.query(api.media.list, {});
    for (const m of media) {
      await client.mutation(api.media.remove, { id: m._id, adminToken });
    }
    console.log(`  Deleted ${media.length} media items`);
  } catch {
    console.log("  No media to clear");
  }

  console.log("\nAll data cleared.\n");

  // ── PHASE 2: IMPORT FRESH DATA ──
  console.log("=== IMPORTING PROD BACKUP ===\n");

  const backupProducts = JSON.parse(readFileSync(join(BACKUP_DIR, "products.json"), "utf-8"));
  const backupCollections = JSON.parse(readFileSync(join(BACKUP_DIR, "collections.json"), "utf-8"));
  const backupSets = JSON.parse(readFileSync(join(BACKUP_DIR, "productSets.json"), "utf-8"));
  console.log(`Loaded: ${backupProducts.length} products, ${backupCollections.length} collections, ${backupSets.length} product sets\n`);

  // Collect all image URLs
  const allUrls = new Set();
  function scanForUrls(obj) {
    const matches = JSON.stringify(obj).match(/https:\/\/[^"]+\/api\/storage\/[^"]+/g) || [];
    matches.forEach((u) => allUrls.add(u));
  }
  scanForUrls(backupProducts);
  scanForUrls(backupCollections);
  scanForUrls(backupSets);
  console.log(`Uploading ${allUrls.size} images...`);

  // Upload images
  const urlToStorageId = new Map();
  let uploaded = 0;
  for (const url of allUrls) {
    const urlId = extractUrlId(url);
    const localFile = findLocalFile(urlId);
    if (!localFile) { console.error(`  MISSING ${urlId}`); continue; }
    const fileData = readFileSync(join(MEDIA_DIR, localFile));
    const contentType = localFile.endsWith(".png") ? "image/png" : "image/jpeg";
    const uploadUrl = await client.mutation(api.products.generateUploadUrl, { adminToken });
    const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": contentType }, body: fileData });
    const { storageId } = await res.json();
    urlToStorageId.set(url, storageId);
    uploaded++;
    if (uploaded % 10 === 0) console.log(`  ${uploaded}/${allUrls.size}...`);
  }
  console.log(`  ${uploaded} images uploaded\n`);

  function mapUrl(url) {
    if (!url || typeof url !== "string") return url;
    return urlToStorageId.get(url) || url;
  }

  // Insert collections
  console.log("Importing collections...");
  for (const c of backupCollections) {
    const id = await client.mutation(api.collections.addCollection, {
      name: c.name, slug: c.slug,
      description: c.description || undefined,
      image: mapUrl(c.image) || undefined,
      adminToken,
    });
    console.log(`  ${c.name} → ${id}`);
  }

  // Insert products
  console.log("Importing products...");
  const productIdMap = new Map();
  for (const p of backupProducts) {
    const logos = (p.logos || []).map((l) => ({
      id: l.id, name: l.name,
      image: mapUrl(l.image) || undefined,
      description: l.description || undefined,
      positions: l.positions || undefined,
    }));

    const logoCombinations = (p.logoCombinationsRaw || p.logoCombinations || []).map((lc) => ({
      logoIds: lc.logoIds,
      image: lc.image?.startsWith("http") ? mapUrl(lc.image) : lc.image,
    }));

    let logoImages = undefined;
    const rawLI = p.logoImagesRaw || p.logoImages;
    if (rawLI && typeof rawLI === "object") {
      logoImages = {};
      for (const [groupKey, colorMap] of Object.entries(rawLI)) {
        logoImages[groupKey] = {};
        if (colorMap && typeof colorMap === "object") {
          for (const [colorName, imgs] of Object.entries(colorMap)) {
            if (Array.isArray(imgs)) {
              logoImages[groupKey][colorName] = imgs.map((img) =>
                typeof img === "string" && img.startsWith("http") ? mapUrl(img) : img
              );
            }
          }
        }
      }
    }

    const newId = await client.mutation(api.products.addProduct, {
      name: p.name, category: p.category, price: p.price, rating: p.rating || 0,
      badge: p.badge || undefined, image: mapUrl(p.image),
      colors: p.colors || undefined, sizes: p.sizes || undefined,
      logos: logos.length > 0 ? logos : undefined,
      logoImages: logoImages || undefined,
      logoCombinations: logoCombinations.length > 0 ? logoCombinations : undefined,
      description: p.description || undefined, collection: p.collection || undefined,
      stock: p.stock ?? undefined,
      hoodieTypes: p.hoodieTypes?.length > 0 ? p.hoodieTypes : undefined,
      hasCropTopOption: p.hasCropTopOption || undefined,
      buyingPrice: p.buyingPrice ?? undefined,
      isActive: p.isActive ?? undefined,
      salePrice: p.salePrice ?? undefined,
      shippingTimeline: p.shippingTimeline || undefined,
      adminToken,
    });
    productIdMap.set(p._id, newId);
    console.log(`  ${p.name} → ${newId}`);
  }

  // Insert product sets
  console.log("Importing product sets...");
  for (const ps of backupSets) {
    const mappedProducts = ps.products
      .map((pr) => {
        const newId = productIdMap.get(pr.productId);
        if (!newId) { console.error(`  SKIP ref ${pr.productId}`); return null; }
        return {
          productId: newId, quantity: pr.quantity,
          selectedColor: pr.selectedColor ?? undefined,
          selectedSize: pr.selectedSize ?? undefined,
          selectedLogo: pr.selectedLogo ?? undefined,
        };
      })
      .filter(Boolean);

    if (mappedProducts.length === 0) { console.error(`  SKIP set "${ps.name}"`); continue; }

    const id = await client.mutation(api.products.addProductSet, {
      name: ps.name, description: ps.description || undefined,
      products: mappedProducts, specialPrice: ps.specialPrice,
      image: mapUrl(ps.image) || undefined, badge: ps.badge || undefined,
      isActive: ps.isActive ?? undefined, adminToken,
    });
    console.log(`  ${ps.name} → ${id}`);
  }

  console.log("\nDone! Dev deployment now has a clean copy of production data.");
}

main().catch((err) => {
  console.error("Fatal:", err.message || err);
  process.exit(1);
});
