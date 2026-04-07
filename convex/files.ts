import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifyAdminToken } from "./auth";

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
