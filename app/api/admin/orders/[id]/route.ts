import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/admin-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { isJsonRequest, requestBodyTooLarge, validUuid } from "@/lib/security";

const allowedStatuses = new Set(["paid", "processing", "shipped", "delivered", "cancelled"]);

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(request, "order-write");
  if (blocked) return blocked;
  const { id } = await params;
  if (!validUuid(id) || !isJsonRequest(request) || requestBodyTooLarge(request, 4_096)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const body = await request.json();
    const status = String(body?.order_status || "");
    if (!allowedStatuses.has(status)) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });

    const supabase = createAdminClient();
    const { data: order } = await supabase.from("orders").select("payment_status").eq("id", id).maybeSingle();
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.payment_status !== "paid" && status !== "cancelled") {
      return NextResponse.json({ error: "Unpaid orders cannot be moved into fulfilment." }, { status: 400 });
    }

    const { error } = await supabase.from("orders").update({ order_status: status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Order status update failed", error);
    return NextResponse.json({ error: "Could not update the order status." }, { status: 500 });
  }
}
