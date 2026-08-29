import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { verifyAdminToken, verifyManagerToken, logAudit } from "./auth";

// ponytail: in-memory rate limit, resets on deploy. DB-backed if spam becomes a real problem.
const orderRateLimit = new Map<string, { count: number; resetAt: number }>();
function checkOrderRateLimit(phone: string): { allowed: boolean } {
  const now = Date.now();
  const entry = orderRateLimit.get(phone);
  if (!entry || now > entry.resetAt) {
    orderRateLimit.set(phone, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return { allowed: true };
  }
  if (entry.count >= 10) return { allowed: false };
  entry.count++;
  return { allowed: true };
}

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
    if (!checkOrderRateLimit(args.customer.phone).allowed) {
      throw new Error("Too many orders. Please wait a few minutes before trying again.");
    }
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

    // Server-side price validation: look up real prices from DB
    const QUARTER_ZIP_RE = /quarter.?zip/i;
    const validatedItems = await Promise.all(
      args.items.map(async (item) => {
        if (item.isProductSet && item.productId) {
          // Product set: validate against specialPrice
          const set = await ctx.db.get(item.productId as any);
          if (!set) throw new Error(`Product set not found: ${item.name}`);
          const serverPrice = (set as any).specialPrice;
          return { ...item, price: serverPrice };
        } else if (item.productId) {
          // Regular product: use salePrice if on sale, else price
          const product = await ctx.db.get(item.productId as any);
          if (!product) throw new Error(`Product not found: ${item.name}`);
          const p = product as any;
          const serverPrice =
            p.salePrice != null && p.salePrice < p.price
              ? p.salePrice
              : p.price;
          return { ...item, price: serverPrice };
        }
        return item;
      })
    );

    let verifiedSubtotal = validatedItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    // Recompute discounts server-side
    let verifiedReferralDiscount = 0;
    if (args.referralCode) {
      const eligibleTotal = validatedItems
        .filter((it) => !QUARTER_ZIP_RE.test(it.name))
        .reduce((sum, it) => sum + it.price * it.qty, 0);
      verifiedReferralDiscount = Math.round(eligibleTotal * 0.07);
    }

    let verifiedCouponDiscount = 0;
    if (args.couponApplied && args.buyerUserId) {
      const user = await ctx.db.get(args.buyerUserId as any);
      if (user && (user as any).coupon_percent > 0 && !(user as any).coupon_used) {
        const eligibleTotal = validatedItems
          .filter((it) => !QUARTER_ZIP_RE.test(it.name))
          .reduce((sum, it) => sum + it.price * it.qty, 0);
        verifiedCouponDiscount = Math.round(
          eligibleTotal * ((user as any).coupon_percent / 100)
        );
      }
    }

    const verifiedTotal =
      verifiedSubtotal + args.deliveryFee - verifiedReferralDiscount - verifiedCouponDiscount;

    const proofOfPaymentUrl = args.paymentStorageId ? (await ctx.storage.getUrl(args.paymentStorageId)) ?? undefined : undefined;
    const initialStatus = args.paymentMethod === "naboopay" ? "Pending Payment" : "Pending Verification";
    const orderId = await ctx.db.insert("orders", {
      ...args,
      items: validatedItems,
      subtotal: verifiedSubtotal,
      total: verifiedTotal,
      ...(args.referralCode ? { referralDiscount: verifiedReferralDiscount } : {}),
      ...(args.couponApplied ? { couponDiscount: verifiedCouponDiscount } : {}),
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
      await ctx.db.insert("auditLogs", {
        action: "webhook.payment_after_" + order.status.toLowerCase(),
        actor: "system",
        target: order.orderId,
        details: `NabooPay status "${args.status}" received for ${order.status} order`,
        timestamp: Date.now(),
      });
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
    await logAudit(ctx, args.adminToken, "order.status", order?.orderId ?? args.id, `${order?.status} → ${args.status}`);
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
    await logAudit(ctx, args.adminToken, "order.bulk_status", `${args.ids.length} orders`, `→ ${args.status}`);
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
    const order = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, { isGift: args.isGift });
    await logAudit(ctx, args.adminToken, args.isGift ? "order.mark_gift" : "order.unmark_gift", order?.orderId ?? args.id);
  },
});

export const updateOrderItems = mutation({
  args: {
    id: v.id("orders"),
    adminToken: v.string(),
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
  },
  handler: async (ctx, args) => {
    const isAuthorized = await verifyManagerToken(ctx, args.adminToken);
    if (!isAuthorized) {
      throw new Error("Unauthorized - Manager access required");
    }
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");
    const newSubtotal = args.items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const discount = (order.referralDiscount || 0) + (order.couponDiscount || 0);
    const newTotal = newSubtotal + (order.deliveryFee || 0) - discount;
    await ctx.db.patch(args.id, {
      items: args.items,
      subtotal: newSubtotal,
      total: newTotal,
    });
    await logAudit(ctx, args.adminToken, "order.edit_items", order.orderId, `${args.items.length} items, new total ${newTotal}`);
  },
});

export const deleteOrder = mutation({
  args: {
    id: v.id("orders"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const isAuthorized = await verifyManagerToken(ctx, args.adminToken);
    if (!isAuthorized) {
      throw new Error("Unauthorized - Manager access required");
    }
    const order = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await logAudit(ctx, args.adminToken, "order.delete", order?.orderId ?? args.id);
  },
});

export const clearAllOrders = mutation({
  args: {
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const isAuthorized = await verifyManagerToken(ctx, args.adminToken);
    if (!isAuthorized) {
      throw new Error("Unauthorized - Manager access required");
    }
    const orders = await ctx.db.query("orders").collect();
    await Promise.all(orders.map((order) => ctx.db.delete(order._id)));
    await logAudit(ctx, args.adminToken, "order.clear_all", `${orders.length} orders`, "Cleared all orders");
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
