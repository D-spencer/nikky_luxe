import Link from "next/link";
import { LayoutDashboard, LogOut, Package, Shapes, ShoppingBag, Store, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "@/app/admin/actions";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  if (!user) redirect("/admin/login");

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand"><span>NL</span><div><strong>Nikky Luxe</strong><small>Admin</small></div></Link>
        <nav>
          <Link href="/admin"><LayoutDashboard size={18} /> Dashboard</Link>
          <Link href="/admin/products"><Package size={18} /> Products</Link>
          <Link href="/admin/categories"><Shapes size={18} /> Categories</Link>
          <Link href="/admin/orders"><ShoppingBag size={18} /> Orders</Link>
          <Link href="/admin/admins"><Users size={18} /> Manage admins</Link>
          <a href="/" target="_blank" rel="noreferrer"><Store size={18} /> View website</a>
        </nav>
        <form action={signOut}><button type="submit" className="admin-signout"><LogOut size={18} /> Sign out</button></form>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar"><span>Signed in as</span><strong>{user.email}</strong></div>
        {children}
      </div>
    </div>
  );
}
