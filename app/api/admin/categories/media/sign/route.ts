import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/admin-api";
import { cloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

const IMAGE_FORMATS = "jpg,jpeg,png,webp";

export async function POST(request: NextRequest) {
  const blocked = await protectAdminMutation(request, "category-media-sign");
  if (blocked) return blocked;
  if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.error("Cloudinary category signing requested with incomplete configuration");
    return NextResponse.json({ error: "Media service unavailable." }, { status: 503 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "nikky-luxe/categories";
  const allowedFormats = IMAGE_FORMATS;
  const signedParams = { timestamp, folder, allowed_formats: allowedFormats };
  const signature = cloudinary.utils.api_sign_request(signedParams, process.env.CLOUDINARY_API_SECRET);

  return NextResponse.json({
    timestamp,
    folder,
    allowedFormats,
    resourceType: "image",
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
