import crypto from "crypto";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

function rateLimitSalt() {
  const salt = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!salt) throw new Error("Rate-limit hashing is not configured.");
  return salt;
}

export function clientIp(headers: Pick<Headers, "get">) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

export function hashIdentifier(value: string) {
  return crypto.createHmac("sha256", rateLimitSalt()).update(value).digest("hex");
}

export async function consumeRateLimit(bucket: string, identifier: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_bucket: bucket,
    p_identifier_hash: hashIdentifier(identifier),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Rate limit check failed", { bucket, error: error.message });
    // Fail closed: if the persistent limiter is unavailable, abuse-sensitive actions stop
    // rather than silently losing their protection.
    return { allowed: false, remaining: 0, retryAfterSeconds: 60 };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    remaining: Number(row?.remaining ?? 0),
    retryAfterSeconds: Math.max(1, Number(row?.retry_after_seconds ?? windowSeconds)),
  };
}

export function sameOrigin(request: Request | NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function isJsonRequest(request: Request | NextRequest) {
  return (request.headers.get("content-type") || "").toLowerCase().startsWith("application/json");
}

export function requestBodyTooLarge(request: Request | NextRequest, maxBytes: number) {
  const length = Number(request.headers.get("content-length") || "0");
  return Number.isFinite(length) && length > maxBytes;
}

export function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function cleanText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  return text.length <= maxLength ? text : null;
}

export function cleanOptionalText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length <= maxLength ? text : null;
}

export function safeNumber(value: unknown, min: number, max: number, allowNull = false): number | null | undefined {
  if ((value === null || value === "" || value === undefined) && allowNull) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return undefined;
  return number;
}

export function isNikkyCloudinaryMedia(url: unknown, publicId: unknown, allowedFolders: string[]) {
  if (typeof url !== "string" || typeof publicId !== "string") return false;
  if (!allowedFolders.some((folder) => publicId.startsWith(`${folder}/`))) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") return false;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (cloudName && parsed.pathname.split("/")[1] !== cloudName) return false;
    return true;
  } catch {
    return false;
  }
}

export function safePublicError(message = "Something went wrong. Please try again.") {
  return { error: message };
}
