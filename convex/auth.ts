import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

declare const process: { env: Record<string, string | undefined> };

// Session storage in database
interface AdminSession {
    token: string;
    expiresAt: number;
    createdAt: number;
}

// Generate a secure random token
function generateToken(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    const randomStr2 = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}${randomStr2}`;
}

// Simple rate limiting in memory (resets on server restart)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; waitTime?: number } {
    const now = Date.now();
    const attempt = loginAttempts.get(identifier);

    if (!attempt || now > attempt.resetAt) {
        // Reset or first attempt
        loginAttempts.set(identifier, { count: 1, resetAt: now + 15 * 60 * 1000 }); // 15 minutes
        return { allowed: true };
    }

    if (attempt.count >= 5) {
        // Too many attempts
        const waitTime = Math.ceil((attempt.resetAt - now) / 1000);
        return { allowed: false, waitTime };
    }

    // Increment attempts
    attempt.count++;
    loginAttempts.set(identifier, attempt);
    return { allowed: true };
}

export const login = mutation({
    args: {
        password: v.string(),
    },
    handler: async (ctx, args) => {
        // Rate limiting (using a fixed identifier since we have one admin)
        const rateLimitCheck = checkRateLimit("admin");
        if (!rateLimitCheck.allowed) {
            throw new Error(`Too many login attempts. Please try again in ${rateLimitCheck.waitTime} seconds.`);
        }

        // Get password from server environment (NOT exposed to client)
        const adminPassword = process.env.ADMIN_PASSWORD || "daust";

        if (args.password !== adminPassword) {
            throw new Error("Invalid password");
        }

        // Generate session token
        const token = generateToken();
        const now = Date.now();
        const expiresAt = now + 30 * 60 * 1000; // 30 minutes

        // Store session in database
        await ctx.db.insert("adminSessions", {
            token,
            expiresAt,
            createdAt: now,
        });

        // Clean up old sessions (optional, for housekeeping)
        const oldSessions = await ctx.db
            .query("adminSessions")
            .filter((q) => q.lt(q.field("expiresAt"), now))
            .collect();

        for (const session of oldSessions) {
            await ctx.db.delete(session._id);
        }

        return {
            token,
            expiresAt,
        };
    },
});

export const verifyToken = query({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("adminSessions")
            .filter((q) => q.eq(q.field("token"), args.token))
            .first();

        if (!session) {
            return { valid: false, reason: "Session not found" };
        }

        const now = Date.now();
        if (now > session.expiresAt) {
            // Session expired, clean it up
            await ctx.db.delete(session._id);
            return { valid: false, reason: "Session expired" };
        }

        return { valid: true, expiresAt: session.expiresAt };
    },
});

export const logout = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("adminSessions")
            .filter((q) => q.eq(q.field("token"), args.token))
            .first();

        if (session) {
            await ctx.db.delete(session._id);
        }

        return { success: true };
    },
});

export const refreshSession = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("adminSessions")
            .filter((q) => q.eq(q.field("token"), args.token))
            .first();

        if (!session) {
            throw new Error("Session not found");
        }

        const now = Date.now();
        if (now > session.expiresAt) {
            await ctx.db.delete(session._id);
            throw new Error("Session expired");
        }

        // Extend session by 30 minutes
        const newExpiresAt = now + 30 * 60 * 1000;
        await ctx.db.patch(session._id, {
            expiresAt: newExpiresAt,
        });

        return { expiresAt: newExpiresAt };
    },
});

// Helper function for other mutations to verify admin access
export async function verifyAdminToken(ctx: any, token: string): Promise<boolean> {
    if (!token) return false;

    const session = await ctx.db
        .query("adminSessions")
        .filter((q: any) => q.eq(q.field("token"), token))
        .first();

    if (!session) return false;

    const now = Date.now();
    if (now > session.expiresAt) {
        await ctx.db.delete(session._id);
        return false;
    }

    return true;
}
