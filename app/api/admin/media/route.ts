import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/admin-api";
import { cloudinary } from "@/lib/cloudinary";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  const blocked = await protectAdminMutation(request, "media-delete");
  if (blocked) return blocked;

  const publicId = request.nextUrl.searchParams.get("public_id") || "";
  const type = request.nextUrl.searchParams.get("type") === "video" ? "video" : "image";
  const allowedPrefix = publicId.startsWith("nikky-luxe/products/") || publicId.startsWith("nikky-luxe/categories/");
  if (!publicId || publicId.length > 300 || !allowedPrefix) {
    return NextResponse.json({ error: "Invalid media resource." }, { status: 400 });
  }

  // This generic endpoint is only for cleaning up a freshly uploaded, unsaved file.
  // Persisted media must be removed through its product/category endpoint, which derives
  // the Cloudinary public_id from the database rather than trusting a client-supplied ID.
  const supabase = createAdminClient();
  const [productMedia, variantMedia, categoryMedia] = await Promise.all([
    supabase.from("product_media").select("id", { count: "exact", head: true }).eq("public_id", publicId),
    supabase.from("product_variant_media").select("id", { count: "exact", head: true }).eq("public_id", publicId),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("image_public_id", publicId),
  ]);
  if ((productMedia.count || 0) + (variantMedia.count || 0) + (categoryMedia.count || 0) > 0) {
    return NextResponse.json({ error: "Saved media must be removed from its product or collection." }, { status: 409 });
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: type });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Cloudinary cleanup failed", error);
    return NextResponse.json({ error: "Could not remove media." }, { status: 502 });
  }
}
