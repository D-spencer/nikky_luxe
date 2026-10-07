import Link from "next/link";
import { ArrowRight, Package, Shapes, ShoppingBag, Star, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNaira } from "@/lib/currency";

export default async function AdminDashboard() {
  const supabase = createAdminClient();
  const [{ count: products }, { count: categories }, { count: featured }, ordersResult, paidOrdersResult] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("featured", true),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total", { count: "exact" }).eq("payment_status", "paid"),
  ]);

  const paidRevenue = (paidOrdersResult.data || []).reduce((sum, order) => sum + Number(order.total || 0), 0);
  const cards = [
    ["Products", products || 0, Package],
    ["Categories", categories || 0, Shapes],
    ["Featured", featured || 0, Star],
    ["Orders", ordersResult.count || 0, ShoppingBag],
  ] as const;

  return (
    <main className="admin-content">
      <div className="admin-page-heading"><div><span>Overview</span><h1>Dashboard</h1></div><Link href="/admin/products/new" className="button button-dark">+ Add Product</Link></div>
      <div className="admin-stat-grid">
        {cards.map(([label, value, Icon]) => <div className="admin-stat" key={label}><Icon size={20} /><strong>{value}</strong><span>{label}</span></div>)}
      </div>
      <div className="admin-revenue-card"><span>Confirmed online sales</span><strong>{formatNaira(paidRevenue)}</strong><small>{paidOrdersResult.count || 0} paid order{paidOrdersResult.count === 1 ? "" : "s"}</small></div>
      <div className="admin-action-grid">
        <Link href="/admin/orders" className="admin-action-card"><div><ShoppingBag /><h2>Manage orders</h2><p>View customers, payment status, purchased items and fulfilment progress.</p></div><ArrowRight /></Link>
        <Link href="/admin/products" className="admin-action-card"><div><Package /><h2>Manage products</h2><p>Add, edit, feature or remove items and their media.</p></div><ArrowRight /></Link>
        <Link href="/admin/categories" className="admin-action-card"><div><Shapes /><h2>Manage categories</h2><p>Keep collections organised so the website stays easy to browse.</p></div><ArrowRight /></Link>
        <Link href="/admin/admins" className="admin-action-card"><div><Users /><h2>Manage admins</h2><p>See the accounts that currently have access to the Nikky Luxe admin area.</p></div><ArrowRight /></Link>
      </div>
    </main>
  );
}
