import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { verifyAdminToken } from "./auth";

declare const process: { env: Record<string, string | undefined> };

export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
    if (!isAuthorized) {
      throw new Error("Unauthorized - Invalid or expired session");
    }
    return await ctx.db.query("orders").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("orders"), adminToken: v.string() },
  handler: async (ctx, args) => {
    const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
    if (!isAuthorized) {
      throw new Error("Unauthorized - Invalid or expired session");
    }
    return await ctx.db.get(args.id);
  },
});

// Public query — no auth required
export const getDiscountEligibility = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const allOrders = await ctx.db.query("orders").collect();
    const discountedOrders = allOrders.filter(o => o.discount && o.discount > 0);
    const slotsUsed = discountedOrders.length;

    const normalized = args.phone.replace(/\s/g, "");
    const alreadyUsed = discountedOrders.some(o => {
      const stored = o.customer.phone.replace(/\s/g, "");
      return stored === normalized || stored.endsWith(normalized) || normalized.endsWith(stored);
    });

    return {
      slotsUsed,
      slotsRemaining: Math.max(0, 10 - slotsUsed),
      eligible: slotsUsed < 10 && !alreadyUsed,
    };
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
      productId: v.optional(v.string()),
      name: v.string(),
      qty: v.number(),
      price: v.number(),
      hoodieType: v.optional(v.string()),
      color: v.optional(v.string()),
      size: v.optional(v.string()),
      frontLogo: v.optional(v.string()),
      backLogo: v.optional(v.string()),
      sideLogo: v.optional(v.string()),
      isProductSet: v.optional(v.boolean()),
      productSetName: v.optional(v.string()),
    })),
    subtotal: v.number(),
    deliveryFee: v.number(),
    total: v.number(),
    paymentMethod: v.optional(v.string()),
    paymentStorageId: v.optional(v.id("_storage")),
    naboopayOrderId: v.optional(v.string()),
    naboopayCheckoutUrl: v.optional(v.string()),
    discount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Server-side discount guard to prevent race conditions
    if (args.discount && args.discount > 0) {
      const allOrders = await ctx.db.query("orders").collect();
      const discountedOrders = allOrders.filter(o => o.discount && o.discount > 0);
      if (discountedOrders.length >= 10) {
        throw new Error("Sorry, the early customer discount is no longer available.");
      }
      const normalized = args.customer.phone.replace(/\s/g, "");
      const alreadyUsed = discountedOrders.some(o => {
        const stored = o.customer.phone.replace(/\s/g, "");
        return stored === normalized || stored.endsWith(normalized) || normalized.endsWith(stored);
      });
      if (alreadyUsed) {
        throw new Error("This phone number has already redeemed the early customer discount.");
      }
    }

    const proofOfPaymentUrl = args.paymentStorageId ? (await ctx.storage.getUrl(args.paymentStorageId)) ?? undefined : undefined;
    const orderId = await ctx.db.insert("orders", {
      ...args,
      status: args.paymentMethod === "naboopay" ? "Pending Payment" : "Pending Verification",
      proofOfPaymentUrl,
      createdAt: Date.now(),
    });

    return orderId;
  },
});

export const updateNabooPayDetails = mutation({
  args: {
    orderId: v.string(),
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
    const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
    if (!isAuthorized) {
      throw new Error("Unauthorized - Invalid or expired session");
    }
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const deleteOrder = mutation({
  args: {
    id: v.id("orders"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
    if (!isAuthorized) {
      throw new Error("Unauthorized - Invalid or expired session");
    }
    await ctx.db.delete(args.id);
  },
});
