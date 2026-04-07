import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifyAdminToken } from "./auth";

declare const process: { env: Record<string, string | undefined> };

export const list = query({
    args: {},
    handler: async (ctx) => {
        const collections = await ctx.db.query("collections").collect();

        return await Promise.all(collections.map(async (collection) => {
            let imageUrl: string | undefined = collection.image;
            if (imageUrl && imageUrl.startsWith("kg")) {
                imageUrl = (await ctx.storage.getUrl(imageUrl)) ?? undefined;
            }
            return { ...collection, image: imageUrl };
        }));
    },
});

export const listMinimal = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("collections").collect();
    },
});

export const getById = query({
    args: { id: v.id("collections") },
    handler: async (ctx, args) => {
        const collection = await ctx.db.get(args.id);
        if (!collection) return null;

        let imageUrl: string | undefined = collection.image;
        if (imageUrl && imageUrl.startsWith("kg")) {
            imageUrl = (await ctx.storage.getUrl(imageUrl)) ?? undefined;
        }
        return { ...collection, image: imageUrl };
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("collections")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const addCollection = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) {
            throw new Error("Unauthorized - Invalid or expired session");
        }
        const { adminToken: _adminToken, ...collectionArgs } = args;
        const collectionId = await ctx.db.insert("collections", collectionArgs);
        return collectionId;
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

export const updateCollection = mutation({
    args: {
        id: v.id("collections"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) {
            throw new Error("Unauthorized - Invalid or expired session");
        }
        const { id, adminToken: _adminToken, ...fields } = args;
        await ctx.db.patch(id, fields);
    },
});

export const removeCollection = mutation({
    args: { id: v.id("collections"), adminToken: v.string() },
    handler: async (ctx, args) => {
        const isAuthorized = await verifyAdminToken(ctx, args.adminToken);
        if (!isAuthorized) {
            throw new Error("Unauthorized - Invalid or expired session");
        }
        // Remove collection reference from all products first
        const products = await ctx.db.query("products").collect();
        const collection = await ctx.db.get(args.id);

        if (collection) {
            for (const product of products) {
                if (product.collection === collection.name) {
                    await ctx.db.patch(product._id, { collection: undefined });
                }
            }
        }

        await ctx.db.delete(args.id);
    },
});
