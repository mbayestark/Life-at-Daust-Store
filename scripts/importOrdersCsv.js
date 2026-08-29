#!/usr/bin/env node
/**
 * Import orders from the exported CSV into current dev deployment.
 * Handles multi-row orders (continuation rows have empty Order ID).
 * Updates status for orders that already exist.
 *
 * Usage:
 *   node scripts/importOrdersCsv.js [password]
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync } from "fs";

const CSV_PATH = process.argv[3] || "prod-backup/orders.csv";
const envFile = readFileSync(".env.local", "utf-8");
const convexUrl = envFile.match(/VITE_CONVEX_URL=(.+)/)?.[1]?.trim();
if (!convexUrl) { console.error("No VITE_CONVEX_URL in .env.local"); process.exit(1); }

const client = new ConvexHttpClient(convexUrl);
const PASSWORD = process.argv[2] || "daust";

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseDate(dateStr) {
  // Format: DD/MM/YYYY
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
}

async function main() {
  console.log(`Connecting to ${convexUrl}...\n`);
  const { token: adminToken } = await client.mutation(api.auth.login, { password: PASSWORD });
  console.log("Authenticated.\n");

  // Parse CSV
  const raw = readFileSync(CSV_PATH, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const headers = parseCsvLine(lines[0]);
  console.log(`CSV has ${lines.length - 1} rows\n`);

  // Group rows into orders (continuation rows have empty Order ID)
  const orders = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const orderId = fields[0];
    if (orderId) {
      orders.push({
        orderId,
        date: fields[1],
        customerName: fields[2],
        phone: fields[3],
        location: fields[4],
        paymentMethod: fields[5],
        status: fields[6],
        subtotal: parseFloat(fields[18]) || 0,
        deliveryFee: parseFloat(fields[20]) || 0,
        discount: parseFloat(fields[21]) || 0,
        total: parseFloat(fields[22]) || 0,
        items: [],
      });
    }
    // Add item (both first row and continuation rows)
    const current = orders[orders.length - 1];
    if (!current) continue;

    const itemName = fields[7];
    if (!itemName) continue;

    const isBundle = itemName.startsWith("[Bundle] ");
    current.items.push({
      name: isBundle ? itemName.replace("[Bundle] ", "") : itemName,
      qty: parseInt(fields[8]) || 1,
      price: parseFloat(fields[9]) || 0,
      color: fields[11] || undefined,
      size: fields[12] || undefined,
      hoodieType: fields[13] || undefined,
      isCropTop: fields[14] === "Yes" ? true : undefined,
      frontLogo: fields[15] || undefined,
      backLogo: fields[16] || undefined,
      sideLogo: fields[17] || undefined,
      isProductSet: isBundle ? true : undefined,
      productSetName: isBundle ? itemName.replace("[Bundle] ", "") : undefined,
    });
  }

  console.log(`Parsed ${orders.length} orders\n`);

  // Get existing orders to check for duplicates
  const existingOrders = await client.query(api.orders.list, { adminToken });
  const existingByOrderId = new Map(existingOrders.map((o) => [o.orderId, o]));

  let created = 0, updated = 0, skipped = 0;
  for (const o of orders) {
    const existing = existingByOrderId.get(o.orderId);

    if (existing) {
      // Update status if different
      if (existing.status !== o.status) {
        await client.mutation(api.orders.updateStatus, {
          id: existing._id,
          status: o.status,
          adminToken,
        });
        console.log(`  UPDATED ${o.orderId} status: ${existing.status} → ${o.status}`);
        updated++;
      } else {
        console.log(`  EXISTS ${o.orderId} (${o.status})`);
        skipped++;
      }
      continue;
    }

    // Create new order
    try {
      await client.mutation(api.orders.addOrder, {
        orderId: o.orderId,
        customer: {
          name: o.customerName,
          phone: o.phone,
          location: o.location,
        },
        items: o.items.map((it) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
          color: it.color,
          size: it.size,
          hoodieType: it.hoodieType,
          isCropTop: it.isCropTop,
          frontLogo: it.frontLogo,
          backLogo: it.backLogo,
          sideLogo: it.sideLogo,
          isProductSet: it.isProductSet,
          productSetName: it.productSetName,
        })),
        subtotal: o.subtotal,
        deliveryFee: o.deliveryFee,
        total: o.total,
        paymentMethod: o.paymentMethod || undefined,
      });

      // Update status + createdAt
      const allOrders = await client.query(api.orders.list, { adminToken });
      const match = allOrders.find((x) => x.orderId === o.orderId);
      if (match && o.status !== "Pending Payment" && o.status !== "Pending Verification") {
        await client.mutation(api.orders.updateStatus, {
          id: match._id,
          status: o.status,
          adminToken,
        });
      }

      console.log(`  OK ${o.orderId} (${o.status}) — ${o.customerName} — ${o.items.length} items`);
      created++;
    } catch (err) {
      console.log(`  FAIL ${o.orderId}: ${err.message}`);
    }
  }

  console.log(`\nDone! ${created} created, ${updated} updated, ${skipped} unchanged.`);
}

main().catch((err) => {
  console.error("Fatal:", err.message || err);
  process.exit(1);
});
