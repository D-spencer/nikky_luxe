import crypto, { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializePaystackTransaction } from "@/lib/paystack";
import {
  cleanOptionalText,
  cleanText,
  clientIp,
  consumeRateLimit,
  isJsonRequest,
  requestBodyTooLarge,
  sameOrigin,
  validUuid,
} from "@/lib/security";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+0-9()\-\s]{7,32}$/;

type IncomingItem = { productId?: string; variantId?: string | null; quantity?: number };
type IncomingCustomer = { name?: string; email?: string; phone?: string; address?: string; city?: string; state?: string; notes?: string };

function configuredSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  const url = new URL(raw);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("Production site URL must use HTTPS.");
  return url.origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  if (!isJsonRequest(request)) return NextResponse.json({ error: "Invalid request." }, { status: 415 });
  if (requestBodyTooLarge(request, 32_768)) return NextResponse.json({ error: "Checkout request is too large." }, { status: 413 });

  const ip = clientIp(request.headers);
  const ipLimit = await consumeRateLimit("checkout-ip", ip, 8, 600);
  if (!ipLimit.allowed) {
    return NextResponse.json({ error: "Too many checkout attempts. Please wait a few minutes and try again." }, {
      status: 429,
      headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
    });
  }

  try {
    const body = await request.json();
    const customer = (body?.customer || {}) as IncomingCustomer;
    const items = Array.isArray(body?.items) ? body.items as IncomingItem[] : [];

    const name = cleanText(customer.name, 100);
    const email = cleanText(customer.email, 254)?.toLowerCase() || null;
    const phone = cleanText(customer.phone, 32);
    const address = cleanText(customer.address, 300);
    const city = cleanText(customer.city, 100);
    const state = cleanText(customer.state, 100);
    const notes = cleanOptionalText(customer.notes, 500);

    if (!name || !email || !emailPattern.test(email) || !phone || !phonePattern.test(phone) || !address || !city || !state || notes === null) {
      return NextResponse.json({ error: "Please check your checkout details and keep each field within the allowed length." }, { status: 400 });
    }
    if (!items.length || items.length > 30) {
      return NextResponse.json({ error: "Your shopping bag is empty or too large." }, { status: 400 });
    }

    const emailLimit = await consumeRateLimit("checkout-email", email, 5, 600);
    if (!emailLimit.allowed) {
      return NextResponse.json({ error: "Too many checkout attempts. Please wait a few minutes and try again." }, {
        status: 429,
        headers: { "Retry-After": String(emailLimit.retryAfterSeconds) },
      });
    }

    const normalizedItems = items.map((incoming) => {
      const productId = String(incoming.productId || "");
      const variantId = incoming.variantId ? String(incoming.variantId) : null;
      const quantity = Number(incoming.quantity);
      if (!validUuid(productId) || (variantId && !validUuid(variantId)) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        throw new Error("INVALID_CART");
      }
      return { productId, variantId, quantity };
    });

    if (normalizedItems.reduce((sum, item) => sum + item.quantity, 0) > 100) {
      return NextResponse.json({ error: "The total quantity in your bag is too large." }, { status: 400 });
    }

    const fingerprintPayload = JSON.stringify({
      email,
      items: [...normalizedItems].sort((a, b) => `${a.productId}:${a.variantId || ""}`.localeCompare(`${b.productId}:${b.variantId || ""}`)),
    });
    const checkoutFingerprint = crypto.createHash("sha256").update(fingerprintPayload).digest("hex");

    const supabase = createAdminClient();

    // Opportunistic cleanup keeps abandoned payment attempts from accumulating as active orders.
    const staleBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { error: cleanupError } = await supabase
      .from("orders")
      .update({ payment_status: "failed", order_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("payment_status", "pending")
      .eq("order_status", "pending_payment")
      .lt("created_at", staleBefore);
    if (cleanupError) console.error("Pending order cleanup failed", cleanupError.message);

    const duplicateSince = new Date(Date.now() - 90 * 1000).toISOString();
    const { data: recentDuplicate } = await supabase
      .from("orders")
      .select("id")
      .eq("checkout_fingerprint", checkoutFingerprint)
      .eq("payment_status", "pending")
      .gte("created_at", duplicateSince)
      .limit(1)
      .maybeSingle();
    if (recentDuplicate) {
      return NextResponse.json({ error: "A payment attempt for this order was just started. Please wait a moment before trying again." }, { status: 429 });
    }

    const preparedItems: Array<{
      product_id: string;
      variant_id: string | null;
      product_name: string;
      variant_type: string | null;
      variant_name: string | null;
      product_image_url: string | null;
      quantity: number;
      unit_price: number;
      line_total: number;
    }> = [];

    for (const incoming of normalizedItems) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id,name,slug,price,offer_price,on_offer,offer_starts_at,offer_ends_at,available,variant_type,product_media(url,media_type,display_order)")
        .eq("id", incoming.productId)
        .maybeSingle();

      if (productError || !product || !product.available) {
        return NextResponse.json({ error: "One of the selected products is no longer available." }, { status: 400 });
      }

      const now = Date.now();
      const offerActive = Boolean(product.on_offer && product.offer_price != null && (!product.offer_starts_at || new Date(product.offer_starts_at).getTime() <= now) && (!product.offer_ends_at || new Date(product.offer_ends_at).getTime() >= now));
      let unitPrice = offerActive ? Number(product.offer_price) : (product.price == null ? null : Number(product.price));
      let variantName: string | null = null;
      let imageUrl = [...(product.product_media || [])]
        .sort((a, b) => a.display_order - b.display_order)
        .find((media) => media.media_type === "image")?.url || null;

      if (incoming.variantId) {
        const { data: variant, error: variantError } = await supabase
          .from("product_variants")
          .select("id,product_id,name,price,available,product_variant_media(url,media_type,display_order)")
          .eq("id", incoming.variantId)
          .eq("product_id", product.id)
          .maybeSingle();

        if (variantError || !variant || !variant.available) {
          return NextResponse.json({ error: `The selected option for ${product.name} is no longer available.` }, { status: 400 });
        }

        variantName = variant.name;
        if (variant.price != null) unitPrice = Number(variant.price);
        imageUrl = [...(variant.product_variant_media || [])]
          .sort((a, b) => a.display_order - b.display_order)
          .find((media) => media.media_type === "image")?.url || imageUrl;
      } else {
        const { count } = await supabase
          .from("product_variants")
          .select("id", { count: "exact", head: true })
          .eq("product_id", product.id)
          .eq("available", true);
        if ((count || 0) > 0) {
          return NextResponse.json({ error: `Please choose an option for ${product.name}.` }, { status: 400 });
        }
      }

      if (unitPrice == null || !Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > 100_000_000) {
        return NextResponse.json({ error: `${product.name} is not available for direct online payment yet.` }, { status: 400 });
      }

      preparedItems.push({
        product_id: product.id,
        variant_id: incoming.variantId,
        product_name: product.name,
        variant_type: incoming.variantId ? product.variant_type : null,
        variant_name: variantName,
        product_image_url: imageUrl,
        quantity: incoming.quantity,
        unit_price: unitPrice,
        line_total: unitPrice * incoming.quantity,
      });
    }

    const subtotal = preparedItems.reduce((sum, item) => sum + item.line_total, 0);
    const total = subtotal;
    if (!Number.isFinite(total) || total <= 0 || total > 100_000_000) {
      return NextResponse.json({ error: "This order cannot be paid online." }, { status: 400 });
    }

    const paymentReference = `NL-${randomUUID().replace(/-/g, "")}`;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        delivery_address: address,
        delivery_city: city,
        delivery_state: state,
        customer_notes: notes || null,
        subtotal,
        total,
        currency: "NGN",
        payment_status: "pending",
        order_status: "pending_payment",
        payment_reference: paymentReference,
        checkout_fingerprint: checkoutFingerprint,
      })
      .select("id,order_number")
      .single();

    if (orderError || !order) throw new Error("ORDER_CREATE_FAILED");

    const { error: itemError } = await supabase.from("order_items").insert(
      preparedItems.map((item) => ({ ...item, order_id: order.id }))
    );
    if (itemError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error("ORDER_ITEMS_FAILED");
    }

    try {
      const transaction = await initializePaystackTransaction({
        email,
        amountKobo: Math.round(total * 100),
        reference: paymentReference,
        callbackUrl: `${configuredSiteUrl()}/checkout/verify`,
        metadata: { order_id: order.id, order_number: order.order_number },
      });

      return NextResponse.json({
        authorizationUrl: transaction.authorization_url,
        reference: transaction.reference,
        orderNumber: order.order_number,
      });
    } catch (error) {
      console.error("Paystack initialization failed", error);
      await supabase.from("orders").update({ payment_status: "failed", order_status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id);
      return NextResponse.json({ error: "We could not start the secure payment. Please try again." }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CART") {
      return NextResponse.json({ error: "Your shopping bag contains invalid items." }, { status: 400 });
    }
    console.error("Checkout initialization failed", error);
    return NextResponse.json({ error: "Unable to start payment right now. Please try again." }, { status: 500 });
  }
}
