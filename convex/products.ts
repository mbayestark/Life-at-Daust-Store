import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

declare const process: { env: Record<string, string | undefined> };

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
        return await Promise.all(products.map(async (product) => {
            let imageUrl = product.image;
            if (imageUrl && imageUrl.startsWith("kg")) {
                imageUrl = await ctx.storage.getUrl(imageUrl) || product.image;
            }
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
        if (imageUrl && imageUrl.startsWith("kg")) {
            imageUrl = await ctx.storage.getUrl(imageUrl) || product.image;
        }
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

export const listProductSets = query({
    args: {},
    handler: async (ctx) => {
        const productSets = await ctx.db.query("productSets").collect();
        return await Promise.all(productSets.map(async (set) => {
            let imageUrl = set.image;
            if (imageUrl && imageUrl.startsWith("kg")) {
                imageUrl = await ctx.storage.getUrl(imageUrl) || set.image;
            }
            // Resolve product details for each item in the set
            const resolvedProducts = await Promise.all(
                set.products.map(async (item) => {
                    const product = await ctx.db.get(item.productId);
                    if (!product) return null;
                    let productImage = product.image;
                    if (productImage && productImage.startsWith("kg")) {
                        productImage = await ctx.storage.getUrl(productImage) || product.image;
                    }
                    return {
                        ...item,
                        productName: product.name,
                        productImage,
                        productPrice: product.price,
                        colors: product.colors || [],
                        sizes: product.sizes || [],
                    };
                })
            );
            // Filter out null products (deleted products)
            const validProducts = resolvedProducts.filter(p => p !== null);
            // Calculate original price (sum of individual product prices)
            const originalPrice = validProducts.reduce(
                (sum, item) => sum + (item?.productPrice || 0) * (item?.quantity || 1),
                0
            );
            return {
                ...set,
                image: imageUrl,
                products: validProducts,
                originalPrice,
                savings: originalPrice - set.specialPrice,
            };
        }));
    },
});

export const getProductSetById = query({
    args: { id: v.id("productSets") },
    handler: async (ctx, args) => {
        const productSet = await ctx.db.get(args.id);
        if (!productSet) return null;
        let imageUrl = productSet.image;
        if (imageUrl && imageUrl.startsWith("kg")) {
            imageUrl = await ctx.storage.getUrl(imageUrl) || productSet.image;
        }
        const resolvedProducts = await Promise.all(
            productSet.products.map(async (item) => {
                const product = await ctx.db.get(item.productId);
                if (!product) return null;
                let productImage = product.image;
                if (productImage && productImage.startsWith("kg")) {
                    productImage = await ctx.storage.getUrl(productImage) || product.image;
                }
                return {
                    ...item,
                    productName: product.name,
                    productImage,
                    productPrice: product.price,
                    colors: product.colors || [],
                    sizes: product.sizes || [],
                };
            })
        );
        const validProducts = resolvedProducts.filter(p => p !== null);
        const originalPrice = validProducts.reduce(
            (sum, item) => sum + (item?.productPrice || 0) * (item?.quantity || 1),
            0
        );
        return {
            ...productSet,
            image: imageUrl,
            products: validProducts,
            originalPrice,
            savings: originalPrice - productSet.specialPrice,
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

export const addProductSet = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        products: v.array(v.object({
            productId: v.id("products"),
            quantity: v.number(),
            selectedColor: v.optional(v.string()),
            selectedSize: v.optional(v.string()),
            selectedLogo: v.optional(v.string()),
        })),
        specialPrice: v.number(),
        image: v.optional(v.string()),
        badge: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        if (args.adminToken !== (process.env.ADMIN_PASSWORD || "daust")) {
            throw new Error("Unauthorized");
        }
        const { adminToken, ...setArgs } = args;
        const setId = await ctx.db.insert("productSets", setArgs);
        return setId;
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

export const updateProductSet = mutation({
    args: {
        id: v.id("productSets"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        products: v.optional(v.array(v.object({
            productId: v.id("products"),
            quantity: v.number(),
            selectedColor: v.optional(v.string()),
            selectedSize: v.optional(v.string()),
            selectedLogo: v.optional(v.string()),
        }))),
        specialPrice: v.optional(v.number()),
        image: v.optional(v.string()),
        badge: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
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

export const removeProductSet = mutation({
    args: { id: v.id("productSets"), adminToken: v.string() },
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
