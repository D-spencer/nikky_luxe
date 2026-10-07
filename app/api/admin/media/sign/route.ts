import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/admin-api";
import { cloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

const IMAGE_FORMATS = "jpg,jpeg,png,webp";
const VIDEO_FORMATS = "mp4,mov,webm";

type ResourceType = "image" | "video";

export async function POST(request: NextRequest) {
  const blocked = await protectAdminMutation(request, "media-sign");
  if (blocked) return blocked;
  if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.error("Cloudinary signing requested with incomplete configuration");
    return NextResponse.json({ error: "Media service unavailable." }, { status: 503 });
  }

  let resourceType: ResourceType;
  try {
    const body = await request.json() as { resourceType?: unknown };
    if (body.resourceType !== "image" && body.resourceType !== "video") {
      return NextResponse.json({ error: "Unsupported media type." }, { status: 400 });
    }
    resourceType = body.resourceType;
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "nikky-luxe/products";
  const allowedFormats = resourceType === "image" ? IMAGE_FORMATS : VIDEO_FORMATS;
  const signedParams = { timestamp, folder, allowed_formats: allowedFormats };
  const signature = cloudinary.utils.api_sign_request(signedParams, process.env.CLOUDINARY_API_SECRET);

  return NextResponse.json({
    timestamp,
    folder,
    allowedFormats,
    resourceType,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
