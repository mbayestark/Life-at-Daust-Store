import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

declare const process: { env: Record<string, string | undefined> };

export const ALL_PERMISSIONS = [
    "dashboard",
    "products",
    "product_sets",
    "collections",
    "orders",
    "media",
    "hero",
    "delete",
    "users",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

function generateToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    const derivedBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
    const hashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
    try {
        const [saltHex, storedHash] = stored.split(":");
        if (!saltHex || !storedHash) return false;
        const saltMatches = saltHex.match(/.{2}/g);
        if (!saltMatches) return false;
        const salt = new Uint8Array(saltMatches.map((b) => parseInt(b, 16)));
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
        const derivedBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
        const hashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("");
        if (hashHex.length !== storedHash.length) return false;
        let diff = 0;
        for (let i = 0; i < hashHex.length; i++) diff |= hashHex.charCodeAt(i) ^ storedHash.charCodeAt(i);
        return diff === 0;
    } catch {
        return false;
    }
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; waitTime?: number } {
    const now = Date.now();
    const attempt = loginAttempts.get(identifier);
    if (!attempt || now > attempt.resetAt) {
        loginAttempts.set(identifier, { count: 1, resetAt: now + 15 * 60 * 1000 });
        return { allowed: true };
    }
    if (attempt.count >= 5) {
        return { allowed: false, waitTime: Math.ceil((attempt.resetAt - now) / 1000) };
    }
    attempt.count++;
    return { allowed: true };
}

// ── Login ──
// Supports two modes:
// 1. Email + password → authenticates against adminUsers table
// 2. Password only (no email) → legacy fallback using env vars (for bootstrapping)
export const login = mutation({
    args: {
        email: v.optional(v.string()),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const rateLimitCheck = checkRateLimit(args.email || "legacy");
        if (!rateLimitCheck.allowed) {
            throw new Error(`Too many login attempts. Try again in ${rateLimitCheck.waitTime} seconds.`);
        }

        const now = Date.now();
        const token = generateToken();
        const expiresAt = now + 30 * 60 * 1000;

        // Mode 1: Email + password login
        if (args.email) {
            const email = args.email.trim().toLowerCase();
            if (!email.endsWith("@mydaust.org")) {
                throw new Error("Only @mydaust.org email addresses are allowed.");
            }

            const user = await ctx.db
                .query("adminUsers")
                .withIndex("by_email", (q) => q.eq("email", email))
                .first();

            if (!user) {
                await hashPassword("dummy-timing");
                throw new Error("Invalid email or password.");
            }

            if (user.isActive === false) {
                throw new Error("Account is deactivated. Contact a manager.");
            }

            const valid = await verifyPassword(args.password, user.passwordHash);
            if (!valid) throw new Error("Invalid email or password.");

            await ctx.db.insert("adminSessions", {
                token,
                expiresAt,
                createdAt: now,
                adminUserId: user._id,
                permissions: user.permissions,
            });

            cleanupSessions(ctx, now);
            await ctx.db.insert("auditLogs", { action: "auth.login", actor: user.name, actorEmail: user.email, timestamp: now });

            return {
                token,
                expiresAt,
                role: user.permissions.length === ALL_PERMISSIONS.length ? "manager" : "partner",
                permissions: user.permissions,
                userName: user.name,
                userEmail: user.email,
            };
        }

        // Mode 2: Legacy password-only login (for bootstrapping first user)
        const adminPassword = process.env.ADMIN_PASSWORD || "daust";
        const partnerPassword = process.env.PARTNER_PASSWORD || "uniwear";

        let role: "manager" | "partner";
        let permissions: string[];
        if (args.password === adminPassword) {
            role = "manager";
            permissions = [...ALL_PERMISSIONS];
        } else if (args.password === partnerPassword) {
            role = "partner";
            permissions = ["orders"];
        } else {
            throw new Error("Invalid password");
        }

        await ctx.db.insert("adminSessions", { token, expiresAt, createdAt: now, role, permissions });
        cleanupSessions(ctx, now);
        await ctx.db.insert("auditLogs", { action: "auth.login", actor: `${role} (legacy)`, timestamp: now });

        return { token, expiresAt, role, permissions };
    },
});

