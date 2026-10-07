import type { MetadataRoute } from "next";
import { getCategories, getNewestProducts } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [categories, products] = await Promise.all([getCategories().catch(() => []), getNewestProducts(1000).catch(() => [])]);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/collections`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/offers`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at ? new Date(p.updated_at) : undefined, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
