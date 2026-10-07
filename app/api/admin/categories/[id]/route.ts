import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/admin-api";
import { parseCategoryInput } from "@/lib/admin-validation";
import { cloudinary } from "@/lib/cloudinary";
import { createAdminClient } from "@/lib/supabase/admin";
import { isJsonRequest, requestBodyTooLarge, validUuid } from "@/lib/security";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(request, "category-write");
  if (blocked) return blocked;
  const { id } = await params;
  if (!validUuid(id) || !isJsonRequest(request) || requestBodyTooLarge(request, 16_384)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const parsed = parseCategoryInput(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const supabase = createAdminClient();
    const { data: current, error: currentError } = await supabase.from("categories").select("image_public_id").eq("id", id).maybeSingle();
    if (currentError || !current) return NextResponse.json({ error: "Collection not found." }, { status: 404 });

    const { error } = await supabase.from("categories").update({ ...parsed.value, slug: slugify(parsed.value.name) }).eq("id", id);
    if (error) {
      console.error("Category update failed", error.message);
      return NextResponse.json({ error: "Could not update the category." }, { status: 400 });
    }

    if (current.image_public_id && current.image_public_id !== parsed.value.image_public_id && current.image_public_id.startsWith("nikky-luxe/categories/")) {
      try { await cloudinary.uploader.destroy(current.image_public_id, { resource_type: "image" }); }
      catch (error) { console.error("Old category image cleanup failed", error); }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Category update failed", error);
    return NextResponse.json({ error: "Could not update the category." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(request, "category-delete");
  if (blocked) return blocked;
  const { id } = await params;
  if (!validUuid(id)) return NextResponse.json({ error: "Invalid collection." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: current } = await supabase.from("categories").select("image_public_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    console.error("Category delete failed", error.message);
    return NextResponse.json({ error: "This category could not be deleted. It may still contain products." }, { status: 400 });
  }

  if (current?.image_public_id?.startsWith("nikky-luxe/categories/")) {
    try { await cloudinary.uploader.destroy(current.image_public_id, { resource_type: "image" }); }
    catch (error) { console.error("Deleted category image cleanup failed", error); }
  }
  return NextResponse.json({ ok: true });
}
