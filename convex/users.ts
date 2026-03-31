import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

declare const process: { env: Record<string, string | undefined> };

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;  // 1 hour
const APP_URL = "https://shop.daustgov.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePasswordStrength(password: string): string | null {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    return null;
}

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        256
    );
    const hashHex = Array.from(new Uint8Array(derivedBits))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const saltHex = Array.from(salt)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [saltHex, storedHash] = stored.split(":");
    if (!saltHex || !storedHash) return false;
    const saltBytes = saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16));
    const salt = new Uint8Array(saltBytes);
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        256
    );
    const hashHex = Array.from(new Uint8Array(derivedBits))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    // Constant-time comparison
    if (hashHex.length !== storedHash.length) return false;
    let diff = 0;
    for (let i = 0; i < hashHex.length; i++) {
        diff |= hashHex.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return diff === 0;
}

function generateReferralCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    return Array.from(bytes)
        .map((b) => chars[b % chars.length])
        .join("");
}

function generateSecureToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export const createUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const name = args.name.trim();

        if (!EMAIL_RE.test(email)) {
            throw new Error("Please enter a valid email address.");
        }
        if (name.length < 2 || name.length > 80) {
            throw new Error("Name must be between 2 and 80 characters.");
        }
        const pwError = validatePasswordStrength(args.password);
        if (pwError) throw new Error(pwError);

        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();
        if (existing) {
            throw new Error("An account with this email already exists.");
        }

        const passwordHash = await hashPassword(args.password);

        let referral_code = generateReferralCode();
        for (let i = 0; i < 10; i++) {
            const collision = await ctx.db
                .query("users")
                .withIndex("by_referral_code", (q) => q.eq("referral_code", referral_code))
                .first();
            if (!collision) break;
            referral_code = generateReferralCode();
        }

        const userId = await ctx.db.insert("users", {
            name,
            email,
            passwordHash,
            referral_code,
            referral_count: 0,
            coupon_percent: 0,
            coupon_used: false,
        });

        return { userId, name, email, referral_code };
    },
});

export const loginUser = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();

        if (!EMAIL_RE.test(email)) {
            throw new Error("Invalid email or password.");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        // Always perform timing-equivalent work to prevent user enumeration
        if (!user) {
            await hashPassword("dummy-timing-password");
            throw new Error("Invalid email or password.");
        }

        // Lockout check
        const now = Date.now();
        if (user.lockedUntil && user.lockedUntil > now) {
            const minutesLeft = Math.ceil((user.lockedUntil - now) / 60000);
            throw new Error(`Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`);
        }

        const valid = await verifyPassword(args.password, user.passwordHash);

        if (!valid) {
            const attempts = (user.loginAttempts ?? 0) + 1;
            const patch: Record<string, unknown> = { loginAttempts: attempts };
            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                patch.lockedUntil = now + LOCKOUT_DURATION_MS;
                patch.loginAttempts = 0;
            }
            await ctx.db.patch(user._id, patch as any);
            const remaining = MAX_LOGIN_ATTEMPTS - attempts;
            if (remaining <= 0) {
                throw new Error(`Too many failed attempts. Account locked for 15 minutes.`);
            }
            throw new Error(`Invalid email or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
        }

        // Reset failed attempts on success
        if ((user.loginAttempts ?? 0) > 0 || user.lockedUntil) {
            await ctx.db.patch(user._id, { loginAttempts: 0, lockedUntil: undefined } as any);
        }

        return {
            userId: user._id,
            name: user.name,
            email: user.email,
            referral_code: user.referral_code,
        };
    },
});

export const getById = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.id);
        if (!user) return null;
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            referral_code: user.referral_code,
            referral_count: user.referral_count,
            coupon_percent: user.coupon_percent,
            coupon_used: user.coupon_used,
        };
    },
});

export const requestPasswordReset = action({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        if (!EMAIL_RE.test(email)) {
            return { sent: true }; // Silent — don't leak whether email exists
        }

        const user = await ctx.runQuery(api.users.findByEmail, { email });
        if (!user) {
            return { sent: true }; // Silent
        }

        // Rate-limit reset requests: block if a valid token already exists and was issued < 5 min ago
        if (user.resetTokenExpiry && user.resetTokenExpiry > Date.now() + RESET_TOKEN_TTL_MS - 5 * 60 * 1000) {
            return { sent: true };
        }

        const token = generateSecureToken();
        const expiry = Date.now() + RESET_TOKEN_TTL_MS;
        await ctx.runMutation(api.users.setResetToken, { userId: user._id, token, expiry });

        const resetUrl = `${APP_URL}/reset-password?token=${token}`;
        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) throw new Error("Email service not configured.");

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Life at DAUST <no-reply@shop.daustgov.com>",
                to: email,
                subject: "Reset your password",
                html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
  <img src="${APP_URL}/logo.png" alt="Life at DAUST" style="height:60px;margin-bottom:24px" />
  <h2 style="color:#0a1628;font-size:22px;font-weight:900;margin:0 0 12px">Reset your password</h2>
  <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px">
    We received a request to reset the password for your account (<strong>${email}</strong>).
    Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
  </p>
  <a href="${resetUrl}" style="display:inline-block;background:#e8521a;color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase">
    Reset Password
  </a>
  <p style="color:#aaa;font-size:12px;margin:24px 0 0">
    If you did not request this, you can safely ignore this email. Your password will not change.
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
  <p style="color:#ccc;font-size:11px">Life at DAUST Store &nbsp;&bull;&nbsp; shop.daustgov.com</p>
</div>`,
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Failed to send reset email: ${body}`);
        }

        return { sent: true };
    },
});

export const findByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
        if (!user) return null;
        return {
            _id: user._id,
            email: user.email,
            resetTokenExpiry: user.resetTokenExpiry,
        };
    },
});

export const setResetToken = mutation({
    args: { userId: v.id("users"), token: v.string(), expiry: v.number() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            resetToken: args.token,
            resetTokenExpiry: args.expiry,
        });
    },
});

export const resetPassword = mutation({
    args: { token: v.string(), newPassword: v.string() },
    handler: async (ctx, args) => {
        const pwError = validatePasswordStrength(args.newPassword);
        if (pwError) throw new Error(pwError);

        const user = await ctx.db
            .query("users")
            .withIndex("by_reset_token", (q) => q.eq("resetToken", args.token))
            .first();

        if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
            throw new Error("This reset link is invalid or has expired.");
        }

        const passwordHash = await hashPassword(args.newPassword);
        await ctx.db.patch(user._id, {
            passwordHash,
            resetToken: undefined,
            resetTokenExpiry: undefined,
            loginAttempts: 0,
            lockedUntil: undefined,
        } as any);

        return { success: true };
    },
});
