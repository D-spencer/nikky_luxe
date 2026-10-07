import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNaira } from "@/lib/currency";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import { cloudinaryImageUrl } from "@/lib/cloudinary-delivery";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();
  const items = [...(order.order_items || [])].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <main className="admin-content">
      <Link href="/admin/orders" className="back-link"><ArrowLeft size={15} /> Back to orders</Link>
      <div className="admin-page-heading order-detail-heading"><div><span>Order</span><h1>{order.order_number}</h1><p>{new Date(order.created_at).toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" })}</p></div><OrderStatusSelect id={order.id} value={order.order_status} paymentStatus={order.payment_status} /></div>

      <div className="order-admin-grid">
        <section className="order-admin-card">
          <h2>Customer</h2>
          <div className="order-detail-line"><UserRound size={17} /><div><span>Name</span><strong>{order.customer_name}</strong></div></div>
          <div className="order-detail-line"><Phone size={17} /><div><span>Phone</span><strong>{order.customer_phone}</strong></div></div>
          <div className="order-detail-line"><Mail size={17} /><div><span>Email</span><strong>{order.customer_email}</strong></div></div>
        </section>

        <section className="order-admin-card">
          <h2>Delivery</h2>
          <div className="order-detail-line"><MapPin size={17} /><div><span>Address</span><strong>{order.delivery_address}</strong><p>{order.delivery_city}, {order.delivery_state}</p></div></div>
          {order.customer_notes && <div className="order-note"><span>Customer note</span><p>{order.customer_notes}</p></div>}
          <div className="order-note"><span>Delivery fee</span><p>Not charged online — customer pays the delivery fee separately when the order is delivered.</p></div>
        </section>
      </div>

      <section className="order-admin-card order-items-card">
        <h2>Items</h2>
        <div className="admin-order-items">
          {items.map((item) => (
            <div className="admin-order-item" key={item.id}>
              <div className="admin-order-item-image">{item.product_image_url ? <Image src={cloudinaryImageUrl(item.product_image_url, 160)} alt="" fill sizes="64px" unoptimized /> : <span>NL</span>}</div>
              <div><strong>{item.product_name}</strong>{item.variant_name && <span>{item.variant_type || "Option"}: {item.variant_name}</span>}<span>Qty: {item.quantity} × {formatNaira(Number(item.unit_price))}</span></div>
              <strong>{formatNaira(Number(item.line_total))}</strong>
            </div>
          ))}
        </div>
        <div className="admin-order-totals"><div><span>Subtotal</span><strong>{formatNaira(Number(order.subtotal))}</strong></div><div><span>Delivery</span><strong>Paid on delivery</strong></div><div className="total"><span>Total paid</span><strong>{formatNaira(Number(order.total))}</strong></div></div>
      </section>

      <section className="order-admin-card payment-admin-card">
        <h2><CreditCard size={18} /> Payment</h2>
        <div className="payment-admin-grid">
          <div><span>Payment status</span><strong className={order.payment_status === "paid" ? "paid-text" : ""}>{order.payment_status.toUpperCase()}</strong></div>
          <div><span>Paystack reference</span><strong>{order.payment_reference || "—"}</strong></div>
          <div><span>Paystack transaction ID</span><strong>{order.paystack_transaction_id || "—"}</strong></div>
          <div><span>Paid at</span><strong>{order.paid_at ? new Date(order.paid_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "Not paid yet"}</strong></div>
        </div>
      </section>
    </main>
  );
}
