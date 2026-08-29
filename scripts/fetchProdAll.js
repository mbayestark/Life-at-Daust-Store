#!/usr/bin/env node
/**
 * Fetch ALL remaining data from old production deployment:
 * orders, admin users, audit logs, site settings, users.
 *
 * Usage:
 *   node scripts/fetchProdAll.js
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const PROD_URL = "https://dependable-octopus-848.convex.cloud";
const BACKUP_DIR = "prod-backup";
const client = new ConvexHttpClient(PROD_URL);

async function main() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Connecting to ${PROD_URL}...\n`);

  // Auth on old prod
  console.log("Logging in...");
  let adminToken;
  try {
    const result = await client.mutation(api.auth.login, { password: "daust" });
    adminToken = result.token;
    console.log("  Authenticated as manager\n");
  } catch (err) {
    console.error("  Login failed:", err.message);
    console.error("  Trying partner password...");
    try {
      const result = await client.mutation(api.auth.login, { password: "partner" });
      adminToken = result.token;
      console.log("  Authenticated as partner\n");
    } catch {
      console.error("  Both passwords failed. Cannot fetch auth-protected data.");
      process.exit(1);
    }
  }

  // Orders
  console.log("Fetching orders...");
  try {
    const orders = await client.query(api.orders.list, { adminToken });
    writeFileSync(join(BACKUP_DIR, "orders.json"), JSON.stringify(orders, null, 2));
    console.log(`  ${orders.length} orders saved\n`);
  } catch (err) {
    console.log(`  Failed: ${err.message}\n`);
  }

  // Admin users
  console.log("Fetching admin users...");
  try {
    const adminUsers = await client.query(api.auth.listAdminUsers, { adminToken });
    writeFileSync(join(BACKUP_DIR, "adminUsers.json"), JSON.stringify(adminUsers, null, 2));
    console.log(`  ${adminUsers.length} admin users saved\n`);
  } catch (err) {
    console.log(`  Failed (may need 'users' permission): ${err.message}\n`);
  }

  // Audit logs
  console.log("Fetching audit logs...");
  try {
    const auditLogs = await client.query(api.auth.listAuditLogs, { adminToken, limit: 10000 });
    writeFileSync(join(BACKUP_DIR, "auditLogs.json"), JSON.stringify(auditLogs, null, 2));
    console.log(`  ${auditLogs.length} audit log entries saved\n`);
  } catch (err) {
    console.log(`  Failed: ${err.message}\n`);
  }

  // Hero media (public)
  console.log("Fetching hero media...");
  try {
    const heroMedia = await client.query(api.settings.getHeroMediaAdmin, { adminToken });
    writeFileSync(join(BACKUP_DIR, "heroMedia.json"), JSON.stringify(heroMedia, null, 2));
    console.log(`  ${heroMedia.length} hero media items saved\n`);
  } catch (err) {
    console.log(`  Failed: ${err.message}\n`);
  }

  // Reel videos
  console.log("Fetching reel videos...");
  try {
    const reelVideos = await client.query(api.settings.getReelVideosAdmin, { adminToken });
    writeFileSync(join(BACKUP_DIR, "reelVideos.json"), JSON.stringify(reelVideos, null, 2));
    console.log(`  ${reelVideos.length} reel videos saved\n`);
  } catch (err) {
    console.log(`  Failed: ${err.message}\n`);
  }

  console.log("Done! All data saved to prod-backup/");
}

main().catch((err) => {
  console.error("Fatal:", err.message || err);
  process.exit(1);
});
