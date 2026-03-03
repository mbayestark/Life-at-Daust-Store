import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust_admin_2024")) {
      throw new Error("Unauthorized");
    }
    return await ctx.db.query("orders").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("orders"), adminToken: v.string() },
  handler: async (ctx, args) => {
    if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust_admin_2024")) {
      throw new Error("Unauthorized");
    }
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
      logo: v.optional(v.string()),
    })),
    subtotal: v.number(),
    deliveryFee: v.number(),
    total: v.number(),
    paymentMethod: v.optional(v.string()),
    paymentStorageId: v.optional(v.id("_storage")),
    naboopayOrderId: v.optional(v.string()),
    naboopayCheckoutUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Save to Convex database
    const proofOfPaymentUrl = args.paymentStorageId ? (await ctx.storage.getUrl(args.paymentStorageId)) ?? undefined : undefined;
    const orderId = await ctx.db.insert("orders", {
      ...args,
      status: args.paymentMethod === "naboopay" ? "Pending Payment" : "Pending Verification",
      proofOfPaymentUrl,
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

export const updateNabooPayDetails = mutation({
  args: {
    orderId: v.string(), // This is our custom orderId
    naboopayOrderId: v.string(),
    naboopayCheckoutUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("orderId"), args.orderId))
      .first();

    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(order._id, {
      naboopayOrderId: args.naboopayOrderId,
      naboopayCheckoutUrl: args.naboopayCheckoutUrl,
      paymentMethod: "naboopay",
    });
  },
});

export const updateByNabooPayId = internalMutation({
  args: {
    naboopayOrderId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("naboopayOrderId"), args.naboopayOrderId))
      .first();

    if (!order) {
      console.error(`Order with NabooPay ID ${args.naboopayOrderId} not found`);
      return;
    }

    let status = "Pending Payment";
    if (args.status === "paid" || args.status === "paid_and_blocked") {
      status = "Paid";
    } else if (args.status === "cancelled") {
      status = "Cancelled";
    }

    await ctx.db.patch(order._id, { status });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.string(),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust_admin_2024")) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, { status: args.status });
  },
});
