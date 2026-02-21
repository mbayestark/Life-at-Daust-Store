import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orders").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const addOrder = mutation({
  args: {
    orderId: v.string(),
    customer: v.object({
      name: v.string(),
      phone: v.string(),
      location: v.string(),
    }),
    items: v.array(v.object({
      name: v.string(),
      qty: v.number(),
      price: v.number(),
      color: v.optional(v.string()),
      size: v.optional(v.string()),
    })),
    subtotal: v.number(),
    deliveryFee: v.number(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    // Save to Convex database
    const orderId = await ctx.db.insert("orders", {
      ...args,
      status: "Processing",
      createdAt: Date.now(),
    });

    // Schedule Google Sheets backup via Action (to avoid side-effect error in mutation)
    await ctx.scheduler.runAfter(0, internal.actions.syncToSheets, {
      orderId: args.orderId,
      name: args.customer.name,
      phone: args.customer.phone,
      location: args.customer.location,
      items: args.items.map(item =>
        `${item.name} (x${item.qty})${item.color ? ` - ${item.color}` : ""}${item.size ? ` - ${item.size}` : ""}`
      ).join(", "),
      total: args.total,
    });

    return orderId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
