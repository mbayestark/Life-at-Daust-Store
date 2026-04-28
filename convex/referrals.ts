import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";

const QUARTER_ZIP_PATTERN = /quarter.?zip/i;

export function isQuarterZip(name: string): boolean {
    return QUARTER_ZIP_PATTERN.test(name);
}

export const validateCode = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        if (!args.code.trim()) return null;
        const referrer = await ctx.db
            .query("users")
            .withIndex("by_referral_code", (q) =>
                q.eq("referral_code", args.code.toUpperCase())
            )
            .first();
        if (!referrer) return null;
        return {
            referrerId: referrer._id,
            referrerName: referrer.name,
            code: referrer.referral_code,
        };
    },
});

export const getUserCoupon = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;
        return {
            coupon_percent: user.coupon_percent,
            coupon_used: user.coupon_used,
            referral_count: user.referral_count,
            hasActiveCoupon: user.coupon_percent > 0 && !user.coupon_used,
        };
    },
});

export const trackReferral = internalMutation({
    args: {
        referralCode: v.string(),
        buyerUserId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const referrer = await ctx.db
            .query("users")
            .withIndex("by_referral_code", (q) =>
                q.eq("referral_code", args.referralCode.toUpperCase())
            )
            .first();
        if (!referrer) return;

        if (args.buyerUserId && args.buyerUserId === referrer._id.toString()) {
            return;
        }

        const newCount = referrer.referral_count + 1;
        const newCoupon = Math.min(newCount * 12.5, 75);

        await ctx.db.patch(referrer._id, {
            referral_count: newCount,
            coupon_percent: newCoupon,
            coupon_used: false,
        });
    },
});

export const redeemCoupon = internalMutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return;
        if (user.coupon_percent <= 0 || user.coupon_used) return;

        await ctx.db.patch(args.userId, {
            referral_count: 0,
            coupon_percent: 0,
            coupon_used: true,
        });
    },
});

export const applyReferralCode = mutation({
    args: {
        code: v.string(),
        buyerUserId: v.id("users"),
        cartItems: v.array(v.object({ name: v.string(), price: v.number(), qty: v.number() })),
    },
    handler: async (ctx, args) => {
        const referrer = await ctx.db
            .query("users")
            .withIndex("by_referral_code", (q) =>
                q.eq("referral_code", args.code.toUpperCase())
            )
            .first();
        if (!referrer) {
            throw new ConvexError("Invalid referral code.");
        }

        if (args.buyerUserId === referrer._id) {
            throw new ConvexError("You cannot use your own referral code.");
        }

        const previousUse = await ctx.db
            .query("orders")
            .filter((q) =>
                q.and(
                    q.eq(q.field("buyerUserId"), args.buyerUserId as string),
                    q.eq(q.field("referralCode"), args.code.toUpperCase()),
                    q.eq(q.field("referralTracked"), true)
                )
            )
            .first();
        if (previousUse) {
            throw new ConvexError("You've already used this referral code on a previous order.");
        }

        const eligibleTotal = args.cartItems
            .filter((item) => !isQuarterZip(item.name))
            .reduce((sum, item) => sum + item.price * item.qty, 0);

        const discount = Math.round(eligibleTotal * 0.07);

        return {
            valid: true,
            referrerId: referrer._id,
            referrerName: referrer.name,
            discount,
            discountPercent: 7,
        };
    },
});

export const applyCoupon = mutation({
    args: {
        userId: v.id("users"),
        cartItems: v.array(v.object({ name: v.string(), price: v.number(), qty: v.number() })),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new ConvexError("User not found.");
        if (user.coupon_percent <= 0 || user.coupon_used) {
            throw new ConvexError("No active coupon available.");
        }

        const eligibleTotal = args.cartItems
            .filter((item) => !isQuarterZip(item.name))
            .reduce((sum, item) => sum + item.price * item.qty, 0);

        const discount = Math.round(eligibleTotal * (user.coupon_percent / 100));

        return {
            valid: true,
            coupon_percent: user.coupon_percent,
            discount,
        };
    },
});
