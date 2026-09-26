import Link from "next/link";
import { ArrowRight, ImageIcon, Package, Shapes, Star } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboard() {
  const supabase = createAdminClient();
  const [{ count: products }, { count: categories }, { count: featured }, { count: media }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("featured", true),
    supabase.from("product_media").select("*", { count: "exact", head: true }),
  ]);

  const cards = [
    ["Products", products || 0, Package],
    ["Categories", categories || 0, Shapes],
    ["Featured", featured || 0, Star],
    ["Media files", media || 0, ImageIcon],
  ] as const;

  return (
    <main className="admin-content">
      <div className="admin-page-heading"><div><span>Overview</span><h1>Dashboard</h1><p>Everything the owner needs to manage Nikky Luxe.</p></div><Link href="/admin/products/new" className="button button-dark">+ Add Product</Link></div>
      <div className="admin-stat-grid">
        {cards.map(([label, value, Icon]) => <div className="admin-stat" key={label}><Icon size={20} /><strong>{value}</strong><span>{label}</span></div>)}
      </div>
      <div className="admin-action-grid">
        <Link href="/admin/products" className="admin-action-card"><div><Package /><h2>Manage products</h2><p>Add, edit, feature or remove items and their media.</p></div><ArrowRight /></Link>
        <Link href="/admin/categories" className="admin-action-card"><div><Shapes /><h2>Manage categories</h2><p>Keep collections organised so the website stays easy to browse.</p></div><ArrowRight /></Link>
      </div>
    </main>
  );
}
