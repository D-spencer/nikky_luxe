"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, CreditCard, Loader2, LockKeyhole } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { formatNaira } from "@/lib/currency";
import { cloudinaryImageUrl } from "@/lib/cloudinary-delivery";

export default function CheckoutForm() {
  const { items, subtotal, ready } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!items.length || submitting) return;

    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: String(form.get("name") || ""),
            email: String(form.get("email") || ""),
            phone: String(form.get("phone") || ""),
            address: String(form.get("address") || ""),
            city: String(form.get("city") || ""),
            state: String(form.get("state") || ""),
            notes: String(form.get("notes") || ""),
          },
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.authorizationUrl) {
        throw new Error(result.error || "Unable to start payment.");
      }

      window.location.href = result.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment.");
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <div className="checkout-loading"><Loader2 className="spin" size={24} /> Loading your bag…</div>;
  }

  if (!items.length) {
    return (
      <div className="cart-empty checkout-empty">
        <div className="empty-monogram">NL</div>
        <h1>Your bag is empty.</h1>
        <p>Add a piece before continuing to checkout.</p>
        <Link href="/collections" className="button button-dark">Browse collections</Link>
      </div>
    );
  }

  return (
    <div className="checkout-grid">
      <form className="checkout-form" onSubmit={submit}>
        <Link href="/cart" className="back-link"><ArrowLeft size={15} /> Back to bag</Link>
        <span className="eyebrow-text">Secure checkout</span>
        <h1>Complete your order</h1>
        <p className="checkout-intro">Enter your contact and delivery details. Your product payment is completed online; the delivery fee is paid separately when your order is delivered.</p>

        <section className="checkout-section">
          <div className="checkout-section-heading"><span>1</span><div><h2>Contact information</h2><p>We use these details to identify and confirm your order.</p></div></div>
          <div className="checkout-fields two-col">
            <label>Full name<input name="name" required maxLength={100} autoComplete="name" placeholder="Jane Doe" /></label>
            <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="jane@email.com" /></label>
          </div>
          <label>Phone number<input name="phone" type="tel" required maxLength={32} autoComplete="tel" placeholder="080…" /></label>
        </section>

        <section className="checkout-section">
          <div className="checkout-section-heading"><span>2</span><div><h2>Delivery information</h2><p>This tells Nikky Luxe where the order will be delivered.</p></div></div>
          <label>Delivery address<textarea name="address" required maxLength={300} rows={3} autoComplete="street-address" placeholder="House number, street and area" /></label>
          <div className="checkout-fields two-col">
            <label>City / Area<input name="city" required maxLength={100} autoComplete="address-level2" placeholder="Ikeja" /></label>
            <label>State<input name="state" required maxLength={100} autoComplete="address-level1" placeholder="Lagos" /></label>
          </div>
          <label>Order note <small>Optional</small><textarea name="notes" maxLength={500} rows={2} placeholder="Any useful note for Nikky Luxe" /></label>
        </section>

        {error && <div className="checkout-error">{error}</div>}

        <button type="submit" className="button button-dark checkout-pay" disabled={submitting}>
          {submitting ? <><Loader2 className="spin" size={18} /> Connecting to Paystack…</> : <><CreditCard size={18} /> Pay {formatNaira(subtotal)}</>}
        </button>
        <div className="secure-payment-note"><LockKeyhole size={15} /> Payment is completed securely on Paystack. Nikky Luxe does not receive or store your card details.</div>
      </form>

      <aside className="checkout-summary">
        <h2>Order summary</h2>
        <div className="checkout-items">
          {items.map((item) => (
            <div className="checkout-item" key={item.key}>
              <div className="checkout-item-image">
                {item.imageUrl ? <Image src={cloudinaryImageUrl(item.imageUrl, 160)} alt="" fill sizes="72px" unoptimized /> : <span>NL</span>}
                <b>{item.quantity}</b>
              </div>
              <div><strong>{item.name}</strong>{item.variantName && <span>{item.variantType || "Option"}: {item.variantName}</span>}</div>
              <strong>{formatNaira(item.unitPrice * item.quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="checkout-totals">
          <div><span>Subtotal</span><strong>{formatNaira(subtotal)}</strong></div>
          <div className="delivery-fee-row"><span>Delivery fee</span><strong className="delivery-fee-value">Payable on delivery</strong></div>
          <div className="checkout-total"><span>Total due now</span><strong>{formatNaira(subtotal)}</strong></div>
        </div>
        <p className="delivery-fee-note checkout-delivery-note">Delivery is not included in the amount due now. The delivery fee is paid separately when your order arrives.</p>
      </aside>
    </div>
  );
}
