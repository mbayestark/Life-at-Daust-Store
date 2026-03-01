import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    products: defineTable({
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
            description: v.optional(v.string()),
        }))),
        logoImages: v.optional(v.any()),
        description: v.optional(v.string()),
        collection: v.optional(v.string()),
        stock: v.optional(v.number()),
    }),
    collections: defineTable({
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
    }).index("by_slug", ["slug"]),
    categories: defineTable({
        name: v.string(),
    }),
    orders: defineTable({
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
            color: v.optional(v.string()),
            size: v.optional(v.string()),
            logo: v.optional(v.string()),
        })),
        subtotal: v.number(),
        deliveryFee: v.number(),
        total: v.number(),
        status: v.string(),
        createdAt: v.number(),
    }),
});
