import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/admin-api";
import { parseProductInput } from "@/lib/admin-validation";
import { cloudinary } from "@/lib/cloudinary";
import { createAdminClient } from "@/lib/supabase/admin";
import { isJsonRequest, requestBodyTooLarge } from "@/lib/security";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

type Media = { public_id: string; media_type: "image" | "video" };
async function cleanupSubmittedMedia(items: Media[]) {
  for (const item of items) {
    if (!item.public_id.startsWith("nikky-luxe/products/")) continue;
    try { await cloudinary.uploader.destroy(item.public_id, { resource_type: item.media_type }); }
    catch (error) { console.error("Product create media cleanup failed", error); }
  }
}

export async function POST(request: NextRequest) {
  const blocked = await protectAdminMutation(request, "product-write");
  if (blocked) return blocked;
  if (!isJsonRequest(request) || requestBodyTooLarge(request, 256_000)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  let submittedMedia: Media[] = [];
  let createdProductId: string | null = null;
  try {
    const parsed = parseProductInput(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const body = parsed.value;
    submittedMedia = [
      ...body.media.map((m) => ({ public_id: m.public_id, media_type: m.media_type })),
      ...body.variants.flatMap((v) => v.media.map((m) => ({ public_id: m.public_id, media_type: m.media_type }))),
    ];

    const supabase = createAdminClient();
    const { data: category } = await supabase.from("categories").select("id").eq("id", body.category_id).maybeSingle();
    if (!category) return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });

    const slug = `${slugify(body.name)}-${Date.now().toString().slice(-6)}`;
    const { data: product, error } = await supabase.from("products").insert({
      name: body.name,
      slug,
      description: body.description,
      price: body.price,
      offer_price: body.offer_price,
      on_offer: body.on_offer,
      offer_starts_at: body.offer_starts_at,
      offer_ends_at: body.offer_ends_at,
      category_id: body.category_id,
      featured: body.featured,
      available: body.available,
      variant_type: body.variant_type,
    }).select().single();
    if (error || !product) throw new Error(error?.message || "Product insert failed");
    createdProductId = product.id;

    if (body.media.length) {
      const rows = body.media.map((m, index) => ({ product_id: product.id, url: m.url, public_id: m.public_id, media_type: m.media_type, display_order: index }));
      const { error: mediaError } = await supabase.from("product_media").insert(rows);
      if (mediaError) throw new Error(mediaError.message);
    }

    for (let i = 0; i < body.variants.length; i++) {
      const variantInput = body.variants[i];
      const { data: variant, error: variantError } = await supabase.from("product_variants").insert({
        product_id: product.id,
        name: variantInput.name,
        price: variantInput.price,
        available: variantInput.available,
        display_order: i,
      }).select().single();
      if (variantError || !variant) throw new Error(variantError?.message || "Variant insert failed");
      if (variantInput.media.length) {
        const rows = variantInput.media.map((m, index) => ({ variant_id: variant.id, url: m.url, public_id: m.public_id, media_type: m.media_type, display_order: index }));
        const { error: variantMediaError } = await supabase.from("product_variant_media").insert(rows);
        if (variantMediaError) throw new Error(variantMediaError.message);
      }
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product create failed", error);
    const supabase = createAdminClient();
    if (createdProductId) await supabase.from("products").delete().eq("id", createdProductId);
    await cleanupSubmittedMedia(submittedMedia);
    return NextResponse.json({ error: "Could not create the product. Please check the details and try again." }, { status: 400 });
  }
}
