import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const syncToSheets = internalAction({
    args: {
        orderId: v.string(),
        name: v.string(),
        phone: v.string(),
        location: v.string(),
        items: v.string(),
        total: v.number(),
    },
    handler: async (ctx, args) => {
        const sheetsUrl = process.env.SHEETS_WEBAPP_URL;
        const sheetsSecret = process.env.SHEETS_SECRET;

        if (!sheetsUrl || !sheetsSecret) {
            console.warn("Google Sheets synchronization is not configured (missing SHEETS_WEBAPP_URL or SHEETS_SECRET)");
            return;
        }

        try {
            const payload = {
                orderId: args.orderId,
                name: args.name,
                phone: args.phone,
                location: args.location,
                items: args.items,
                total: args.total,
                secret: sheetsSecret,
                timestamp: new Date().toISOString(),
            };

            const response = await fetch(sheetsUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("Google Sheets backup failed:", error);
        }
    },
});
