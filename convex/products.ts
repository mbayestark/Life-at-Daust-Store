import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const products = await ctx.db.query("products").collect();

        // Convert storage IDs to URLs for images
        return await Promise.all(products.map(async (product) => {
            let imageUrl = product.image;

            // Check if the image is a storage ID (starts with "kg" which is Convex's storage ID prefix)
            if (imageUrl && imageUrl.startsWith("kg")) {
                imageUrl = await ctx.storage.getUrl(imageUrl) || product.image;
            }

            return {
                ...product,
                image: imageUrl,
            };
        }));
    },
});


export const getById = query({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.id);
        if (!product) return null;

        let imageUrl = product.image;

        // Check if the image is a storage ID
        if (imageUrl && imageUrl.startsWith("kg")) {
            imageUrl = await ctx.storage.getUrl(imageUrl) || product.image;
        }

        return {
            ...product,
            image: imageUrl,
        };
    },
});

export const addProduct = mutation({
    args: {
        name: v.string(),
        category: v.string(),
        price: v.number(),
        rating: v.number(),
        badge: v.optional(v.string()),
        image: v.string(),
        images: v.optional(v.array(v.string())),
        colors: v.optional(v.array(v.object({
            name: v.string(),
            hex: v.string(),
        }))),
        sizes: v.optional(v.array(v.string())),
        description: v.optional(v.string()),
        collection: v.optional(v.string()),
        stock: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const productId = await ctx.db.insert("products", args);
        return productId;
    },
});
export const updateProduct = mutation({
    args: {
        id: v.id("products"),
        name: v.optional(v.string()),
        category: v.optional(v.string()),
        price: v.optional(v.number()),
        rating: v.optional(v.number()),
        badge: v.optional(v.string()),
        image: v.optional(v.string()),
        images: v.optional(v.array(v.string())),
        colors: v.optional(v.array(v.object({
            name: v.string(),
            hex: v.string(),
        }))),
        sizes: v.optional(v.array(v.string())),
        description: v.optional(v.string()),
        collection: v.optional(v.string()),
        stock: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, fields);
    },
});

export const removeProduct = mutation({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const getImageUrl = query({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});
