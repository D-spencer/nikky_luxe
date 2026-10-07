import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { clientIp, consumeRateLimit, safePublicError } from "@/lib/security";
import {
  normalizeSearchQuery,
  SEARCH_MAX_PAGE,
  SEARCH_PAGE_SIZE,
  SEARCH_SUGGESTION_LIMIT,
  validSearchQuery,
  type SearchProduct,
} from "@/lib/search";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = normalizeSearchQuery(request.nextUrl.searchParams.get("q") || "");
  const mode = request.nextUrl.searchParams.get("mode") === "results" ? "results" : "suggest";

  if (!validSearchQuery(query)) {
    return NextResponse.json(
      safePublicError("Enter between 2 and 80 characters to search."),
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rateLimit = await consumeRateLimit("public-search-ip", clientIp(request.headers), 60, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      safePublicError("Too many searches. Please wait a moment and try again."),
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const requestedPage = Number(request.nextUrl.searchParams.get("page") || "1");
  const page = mode === "results" && Number.isInteger(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), SEARCH_MAX_PAGE)
    : 1;
  const pageSize = mode === "results" ? SEARCH_PAGE_SIZE : SEARCH_SUGGESTION_LIMIT;
  const offset = mode === "results" ? (page - 1) * pageSize : 0;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("search_products", {
      p_query: query,
      p_limit: pageSize,
      p_offset: offset,
    });

    if (error) throw error;

    const rows = (data || []) as Array<Record<string, unknown>>;
    const results: SearchProduct[] = rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      description: row.description == null ? null : String(row.description),
      price: row.price == null ? null : Number(row.price),
      featured: Boolean(row.featured),
      categoryName: String(row.category_name || "Nikky Luxe"),
      imageUrl: row.image_url == null ? null : String(row.image_url),
    }));
    const total = rows.length ? Number(rows[0].total_count || 0) : 0;

    return NextResponse.json(
      { query, results, total, page, pageSize },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error("Public product search failed", error);
    return NextResponse.json(safePublicError("Search is temporarily unavailable. Please try again."), {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
