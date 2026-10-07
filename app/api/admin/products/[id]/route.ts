import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/admin-api";
import { parseProductInput } from "@/lib/admin-validation";
import { cloudinary } from "@/lib/cloudinary";
import { createAdminClient } from "@/lib/supabase/admin";
import { isJsonRequest, requestBodyTooLarge, validUuid } from "@/lib/security";

type StoredMedia = { public_id: string; media_type: string };
async function destroyMedia(items: StoredMedia[]) {
  for (const item of items) {
    if (!item.public_id?.startsWith("nikky-luxe/products/")) continue;
    try { await cloudinary.uploader.destroy(item.public_id, { resource_type: item.media_type === "video" ? "video" : "image" }); }
    catch (error) { console.error("Cloudinary product media cleanup failed", error); }
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(request, "product-write");
  if (blocked) return blocked;
  const { id } = await params;
  if (!validUuid(id) || !isJsonRequest(request) || requestBodyTooLarge(request, 256_000)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const parsed = parseProductInput(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const body = parsed.value;
    const supabase = createAdminClient();

    const [{ data: product }, { data: category }] = await Promise.all([
      supabase.from("products").select("id").eq("id", id).maybeSingle(),
      supabase.from("categories").select("id").eq("id", body.category_id).maybeSingle(),
    ]);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (!category) return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });

    const { error } = await supabase.from("products").update({
      name: body.name,
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
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) throw new Error(error.message);

    const { data: existingMedia } = await supabase.from("product_media").select("public_id,media_type").eq("product_id", id);
    const incomingProductIds = new Set(body.media.map((m) => m.public_id));
    const removedProduct = (existingMedia || []).filter((m) => !incomingProductIds.has(m.public_id));

    const { data: oldVariants } = await supabase.from("product_variants").select("id, product_variant_media(public_id,media_type)").eq("product_id", id);
    const oldVariantMedia = (oldVariants || []).flatMap((v) => v.product_variant_media || []);
    const incomingVariantIds = new Set(body.variants.flatMap((v) => v.media.map((m) => m.public_id)));
    const removedVariant = oldVariantMedia.filter((m) => !incomingVariantIds.has(m.public_id));

    const { error: deleteMediaError } = await supabase.from("product_media").delete().eq("product_id", id);
    if (deleteMediaError) throw new Error(deleteMediaError.message);
    if (body.media.length) {
      const rows = body.media.map((m, index) => ({ product_id: id, url: m.url, public_id: m.public_id, media_type: m.media_type, display_order: index }));
      const { error: mediaError } = await supabase.from("product_media").insert(rows);
      if (mediaError) throw new Error(mediaError.message);
    }

    const { error: deleteVariantsError } = await supabase.from("product_variants").delete().eq("product_id", id);
    if (deleteVariantsError) throw new Error(deleteVariantsError.message);
    for (let i = 0; i < body.variants.length; i++) {
      const variantInput = body.variants[i];
      const { data: variant, error: variantError } = await supabase.from("product_variants").insert({
        product_id: id,
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

    await destroyMedia([...removedProduct, ...removedVariant]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Product update failed", error);
    return NextResponse.json({ error: "Could not update the product. Please check the details and try again." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(request, "product-delete");
  if (blocked) return blocked;
  const { id } = await params;
  if (!validUuid(id)) return NextResponse.json({ error: "Invalid product." }, { status: 400 });

  const supabase = createAdminClient();
  const [{ data: media }, { data: variants }] = await Promise.all([
    supabase.from("product_media").select("public_id,media_type").eq("product_id", id),
    supabase.from("product_variants").select("product_variant_media(public_id,media_type)").eq("product_id", id),
  ]);
  const variantMedia = (variants || []).flatMap((v) => v.product_variant_media || []);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("Product delete failed", error.message);
    return NextResponse.json({ error: "Could not delete this product." }, { status: 400 });
  }
  await destroyMedia([...(media || []), ...variantMedia]);
  return NextResponse.json({ ok: true });
}
