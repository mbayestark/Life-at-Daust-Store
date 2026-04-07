import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifyAdminToken } from "./auth";

export const list = query({
    args: { folder: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let mediaQuery;
        if (args.folder) {
            mediaQuery = ctx.db
                .query("media")
                .withIndex("by_folder", (q) => q.eq("folder", args.folder));
        } else {
            mediaQuery = ctx.db.query("media");
        }
        const items = await mediaQuery.order("desc").collect();
        return await Promise.all(
            items.map(async (item) => {
                const url = await ctx.storage.getUrl(item.storageId);
                return { ...item, url: url || item.url };
            })
        );
    },
});

export const upload = mutation({
    args: {
        storageId: v.string(),
        name: v.string(),
        type: v.union(v.literal("image"), v.literal("video")),
        folder: v.optional(v.string()),
        size: v.optional(v.number()),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) {
            throw new Error("Unauthorized - Invalid or expired session");
        }
        const { adminToken, ...mediaArgs } = args;
        const url = await ctx.storage.getUrl(args.storageId);
        const id = await ctx.db.insert("media", {
            ...mediaArgs,
            url: url || undefined,
            uploadedAt: Date.now(),
        });
        return id;
    },
});

export const rename = mutation({
    args: {
        id: v.id("media"),
        name: v.string(),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) {
            throw new Error("Unauthorized - Invalid or expired session");
        }
        await ctx.db.patch(args.id, { name: args.name });
    },
});

export const remove = mutation({
    args: {
        id: v.id("media"),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) {
            throw new Error("Unauthorized - Invalid or expired session");
        }
        const item = await ctx.db.get(args.id);
        if (item) {
            await ctx.storage.delete(item.storageId);
            await ctx.db.delete(args.id);
        }
    },
});

export const generateUploadUrl = mutation({
    args: { adminToken: v.string() },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) {
            throw new Error("Unauthorized - Invalid or expired session");
        }
        return await ctx.storage.generateUploadUrl();
    },
});
