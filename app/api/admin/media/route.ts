import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { cloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const publicId = request.nextUrl.searchParams.get("public_id");
  const type = request.nextUrl.searchParams.get("type") === "video" ? "video" : "image";
  if (!publicId) return NextResponse.json({ error: "Missing public_id" }, { status: 400 });
  await cloudinary.uploader.destroy(publicId, { resource_type: type });
  return NextResponse.json({ ok: true });
}
