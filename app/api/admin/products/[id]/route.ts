import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { cloudinary } from "@/lib/cloudinary";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").update({ name: body.name, description: body.description || null, price: body.price, category_id: body.category_id, featured: !!body.featured, available: !!body.available, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: existingMedia } = await supabase.from("product_media").select("public_id,media_type").eq("product_id", id);
  const incomingIds = new Set((Array.isArray(body.media) ? body.media : []).map((m: any) => m.public_id));
  const removedMedia = (existingMedia || []).filter((m) => !incomingIds.has(m.public_id));

  await supabase.from("product_media").delete().eq("product_id", id);
  if (Array.isArray(body.media) && body.media.length) {
    const rows = body.media.map((m: any, index: number) => ({ product_id: id, url: m.url, public_id: m.public_id, media_type: m.media_type, display_order: index }));
    const { error: mediaError } = await supabase.from("product_media").insert(rows);
    if (mediaError) return NextResponse.json({ error: mediaError.message }, { status: 400 });
  }
  for (const item of removedMedia) {
    try { await cloudinary.uploader.destroy(item.public_id, { resource_type: item.media_type === "video" ? "video" : "image" }); } catch {}
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: media } = await supabase.from("product_media").select("public_id,media_type").eq("product_id", id);
  for (const item of media || []) {
    try { await cloudinary.uploader.destroy(item.public_id, { resource_type: item.media_type === "video" ? "video" : "image" }); } catch {}
  }
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