async function cleanupSessions(ctx: any, now: number) {
    const old = await ctx.db.query("adminSessions").filter((q: any) => q.lt(q.field("expiresAt"), now)).collect();
    for (const s of old) await ctx.db.delete(s._id);
}

// ── Session verification ──

export const verifyToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("adminSessions")
            .filter((q) => q.eq(q.field("token"), args.token))
            .first();

        if (!session) return { valid: false, reason: "Session not found" };
        if (Date.now() > session.expiresAt) return { valid: false, reason: "Session expired" };

        return {
            valid: true,
            expiresAt: session.expiresAt,
            role: session.role ?? "manager",
            permissions: session.permissions ?? [...ALL_PERMISSIONS],
        };
    },
});

export const logout = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db.query("adminSessions").filter((q) => q.eq(q.field("token"), args.token)).first();
        if (session) await ctx.db.delete(session._id);
        return { success: true };
    },
});

export const refreshSession = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db.query("adminSessions").filter((q) => q.eq(q.field("token"), args.token)).first();
        if (!session) throw new Error("Session not found");
        if (Date.now() > session.expiresAt) {
            await ctx.db.delete(session._id);
            throw new Error("Session expired");
        }
        const newExpiresAt = Date.now() + 30 * 60 * 1000;
        await ctx.db.patch(session._id, { expiresAt: newExpiresAt });
        return { expiresAt: newExpiresAt };
    },
});

// ── Helper functions for mutations ──

async function getSession(ctx: any, token: string) {
    if (!token) return null;
    const session = await ctx.db.query("adminSessions").filter((q: any) => q.eq(q.field("token"), token)).first();
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
        await ctx.db.delete(session._id);
        return null;
    }
    return session;
}

export async function verifyAdminToken(ctx: any, token: string): Promise<boolean> {
    return !!(await getSession(ctx, token));
}

export async function verifyManagerToken(ctx: any, token: string): Promise<boolean> {
    const session = await getSession(ctx, token);
    if (!session) return false;
    if (session.role === "manager") return true;
    const perms: string[] = session.permissions ?? [];
    return perms.includes("delete");
}

export async function verifyPermission(ctx: any, token: string, permission: string): Promise<boolean> {
    const session = await getSession(ctx, token);
    if (!session) return false;
    if (session.role === "manager" && !session.permissions) return true;
    const perms: string[] = session.permissions ?? [];
    return perms.includes(permission);
}

// ── Audit logging ──

async function getActorInfo(ctx: any, token: string): Promise<{ actor: string; actorEmail?: string }> {
    const session = await getSession(ctx, token);
    if (!session) return { actor: "unknown" };
    if (session.adminUserId) {
        const user = await ctx.db.get(session.adminUserId);
        if (user) return { actor: user.name, actorEmail: user.email };
    }
    return { actor: session.role === "manager" ? "manager (legacy)" : "partner (legacy)" };
}

export async function logAudit(ctx: any, token: string, action: string, target?: string, details?: string) {
    const { actor, actorEmail } = await getActorInfo(ctx, token);
    await ctx.db.insert("auditLogs", {
        action,
        actor,
        actorEmail,
        target,
        details,
        timestamp: Date.now(),
    });
}

export const listAuditLogs = query({
    args: { adminToken: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const hasAccess = await verifyPermission(ctx, args.adminToken, "dashboard");
        if (!hasAccess) throw new Error("Unauthorized");
        const limit = args.limit ?? 100;
        return await ctx.db.query("auditLogs").withIndex("by_timestamp").order("desc").take(limit);
    },
});

// ── Admin User CRUD ──

