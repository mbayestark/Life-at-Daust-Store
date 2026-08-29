#!/usr/bin/env node
/**
 * Import prod-backup/ data into the current Convex deployment.
 *
 * 1. Authenticates as admin
 * 2. Uploads all media to new deployment's storage
 * 3. Maps old image URLs → new storage IDs
 * 4. Inserts collections, products, product sets (in order, for ID mapping)
 *
 * Usage:
 *   node scripts/importProdBackup.js
 *
 * Requires: ADMIN_PASSWORD env var set on current Convex deployment
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const BACKUP_DIR = "prod-backup";
const MEDIA_DIR = join(BACKUP_DIR, "media");

// Use the current deployment from .env.local
const envFile = readFileSync(".env.local", "utf-8");
const convexUrl = envFile.match(/VITE_CONVEX_URL=(.+)/)?.[1]?.trim();
if (!convexUrl) {
  console.error("Could not find VITE_CONVEX_URL in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
const PASSWORD = process.argv[2] || "daust";

// ── helpers ──

function extractUrlId(url) {
  if (!url || !url.startsWith("http")) return null;
  return url.split("/").pop().split("?")[0];
}

function findLocalFile(urlId) {
  const files = readdirSync(MEDIA_DIR);
  return files.find((f) => f.startsWith(urlId));
}

// ── main ──

async function main() {
  console.log(`Connecting to ${convexUrl}...\n`);

  // 1. Authenticate
  console.log("Logging in...");
  const { token: adminToken } = await client.mutation(api.auth.login, {
    password: PASSWORD,
  });
  console.log(`  Authenticated (token: ${adminToken.slice(0, 12)}...)\n`);

  // 2. Load backup data
  const products = JSON.parse(readFileSync(join(BACKUP_DIR, "products.json"), "utf-8"));
  const collections = JSON.parse(readFileSync(join(BACKUP_DIR, "collections.json"), "utf-8"));
  const productSets = JSON.parse(readFileSync(join(BACKUP_DIR, "productSets.json"), "utf-8"));
  console.log(`Loaded: ${products.length} products, ${collections.length} collections, ${productSets.length} product sets\n`);

  // 3. Collect all unique image URLs
  const allUrls = new Set();
  function scanForUrls(obj) {
    const str = JSON.stringify(obj);
    const matches = str.match(/https:\/\/[^"]+\/api\/storage\/[^"]+/g) || [];
    matches.forEach((u) => allUrls.add(u));
  }
  scanForUrls(products);
  scanForUrls(collections);
  scanForUrls(productSets);
  console.log(`Found ${allUrls.size} unique image URLs to upload\n`);

  // 4. Upload all images and build URL → storageId map
  const urlToStorageId = new Map();
  let uploaded = 0;
  for (const url of allUrls) {
    const urlId = extractUrlId(url);
    const localFile = findLocalFile(urlId);
    if (!localFile) {
      console.error(`  MISSING local file for ${urlId}, skipping`);
      continue;
    }
    const filePath = join(MEDIA_DIR, localFile);
    const fileData = readFileSync(filePath);
    const contentType = localFile.endsWith(".png") ? "image/png" : "image/jpeg";

    const uploadUrl = await client.mutation(api.products.generateUploadUrl, { adminToken });
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: fileData,
    });
    const { storageId } = await res.json();
    urlToStorageId.set(url, storageId);
    uploaded++;
    if (uploaded % 10 === 0) console.log(`  Uploaded ${uploaded}/${allUrls.size}...`);
  }
  console.log(`  Uploaded ${uploaded} images\n`);

  // Helper: replace any old URL in a value with its new storage ID
  function mapUrl(url) {
    if (!url || typeof url !== "string") return url;
    return urlToStorageId.get(url) || url;
  }

  // 5. Insert collections
  console.log("Importing collections...");
  const collectionIdMap = new Map(); // old _id → new _id
  for (const c of collections) {
    const newId = await client.mutation(api.collections.addCollection, {
      name: c.name,
      slug: c.slug,
      description: c.description || undefined,
      image: mapUrl(c.image) || undefined,
      adminToken,
    });
    collectionIdMap.set(c._id, newId);
    console.log(`  ${c.name} → ${newId}`);
  }
  console.log();

  // 6. Insert products
  console.log("Importing products...");
  const productIdMap = new Map(); // old _id → new _id
  for (const p of products) {
    const logos = (p.logos || []).map((l) => ({
      id: l.id,
      name: l.name,
      image: mapUrl(l.image) || undefined,
      description: l.description || undefined,
      positions: l.positions || undefined,
    }));

    // Use raw storage IDs for logoCombinations, mapped to new IDs
    const logoCombinations = (p.logoCombinationsRaw || p.logoCombinations || []).map((lc) => ({
      logoIds: lc.logoIds,
      image: lc.image?.startsWith("http") ? mapUrl(lc.image) : lc.image,
    }));

    // Use raw storage IDs for logoImages, mapped to new IDs
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

    const args = {
      name: p.name,
      category: p.category,
      price: p.price,
      rating: p.rating || 0,
      badge: p.badge || undefined,
      image: mapUrl(p.image),
      colors: p.colors || undefined,
      sizes: p.sizes || undefined,
      logos: logos.length > 0 ? logos : undefined,
      logoImages: logoImages || undefined,
      logoCombinations: logoCombinations.length > 0 ? logoCombinations : undefined,
      description: p.description || undefined,
      collection: p.collection || undefined,
      stock: p.stock ?? undefined,
      hoodieTypes: p.hoodieTypes?.length > 0 ? p.hoodieTypes : undefined,
      hasCropTopOption: p.hasCropTopOption || undefined,
      buyingPrice: p.buyingPrice ?? undefined,
      isActive: p.isActive ?? undefined,
      salePrice: p.salePrice ?? undefined,
      shippingTimeline: p.shippingTimeline || undefined,
      adminToken,
    };

    const newId = await client.mutation(api.products.addProduct, args);
    productIdMap.set(p._id, newId);
    console.log(`  ${p.name} → ${newId}`);
  }
  console.log();

  // 7. Insert product sets
  console.log("Importing product sets...");
  for (const ps of productSets) {
    const mappedProducts = ps.products
      .map((pr) => {
        const newProductId = productIdMap.get(pr.productId);
        if (!newProductId) {
          console.error(`  SKIP set product ref: old ID ${pr.productId} not mapped`);
          return null;
        }
        return {
          productId: newProductId,
          quantity: pr.quantity,
          selectedColor: pr.selectedColor ?? undefined,
          selectedSize: pr.selectedSize ?? undefined,
          selectedLogo: pr.selectedLogo ?? undefined,
        };
      })
      .filter(Boolean);

    if (mappedProducts.length === 0) {
      console.error(`  SKIP set "${ps.name}" — no valid product refs`);
      continue;
    }

    const newId = await client.mutation(api.products.addProductSet, {
      name: ps.name,
      description: ps.description || undefined,
      products: mappedProducts,
      specialPrice: ps.specialPrice,
      image: mapUrl(ps.image) || undefined,
      badge: ps.badge || undefined,
      isActive: ps.isActive ?? undefined,
      adminToken,
    });
    console.log(`  ${ps.name} → ${newId}`);
  }

  console.log("\nImport complete!");
}

main().catch((err) => {
  console.error("Fatal:", err.message || err);
  process.exit(1);
});
