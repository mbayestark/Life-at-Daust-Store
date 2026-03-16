import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifyAdminToken } from "./auth";

// Public: returns resolved URLs for the storefront
export const getHeroImages = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("siteSettings").first();
        const images = settings?.heroImages || [];
        return await Promise.all(images.map(async (id) => {
            if (typeof id === "string" && id.startsWith("kg")) {
                return (await ctx.storage.getUrl(id)) || id;
            }
            return id;
        }));
    },
});

// Admin: returns both storageId and resolved URL
export const getHeroImagesAdmin = query({
    args: { adminToken: v.string() },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) throw new Error("Unauthorized");
        const settings = await ctx.db.query("siteSettings").first();
        const images = settings?.heroImages || [];
        return await Promise.all(images.map(async (storageId) => ({
            storageId,
            url: typeof storageId === "string" && storageId.startsWith("kg")
                ? ((await ctx.storage.getUrl(storageId)) || storageId)
                : storageId,
        })));
    },
});

export const updateHeroImages = mutation({
    args: {
        heroImages: v.array(v.string()),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) throw new Error("Unauthorized");
        const existing = await ctx.db.query("siteSettings").first();
        if (existing) {
            await ctx.db.patch(existing._id, { heroImages: args.heroImages });
        } else {
            await ctx.db.insert("siteSettings", { heroImages: args.heroImages });
        }
    },
});
