import { action } from "./_generated/server";
import { v } from "convex/values";

// Convex exposes process.env at runtime.
declare const process: { env: Record<string, string | undefined> };

const NABOOPAY_API_URL = "https://api.naboopay.com/api/v2/transactions";

export const createTransaction = action({
    args: {
        orderId: v.string(),
        customer: v.object({
            name: v.string(),
            phone: v.string(),
        }),
        items: v.array(v.object({
            name: v.string(),
            qty: v.number(),
            price: v.number(),
            description: v.optional(v.string()),
        })),
        successUrl: v.string(),
        errorUrl: v.string(),
    },
    handler: async (ctx, args) => {
        if (!process.env.NABOOPAY_TOKEN) {
            throw new Error("NABOOPAY_TOKEN is not set in environment variables");
        }
        const nameParts = args.customer.name.split(" ");
        const firstName = nameParts[0] || "Customer";
        const lastName = nameParts.slice(1).join(" ") || "Customer";

        const payload = {
            method_of_payment: ["orange_money", "wave"],
            products: args.items.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.qty,
                description: item.description || item.name
            })),
            success_url: args.successUrl,
            error_url: args.errorUrl,
            fees_customer_side: false,
            is_escrow: false,
            is_merchant: false,
            customer: {
                first_name: firstName,
                last_name: lastName,
                phone: args.customer.phone
            }
        };

        const response = await fetch(NABOOPAY_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${process.env.NABOOPAY_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("NabooPay Error:", errorText);
            throw new Error(`NabooPay API error (${response.status}): ${errorText || response.statusText}`);
        }

        const data = await response.json();
        return data;
    }
});

export const getTransaction = action({
    args: { orderId: v.string() },
    handler: async (ctx, args) => {
        if (!process.env.NABOOPAY_TOKEN) {
            throw new Error("NABOOPAY_TOKEN is not set");
        }
        const response = await fetch(`${NABOOPAY_API_URL}/${args.orderId}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${process.env.NABOOPAY_TOKEN}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to retrieve transaction: ${response.statusText}`);
        }
        return await response.json();
    }
});

export const deleteTransaction = action({
    args: { orderId: v.string() },
    handler: async (ctx, args) => {
        if (!process.env.NABOOPAY_TOKEN) {
            throw new Error("NABOOPAY_TOKEN is not set");
        }
        const response = await fetch(`${NABOOPAY_API_URL}/${args.orderId}`, {
            method: "DELETE",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${process.env.NABOOPAY_TOKEN}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to delete transaction: ${response.statusText}`);
        }
        return await response.json();
    }
});
