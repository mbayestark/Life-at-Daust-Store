#!/usr/bin/env node
/**
 * Import orders and hero media/reel settings into current dev deployment.
 *
 * Usage:
 *   node scripts/importOrdersAndSettings.js [password]
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BACKUP_DIR = "prod-backup";
const envFile = readFileSync(".env.local", "utf-8");
const convexUrl = envFile.match(/VITE_CONVEX_URL=(.+)/)?.[1]?.trim();
if (!convexUrl) { console.error("No VITE_CONVEX_URL in .env.local"); process.exit(1); }

const client = new ConvexHttpClient(convexUrl);
const PASSWORD = process.argv[2] || "daust";

async function main() {
  console.log(`Connecting to ${convexUrl}...\n`);
  const { token: adminToken } = await client.mutation(api.auth.login, { password: PASSWORD });
  console.log("Authenticated.\n");

  // ── ORDERS ──
  const ordersFile = join(BACKUP_DIR, "orders.json");
  if (existsSync(ordersFile)) {
    const orders = JSON.parse(readFileSync(ordersFile, "utf-8"));
    console.log(`Importing ${orders.length} orders...`);

    for (const o of orders) {
      try {
        // Use addOrder which handles duplicate orderId checks
        // Strip productId — old IDs don't exist in this deployment.
        // Without productId, addOrder skips server-side price validation.
        const items = o.items.map((it) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
          hoodieType: it.hoodieType || undefined,
          isCropTop: it.isCropTop || undefined,
          color: it.color || undefined,
          size: it.size || undefined,
          frontLogo: it.frontLogo || undefined,
          backLogo: it.backLogo || undefined,
          sideLogo: it.sideLogo || undefined,
          isProductSet: it.isProductSet || undefined,
          productSetName: it.productSetName || undefined,
          setProducts: it.setProducts || undefined,
        }));

        await client.mutation(api.orders.addOrder, {
          orderId: o.orderId,
          customer: o.customer,
          items,
          subtotal: o.subtotal,
          deliveryFee: o.deliveryFee,
          total: o.total,
          paymentMethod: o.paymentMethod || undefined,
          naboopayOrderId: o.naboopayOrderId || undefined,
          naboopayCheckoutUrl: o.naboopayCheckoutUrl || undefined,
          buyerUserId: o.buyerUserId || undefined,
          referralCode: o.referralCode || undefined,
          referralDiscount: o.referralDiscount || undefined,
          couponDiscount: o.couponDiscount || undefined,
          couponApplied: o.couponApplied || undefined,
        });

        // Now update the status to match production (addOrder sets "Pending Payment" or "Pending Verification")
        // We need to find the order by orderId and patch its status
        if (o.status !== "Pending Payment" && o.status !== "Pending Verification") {
          const inserted = await client.query(api.orders.getByOrderIdPublic, { orderId: o.orderId });
          if (inserted) {
            // Use the internal list query to get the full order with _id
            const allOrders = await client.query(api.orders.list, { adminToken });
            const match = allOrders.find((x) => x.orderId === o.orderId);
            if (match) {
              await client.mutation(api.orders.updateStatus, {
                id: match._id,
                status: o.status,
                adminToken,
              });
            }
          }
        }

        console.log(`  OK ${o.orderId} (${o.status}) — ${o.customer.name}`);
      } catch (err) {
        console.log(`  SKIP ${o.orderId}: ${err.message}`);
      }
    }
    console.log();
  }

  // ── HERO MEDIA ──
  const heroFile = join(BACKUP_DIR, "heroMedia.json");
  if (existsSync(heroFile)) {
    const heroMedia = JSON.parse(readFileSync(heroFile, "utf-8"));
    if (heroMedia.length > 0) {
      console.log(`Importing ${heroMedia.length} hero media items...`);
      const newHeroMedia = [];

      for (const h of heroMedia) {
        try {
          // Download from old deployment
          const res = await fetch(h.url);
          if (!res.ok) { console.log(`  SKIP hero item (${res.status})`); continue; }
          const buffer = Buffer.from(await res.arrayBuffer());
          const contentType = h.type === "video" ? "video/mp4" : "image/jpeg";

          // Upload to current deployment
          const uploadUrl = await client.mutation(api.products.generateUploadUrl, { adminToken });
          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": contentType },
            body: buffer,
          });
          const { storageId } = await uploadRes.json();
          newHeroMedia.push({ storageId, type: h.type });
          console.log(`  OK ${h.type} (${(buffer.length / 1024).toFixed(0)} KB)`);
        } catch (err) {
          console.log(`  FAIL: ${err.message}`);
        }
      }

      // Save hero media settings
      if (newHeroMedia.length > 0) {
        await client.mutation(api.settings.updateHeroMedia, { heroMedia: newHeroMedia, adminToken });
        console.log(`  Saved ${newHeroMedia.length} hero media items to settings`);
      }
      console.log();
    }
  }

  // ── REEL VIDEOS ──
  const reelFile = join(BACKUP_DIR, "reelVideos.json");
  if (existsSync(reelFile)) {
    const reelVideos = JSON.parse(readFileSync(reelFile, "utf-8"));
    if (reelVideos.length > 0) {
      console.log(`Importing ${reelVideos.length} reel videos...`);
      const newReelIds = [];

      for (const r of reelVideos) {
        const url = r.url || r;
        try {
          const res = await fetch(url);
          if (!res.ok) { console.log(`  SKIP reel (${res.status})`); continue; }
          const buffer = Buffer.from(await res.arrayBuffer());
          const uploadUrl = await client.mutation(api.products.generateUploadUrl, { adminToken });
          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "video/mp4" },
            body: buffer,
          });
          const { storageId } = await uploadRes.json();
          newReelIds.push(storageId);
          console.log(`  OK reel (${(buffer.length / 1024).toFixed(0)} KB)`);
        } catch (err) {
          console.log(`  FAIL: ${err.message}`);
        }
      }

      if (newReelIds.length > 0) {
        await client.mutation(api.settings.updateReelVideos, { reelVideos: newReelIds, adminToken });
        console.log(`  Saved ${newReelIds.length} reel videos to settings`);
      }
      console.log();
    }
  }

  console.log("Done! Orders and settings imported.");
}

main().catch((err) => {
  console.error("Fatal:", err.message || err);
  process.exit(1);
});
