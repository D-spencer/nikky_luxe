import crypto from "crypto";
import { NextResponse } from "next/server";
import { markOrderPaidFromPaystack } from "@/lib/orders";
import { verifyPaystackTransaction } from "@/lib/paystack";
import type { PaystackTransactionData } from "@/lib/paystack";
import { requestBodyTooLarge } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("Paystack webhook called without PAYSTACK_SECRET_KEY configured");
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
  }
  if (requestBodyTooLarge(request, 256_000)) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

  if (!/^[a-f0-9]{128}$/i.test(signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as { event?: string; data?: PaystackTransactionData };
    if (event.event === "charge.success" && event.data?.reference) {
      // Do not rely on webhook payload fields alone. Confirm the transaction directly
      // with Paystack, then apply the idempotent order update.
      const verified = await verifyPaystackTransaction(event.data.reference);
      await markOrderPaidFromPaystack(verified);
    }
  } catch (error) {
    console.error("Paystack webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
