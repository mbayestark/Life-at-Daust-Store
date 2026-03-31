import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Convex exposes process.env at runtime. We declare it as an ambient variable
// here to avoid requiring @types/node, since Convex is not a Node.js environment.
declare const process: { env: Record<string, string | undefined> };

export const list = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust")) {
      throw new Error("Unauthorized");
    }
    return await ctx.db.query("orders").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("orders"), adminToken: v.string() },
  handler: async (ctx, args) => {
    if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust")) {
      throw new Error("Unauthorized");
    }
    return await ctx.db.get(args.id);
  },
});

const QZIP_RE = /quarter.?zip/i;

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
      hoodieType: v.optional(v.string()),
      color: v.optional(v.string()),
      size: v.optional(v.string()),
      logo: v.optional(v.string()),
      logoPosition: v.optional(v.string()),
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
    buyerUserId: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    referralDiscount: v.optional(v.number()),
    couponDiscount: v.optional(v.number()),
    couponApplied: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if the early-order promo is still active (first 10 confirmed orders)
    const totalOrders = (await ctx.db.query("orders").collect()).length;
    const promoActive = totalOrders < 10;

    // Server-side referral validation — ignore client-supplied discount amount
    let referralCode: string | undefined;
    let referralDiscount: number | undefined;

    if (args.referralCode && !promoActive) {
      const code = args.referralCode.toUpperCase();
      const referrer = await ctx.db
        .query("users")
        .withIndex("by_referral_code", (q) => q.eq("referral_code", code))
        .first();

      if (referrer && !(args.buyerUserId && args.buyerUserId === referrer._id.toString())) {
        const alreadyUsed = args.buyerUserId
          ? await ctx.db
              .query("orders")
              .filter((q) =>
                q.and(
                  q.eq(q.field("buyerUserId"), args.buyerUserId as string),
                  q.eq(q.field("referralCode"), code),
                  q.eq(q.field("referralTracked"), true)
                )
              )
              .first()
          : null;

        if (!alreadyUsed) {
          referralCode = code;
          const eligibleTotal = args.items
            .filter((it) => !QZIP_RE.test(it.name))
            .reduce((sum, it) => sum + it.price * it.qty, 0);
          referralDiscount = Math.round(eligibleTotal * 0.07);
        }
      }
    }

    // Server-side coupon validation — ignore client-supplied discount amount
    let couponDiscount: number | undefined;
    let couponApplied: boolean | undefined;

    if (args.couponApplied && args.buyerUserId) {
      const buyer = await ctx.db.get(args.buyerUserId as Id<"users">);
      if (buyer && buyer.coupon_percent > 0 && !buyer.coupon_used) {
        const eligibleTotal = args.items
          .filter((it) => !QZIP_RE.test(it.name))
          .reduce((sum, it) => sum + it.price * it.qty, 0);
        couponDiscount = Math.round(eligibleTotal * (buyer.coupon_percent / 100));
        couponApplied = true;
      }
    }

    const proofOfPaymentUrl = args.paymentStorageId ? (await ctx.storage.getUrl(args.paymentStorageId)) ?? undefined : undefined;
    const orderId = await ctx.db.insert("orders", {
      orderId: args.orderId,
      customer: args.customer,
      items: args.items,
      subtotal: args.subtotal,
      deliveryFee: args.deliveryFee,
      total: args.total,
      paymentMethod: args.paymentMethod,
      paymentStorageId: args.paymentStorageId,
      naboopayOrderId: args.naboopayOrderId,
      naboopayCheckoutUrl: args.naboopayCheckoutUrl,
      buyerUserId: args.buyerUserId,
      referralCode,
      referralDiscount,
      couponDiscount,
      couponApplied,
      status: args.paymentMethod === "naboopay" ? "Pending Payment" : "Pending Verification",
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
    if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust")) {
      throw new Error("Unauthorized");
    }
    const order = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, { status: args.status });

    if (args.status === "Paid" && order && !order.referralTracked) {
      await ctx.db.patch(args.id, { referralTracked: true });
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

export const deleteOrder = mutation({
  args: {
    id: v.id("orders"),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust")) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});

export const clearAllOrders = mutation({
  args: {
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust")) {
      throw new Error("Unauthorized");
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
