import { createAdminClient } from "@/lib/supabase/admin";
import ProductForm from "@/components/admin/ProductForm";
import type { Category } from "@/lib/types";

export default async function NewProductPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("categories").select("*").order("display_order");
  return <main className="admin-content"><div className="admin-page-heading"><div><span>Catalogue</span><h1>Add product</h1><p>Create a new product and upload its images or videos.</p></div></div><ProductForm categories={(data || []) as Category[]} /></main>;
}
