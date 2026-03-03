import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Convex exposes process.env at runtime. We declare it as an ambient variable
// here to avoid requiring @types/node, since Convex is not a Node.js environment.
declare const process: { env: Record<string, string | undefined> };

// Helper: resolve all storage IDs inside a logoImages object to URLs
async function resolveLogoImages(ctx: any, logoImages: any): Promise<any> {
    if (!logoImages || typeof logoImages !== "object") return logoImages;
    const resolved: any = {};
    for (const [logoKey, colorMap] of Object.entries(logoImages)) {
        resolved[logoKey] = {};
        if (colorMap && typeof colorMap === "object") {
            for (const [colorName, images] of Object.entries(colorMap as any)) {
                if (Array.isArray(images)) {
                    resolved[logoKey][colorName] = await Promise.all(
                        images.map(async (img: string) => {
                            if (typeof img === "string" && img.startsWith("kg")) {
                                return (await ctx.storage.getUrl(img)) || img;
                            }
                            return img;
                        })
                    );
                }
            }
        }
    }
    return resolved;
}

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

            // Resolve logo image storage IDs to URLs
            let logos = product.logos;
            if (logos && logos.length > 0) {
                logos = await Promise.all(logos.map(async (logo) => {
                    if (logo.image && logo.image.startsWith("kg")) {
                        const logoUrl = await ctx.storage.getUrl(logo.image);
                        return { ...logo, image: logoUrl || logo.image };
                    }
                    return logo;
                }));
            }

            const logoImages = await resolveLogoImages(ctx, product.logoImages);

            return {
                ...product,
                image: imageUrl,
                logos,
                logoImages,
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

        // Resolve logo image storage IDs to URLs
        let logos = product.logos;
        if (logos && logos.length > 0) {
            logos = await Promise.all(logos.map(async (logo) => {
                if (logo.image && logo.image.startsWith("kg")) {
                    const logoUrl = await ctx.storage.getUrl(logo.image);
                    return { ...logo, image: logoUrl || logo.image };
                }
                return logo;
            }));
        }

        const logoImages = await resolveLogoImages(ctx, product.logoImages);

        return {
            ...product,
            image: imageUrl,
            logos,
            logoImages,
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
        logos: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            image: v.optional(v.string()),
            description: v.optional(v.string()),
        }))),
        logoImages: v.optional(v.any()),
        description: v.optional(v.string()),
        collection: v.optional(v.string()),
        stock: v.optional(v.number()),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust")) {
            throw new Error("Unauthorized");
        }
        const { adminToken, ...productArgs } = args;
        const productId = await ctx.db.insert("products", productArgs);
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
        logos: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            image: v.optional(v.string()),
            description: v.optional(v.string()),
        }))),
        logoImages: v.optional(v.any()),
        description: v.optional(v.string()),
        collection: v.optional(v.string()),
        stock: v.optional(v.number()),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust")) {
            throw new Error("Unauthorized");
        }
        const { id, adminToken, ...fields } = args;
        await ctx.db.patch(id, fields);
    },
});

export const removeProduct = mutation({
    args: { id: v.id("products"), adminToken: v.string() },
    handler: async (ctx, args) => {
        if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust")) {
            throw new Error("Unauthorized");
        }
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
