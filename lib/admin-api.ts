import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { clientIp, consumeRateLimit, sameOrigin } from "@/lib/security";

export async function protectAdminMutation(request: NextRequest, action = "mutation") {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  }

  const user = await requireAdmin();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ipLimit = await consumeRateLimit(`admin-${action}-ip`, clientIp(request.headers), 90, 60);
  if (!ipLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, {
      status: 429,
      headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
    });
  }

  return null;
}
