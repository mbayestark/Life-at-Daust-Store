#!/usr/bin/env node
/**
 * Fetch customer accounts from old prod by their IDs found in orders.
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PROD_URL = "https://dependable-octopus-848.convex.cloud";
const client = new ConvexHttpClient(PROD_URL);

const orders = JSON.parse(readFileSync("prod-backup/orders.json", "utf-8"));
const userIds = [...new Set(orders.map((o) => o.buyerUserId).filter(Boolean))];

async function main() {
  console.log(`Fetching ${userIds.length} user(s) from ${PROD_URL}...\n`);
  const users = [];
  for (const id of userIds) {
    try {
      const user = await client.query(api.users.getById, { id });
      if (user) {
        users.push(user);
        console.log(`  OK ${user.name} (${user.email}) — referrals: ${user.referral_count}, coupon: ${user.coupon_percent}%`);
      } else {
        console.log(`  NOT FOUND ${id}`);
      }
    } catch (err) {
      console.log(`  FAIL ${id}: ${err.message}`);
    }
  }
  writeFileSync(join("prod-backup", "users.json"), JSON.stringify(users, null, 2));
  console.log(`\n${users.length} user(s) saved to prod-backup/users.json`);
}

main().catch((err) => { console.error("Fatal:", err.message); process.exit(1); });
