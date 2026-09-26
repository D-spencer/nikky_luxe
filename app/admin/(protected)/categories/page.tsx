import { createAdminClient } from "@/lib/supabase/admin";
import CategoryManager from "@/components/admin/CategoryManager";
import type { Category } from "@/lib/types";

export default async function CategoriesPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("categories").select("*").order("display_order").order("name");
  return <main className="admin-content"><div className="admin-page-heading"><div><span>Organisation</span><h1>Categories</h1><p>Add or rename collections shown on the public website.</p></div></div><CategoryManager categories={(data || []) as Category[]} /></main>;
}
