import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Convex exposes process.env at runtime.
declare const process: { env: Record<string, string | undefined> };

// Helper to verify HMAC-SHA256 signature using Web Crypto API (Convex compatible)
async function verifySignature(body: string, signature: string, secretKey: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const bodyData = encoder.encode(body);
    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        bodyData
    );
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === signature;
}

http.route({
    path: "/naboopay-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const signature = request.headers.get("X-Signature");
        const secretKey = process.env.NABOOPAY_WEBHOOK_SECRET;
        if (!signature || !secretKey) {
            return new Response("Unauthorized", { status: 401 });
        }
        const bodyText = await request.text();

        const isValid = await verifySignature(bodyText, signature, secretKey);
        if (!isValid) {
            return new Response("Invalid signature", { status: 401 });
        }
        try {
            const payload = JSON.parse(bodyText);
            const orderId = payload["order_id"];
            const status = payload["transaction_status"];
            await ctx.runMutation(internal.orders.updateByNabooPayId, {
                naboopayOrderId: orderId,
                status: status,
            });
            return new Response(JSON.stringify({ status: "received" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            return new Response("Error processing webhook", { status: 500 });
        }
    }),
});

export default http;
