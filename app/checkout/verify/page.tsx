import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { CheckCircle2, CircleAlert, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClearCartOnSuccess from "@/components/ClearCartOnSuccess";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { markOrderPaidFromPaystack } from "@/lib/orders";
import { whatsappLink } from "@/lib/brand";
import { clientIp, consumeRateLimit } from "@/lib/security";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false, follow: false } };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  const query = await searchParams;
  const reference = query.reference || query.trxref || "";
  let order: Record<string, unknown> | null = null;
  let error = "";

  const requestHeaders = await headers();
  const verificationLimit = await consumeRateLimit("payment-verify-ip", clientIp(requestHeaders), 20, 600);
  const validReference = reference.length <= 100 && /^[A-Za-z0-9.=_-]+$/.test(reference);

  if (!verificationLimit.allowed) {
    error = "Too many verification attempts. Please wait a few minutes and try again.";
  } else if (!reference || !validReference) {
    error = "The payment reference is missing or invalid.";
  } else {
    try {
      const transaction = await verifyPaystackTransaction(reference);
      order = await markOrderPaidFromPaystack(transaction);
    } catch (err) {
      console.error("Payment verification page failed", err);
      error = "We could not confirm this payment yet.";
    }
  }

  const orderNumber = order?.order_number ? String(order.order_number) : "";

  return (
    <>
      <Header />
      <main className="subpage-main"><section className="section"><div className="container">
        {order ? (
          <div className="payment-result success">
            <ClearCartOnSuccess />
            <CheckCircle2 size={48} />
            <span className="eyebrow-text">Payment confirmed</span>
            <h1>Thank you for shopping with Nikky Luxe.</h1>
            <p>Your order has been received and your payment was verified successfully.</p>
            <p className="delivery-fee-note">Delivery is not included in the product payment. The delivery fee is paid separately when your order is delivered.</p>
            <div className="order-confirmation-number"><span>Order number</span><strong>{orderNumber}</strong></div>
            <div className="payment-result-actions">
              <Link href="/collections" className="button button-dark">Continue shopping</Link>
              <a href={whatsappLink(`Hello Nikky Luxe, I just placed order ${orderNumber}.`)} target="_blank" rel="noreferrer" className="button button-soft"><MessageCircle size={17} /> Contact on WhatsApp</a>
            </div>
          </div>
        ) : (
          <div className="payment-result failed">
            <CircleAlert size={48} />
            <span className="eyebrow-text">Payment not confirmed</span>
            <h1>We could not verify the payment.</h1>
            <p>{error}</p>
            <p>If money was deducted, do not pay again immediately. Contact Nikky Luxe with your payment reference so the transaction can be checked.</p>
            <div className="order-confirmation-number"><span>Reference</span><strong>{reference || "Unavailable"}</strong></div>
            <div className="payment-result-actions"><Link href="/cart" className="button button-dark">Return to bag</Link><a href={whatsappLink(reference ? `Hello Nikky Luxe, I need help checking payment reference ${reference}.` : "Hello Nikky Luxe, I need help with a website payment.")} target="_blank" rel="noreferrer" className="button button-soft"><MessageCircle size={17} /> Get help</a></div>
          </div>
        )}
      </div></section></main>
      <Footer />
    </>
  );
}
