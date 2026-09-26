import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { cloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "nikky-luxe/products";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  );
  return NextResponse.json({
    timestamp,
    folder,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
