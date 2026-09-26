import { createPublicClient } from "@/lib/supabase/public";
import type { Category, Product } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  return (data || []) as Category[];
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*), product_media(*)")
    .eq("available", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []) as Product[];
}

export async function getNewestProducts(limit = 8): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*), product_media(*)")
    .eq("available", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []) as Product[];
}

export async function getProductsByCategory(slug: string): Promise<{ category: Category | null; products: Product[] }> {
  const supabase = createPublicClient();
  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (!category) return { category: null, products: [] };

  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*), product_media(*)")
    .eq("category_id", category.id)
    .eq("available", true)
    .order("created_at", { ascending: false });

  return { category: category as Category, products: (data || []) as Product[] };
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*), product_media(*)")
    .eq("slug", slug)
    .eq("available", true)
    .maybeSingle();
  return (data as Product | null) || null;
}
