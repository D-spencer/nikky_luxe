import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/admin-api";
import { parseCategoryInput } from "@/lib/admin-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isJsonRequest, requestBodyTooLarge } from "@/lib/security";
import { slugify } from "@/lib/slug";

export async function POST(request: NextRequest) {
  const blocked = await protectAdminMutation(request, "category-write");
  if (blocked) return blocked;
  if (!isJsonRequest(request) || requestBodyTooLarge(request, 16_384)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const parsed = parseCategoryInput(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("categories").insert({ ...parsed.value, slug: slugify(parsed.value.name) }).select().single();
    if (error) {
      console.error("Category create failed", error.message);
      return NextResponse.json({ error: "Could not create the category. Check that the name is unique." }, { status: 400 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Category create failed", error);
    return NextResponse.json({ error: "Could not create the category." }, { status: 500 });
  }
}
