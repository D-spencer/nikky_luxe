import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import ProductForm from "@/components/admin/ProductForm";
import type { Category, Product } from "@/lib/types";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, category:categories(*), product_media(*), product_variants(*, product_variant_media(*))").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("display_order"),
  ]);
  if (!product) notFound();
  return <main className="admin-content"><div className="admin-page-heading"><div><span>Catalogue</span><h1>Edit product</h1><p>Update product information, visibility and media.</p></div></div><ProductForm categories={(categories || []) as Category[]} product={product as Product} /></main>;
}