export const listAdminUsers = query({
    args: { adminToken: v.string() },
    handler: async (ctx, args) => {
        const hasAccess = await verifyPermission(ctx, args.adminToken, "users");
        if (!hasAccess) throw new Error("Unauthorized - requires 'users' permission");
        const users = await ctx.db.query("adminUsers").collect();
        return users.map((u) => ({
            _id: u._id,
            email: u.email,
            name: u.name,
            permissions: u.permissions,
            isActive: u.isActive !== false,
            createdAt: u.createdAt,
        }));
    },
});

export const createAdminUser = mutation({
    args: {
        email: v.string(),
        name: v.string(),
        password: v.string(),
        permissions: v.array(v.string()),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const hasAccess = await verifyPermission(ctx, args.adminToken, "users");
        if (!hasAccess) throw new Error("Unauthorized - requires 'users' permission");

        const email = args.email.trim().toLowerCase();
        if (!email.endsWith("@mydaust.org")) {
            throw new Error("Only @mydaust.org email addresses are allowed.");
        }

        const existing = await ctx.db.query("adminUsers").withIndex("by_email", (q) => q.eq("email", email)).first();
        if (existing) throw new Error("An admin user with this email already exists.");

        if (args.password.length < 8) throw new Error("Password must be at least 8 characters.");

        const passwordHash = await hashPassword(args.password);
        const userId = await ctx.db.insert("adminUsers", {
            email,
            name: args.name.trim(),
            passwordHash,
            permissions: args.permissions,
            isActive: true,
            createdAt: Date.now(),
        });

        await logAudit(ctx, args.adminToken, "user.create", email, `Created user "${args.name.trim()}" with permissions: ${args.permissions.join(", ")}`);
        return userId;
    },
});

export const updateAdminUser = mutation({
    args: {
        id: v.id("adminUsers"),
        name: v.optional(v.string()),
        permissions: v.optional(v.array(v.string())),
        isActive: v.optional(v.boolean()),
        newPassword: v.optional(v.string()),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const hasAccess = await verifyPermission(ctx, args.adminToken, "users");
        if (!hasAccess) throw new Error("Unauthorized - requires 'users' permission");

        const patch: Record<string, any> = {};
        if (args.name !== undefined) patch.name = args.name.trim();
        if (args.permissions !== undefined) patch.permissions = args.permissions;
        if (args.isActive !== undefined) patch.isActive = args.isActive;
        if (args.newPassword) {
            if (args.newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
            patch.passwordHash = await hashPassword(args.newPassword);
        }

        await ctx.db.patch(args.id, patch);
        const targetUser = await ctx.db.get(args.id);
        const changes = Object.keys(patch).filter(k => k !== "passwordHash").join(", ") + (args.newPassword ? (Object.keys(patch).length > 1 ? ", " : "") + "password" : "");
        await logAudit(ctx, args.adminToken, "user.update", targetUser?.email ?? args.id, `Updated: ${changes}`);
    },
});

export const changeOwnPassword = mutation({
    args: {
        currentPassword: v.string(),
        newPassword: v.string(),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await getSession(ctx, args.adminToken);
        if (!session || !session.adminUserId) throw new Error("Not logged in as a user account.");

        const user = await ctx.db.get(session.adminUserId);
        if (!user) throw new Error("User not found.");

        const valid = await verifyPassword(args.currentPassword, user.passwordHash);
        if (!valid) throw new Error("Current password is incorrect.");

        if (args.newPassword.length < 8) throw new Error("New password must be at least 8 characters.");

        const passwordHash = await hashPassword(args.newPassword);
        await ctx.db.patch(user._id, { passwordHash });
        await logAudit(ctx, args.adminToken, "user.change_password", user.email, "Changed own password");
    },
});

export const deleteAdminUser = mutation({
    args: {
        id: v.id("adminUsers"),
        adminToken: v.string(),
    },
    handler: async (ctx, args) => {
        const hasAccess = await verifyPermission(ctx, args.adminToken, "users");
        if (!hasAccess) throw new Error("Unauthorized - requires 'users' permission");
        const user = await ctx.db.get(args.id);
        await ctx.db.delete(args.id);
        await logAudit(ctx, args.adminToken, "user.delete", user?.email ?? args.id, `Deleted user "${user?.name}"`);
    },
});
