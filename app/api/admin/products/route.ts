import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.name || !body.category_id) return NextResponse.json({ error: "Name and category are required." }, { status: 400 });
  const supabase = createAdminClient();
  const base = slugify(body.name);
  const slug = `${base}-${Date.now().toString().slice(-6)}`;
  const { data: product, error } = await supabase.from("products").insert({ name: body.name, slug, description: body.description || null, price: body.price, category_id: body.category_id, featured: !!body.featured, available: !!body.available }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (Array.isArray(body.media) && body.media.length) {
    const rows = body.media.map((m: any, index: number) => ({ product_id: product.id, url: m.url, public_id: m.public_id, media_type: m.media_type, display_order: index }));
    const { error: mediaError } = await supabase.from("product_media").insert(rows);
    if (mediaError) return NextResponse.json({ error: mediaError.message }, { status: 400 });
  }
  return NextResponse.json(product, { status: 201 });
}
