import Link from "next/link";
import { ArrowRight, PackageCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNaira } from "@/lib/currency";

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const orders = data || [];

  return (
    <main className="admin-content">
      <div className="admin-page-heading"><div><span>Sales</span><h1>Orders</h1><p>Review paid orders, customer details and fulfilment status.</p></div></div>
      <div className="admin-table-card">
        {orders.length === 0 ? <div className="admin-empty"><PackageCheck size={28} /><h3>No orders yet</h3><p>New website orders will appear here.</p></div> : (
          <div className="admin-order-list">
            <div className="admin-order-header"><span>Order</span><span>Customer</span><span>Total</span><span>Payment</span><span>Status</span><span></span></div>
            {orders.map((order) => (
              <Link href={`/admin/orders/${order.id}`} className="admin-order-row" key={order.id}>
                <div><strong>{order.order_number}</strong><span>{new Date(order.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span></div>
                <div><strong>{order.customer_name}</strong><span>{order.customer_phone}</span></div>
                <strong>{formatNaira(Number(order.total))}</strong>
                <span className={`status-pill ${order.payment_status === "paid" ? "live" : order.payment_status === "failed" ? "off" : ""}`}>{order.payment_status}</span>
                <span className={`status-pill order-${order.order_status}`}>{order.order_status.replaceAll("_", " ")}</span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
