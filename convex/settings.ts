import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifyAdminToken, logAudit } from "./auth";

const mediaItem = v.object({
    storageId: v.string(),
    type: v.union(v.literal("image"), v.literal("video")),
});

// Public: returns {url, type}[] for the storefront
export const getHeroMedia = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("siteSettings").first();
        const media = settings?.heroMedia || [];
        return await Promise.all(media.map(async (item) => ({
            type: item.type,
            url: item.storageId.startsWith("kg")
                ? ((await ctx.storage.getUrl(item.storageId)) || item.storageId)
                : item.storageId,
        })));
    },
});

// Admin: returns {storageId, url, type}[]
export const getHeroMediaAdmin = query({
    args: { adminToken: v.string() },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) throw new Error("Unauthorized");
        const settings = await ctx.db.query("siteSettings").first();
        const media = settings?.heroMedia || [];
        return await Promise.all(media.map(async (item) => ({
            storageId: item.storageId,
            type: item.type,
            url: item.storageId.startsWith("kg")
                ? ((await ctx.storage.getUrl(item.storageId)) || item.storageId)
                : item.storageId,
        })));
    },
});

// Public: returns resolved video URLs for the reel section
export const getReelVideos = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("siteSettings").first();
        const videos = settings?.reelVideos || [];
        return await Promise.all(videos.map(async (id) => {
            if (id.startsWith("kg")) return (await ctx.storage.getUrl(id)) || id;
            return id;
        }));
    },
});

// Admin: returns {storageId, url}[]
export const getReelVideosAdmin = query({
    args: { adminToken: v.string() },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) throw new Error("Unauthorized");
        const settings = await ctx.db.query("siteSettings").first();
        const videos = settings?.reelVideos || [];
        return await Promise.all(videos.map(async (storageId) => ({
            storageId,
            url: storageId.startsWith("kg") ? ((await ctx.storage.getUrl(storageId)) || storageId) : storageId,
        })));
    },
});

export const updateReelVideos = mutation({
    args: { reelVideos: v.array(v.string()), adminToken: v.string() },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) throw new Error("Unauthorized");
        const existing = await ctx.db.query("siteSettings").first();
        if (existing) {
            await ctx.db.patch(existing._id, { reelVideos: args.reelVideos });
        } else {
            await ctx.db.insert("siteSettings", { reelVideos: args.reelVideos });
        }
        await logAudit(ctx, args.adminToken, "settings.reel_videos", undefined, `${args.reelVideos.length} videos`);
    },
});

export const updateHeroMedia = mutation({
    args: {
        heroMedia: v.array(mediaItem),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) throw new Error("Unauthorized");
        const existing = await ctx.db.query("siteSettings").first();
        if (existing) {
            await ctx.db.patch(existing._id, { heroMedia: args.heroMedia });
        } else {
            await ctx.db.insert("siteSettings", { heroMedia: args.heroMedia });
        }
        await logAudit(ctx, args.adminToken, "settings.hero_media", undefined, `${args.heroMedia.length} items`);
    },
});
