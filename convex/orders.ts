import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { verifyAdminToken } from "./auth";

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
      isCropTop: v.optional(v.boolean()),
      color: v.optional(v.string()),
      size: v.optional(v.string()),
      frontLogo: v.optional(v.string()),
      backLogo: v.optional(v.string()),
      sideLogo: v.optional(v.string()),
      isProductSet: v.optional(v.boolean()),
      productSetName: v.optional(v.string()),
      setProducts: v.optional(v.array(v.object({
        productName: v.string(),
        quantity: v.number(),
        color: v.optional(v.string()),
        size: v.optional(v.string()),
        frontLogo: v.optional(v.string()),
        backLogo: v.optional(v.string()),
        sideLogo: v.optional(v.string()),
      }))),
    })),
    subtotal: v.number(),
    deliveryFee: v.number(),
    total: v.number(),
    paymentMethod: v.optional(v.string()),
    paymentStorageId: v.optional(v.id("_storage")),
    naboopayOrderId: v.optional(v.string()),
    naboopayCheckoutUrl: v.optional(v.string()),
    buyerUserId: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    referralDiscount: v.optional(v.number()),
    couponDiscount: v.optional(v.number()),
    couponApplied: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (existing) {
      return existing._id;
    }
    if (args.referralCode && args.couponApplied) {
      throw new Error("Cannot use both a referral code and a coupon on the same order.");
    }
    const proofOfPaymentUrl = args.paymentStorageId ? (await ctx.storage.getUrl(args.paymentStorageId)) ?? undefined : undefined;
    const initialStatus = args.paymentMethod === "naboopay" ? "Pending Payment" : "Pending Verification";
    const orderId = await ctx.db.insert("orders", {
      ...args,
      status: initialStatus,
      statusHistory: [{ status: initialStatus, timestamp: Date.now() }],
      proofOfPaymentUrl,
      createdAt: Date.now(),
      referralTracked: false,
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
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
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

export const cancelFailedOrder = mutation({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (!order) return;
    if (order.status !== "Pending Payment") return;
    if (order.naboopayOrderId) return;
    await ctx.db.patch(order._id, {
      status: "Failed",
      statusHistory: [
        ...(order.statusHistory ?? []),
        { status: "Failed", timestamp: Date.now() },
      ],
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
      .withIndex("by_naboopayOrderId", (q) => q.eq("naboopayOrderId", args.naboopayOrderId))
      .first();
    if (!order) {
      return;
    }
    if (order.status === "Expired" || order.status === "Failed") {
      return;
    }
    let status = "Pending Payment";
    if (args.status === "paid" || args.status === "paid_and_blocked") {
      status = "Paid";
    } else if (args.status === "cancelled") {
      status = "Cancelled";
    }
    const history = order.statusHistory ?? [];
    await ctx.db.patch(order._id, {
      status,
      statusHistory: [...history, { status, timestamp: Date.now() }],
    });

    if (status === "Paid" && !order.referralTracked) {
      await ctx.db.patch(order._id, { referralTracked: true });
      if (order.referralCode) {
        await ctx.runMutation(internal.referrals.trackReferral, {
          referralCode: order.referralCode,
          buyerUserId: order.buyerUserId,
        });
      }
      if (order.couponApplied && order.buyerUserId) {
        const buyerIdAsId = order.buyerUserId as any;
        await ctx.runMutation(internal.referrals.redeemCoupon, {
          userId: buyerIdAsId,
        });
      }
    }
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
    const order = await ctx.db.get(args.id);
    const history = order?.statusHistory ?? [];
    await ctx.db.patch(args.id, {
      status: args.status,
      statusHistory: [...history, { status: args.status, timestamp: Date.now() }],
    });
  },
});

export const bulkUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("orders")),
    status: v.string(),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
    if (!isAuthorized) {
      throw new Error("Unauthorized - Invalid or expired session");
    }
    const now = Date.now();
    await Promise.all(args.ids.map(async (id) => {
      const order = await ctx.db.get(id);
      const history = order?.statusHistory ?? [];
      await ctx.db.patch(id, {
        status: args.status,
        statusHistory: [...history, { status: args.status, timestamp: now }],
      });
    }));
  },
});

export const toggleGift = mutation({
  args: {
    id: v.id("orders"),
    isGift: v.boolean(),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
    if (!isAuthorized) {
      throw new Error("Unauthorized - Invalid or expired session");
    }
    await ctx.db.patch(args.id, { isGift: args.isGift });
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

export const clearAllOrders = mutation({
  args: {
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
    if (!isAuthorized) {
      throw new Error("Unauthorized - Invalid or expired session");
    }
    const orders = await ctx.db.query("orders").collect();
    await Promise.all(orders.map((order) => ctx.db.delete(order._id)));
  },
});

export const getOrderCount = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    return orders.length;
  },
});

export const getByOrderIdPublic = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (!order) return null;
    return {
      orderId: order.orderId,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
    };
  },
});

export const expireStaleOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const pendingOrders = await ctx.db
      .query("orders")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "Pending Payment"),
          q.lt(q.field("createdAt"), oneHourAgo)
        )
      )
      .collect();
    for (const order of pendingOrders) {
      await ctx.db.patch(order._id, {
        status: "Expired",
        statusHistory: [
          ...(order.statusHistory ?? []),
          { status: "Expired", timestamp: Date.now() },
        ],
      });
    }
    return { expired: pendingOrders.length };
  },
});
