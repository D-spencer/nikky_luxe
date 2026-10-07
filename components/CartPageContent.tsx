"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartProvider";
import { formatNaira } from "@/lib/currency";
import { cloudinaryImageUrl } from "@/lib/cloudinary-delivery";

export default function CartPageContent() {
  const { items, subtotal, ready, setQuantity, removeItem } = useCart();

  return (
    <>
      <Header />
      <main className="subpage-main">
        <section className="section cart-page">
          <div className="container">
            <Link href="/collections" className="back-link"><ArrowLeft size={15} /> Continue shopping</Link>
            <div className="cart-heading"><div><span className="eyebrow-text">Your selection</span><h1>Shopping bag</h1></div>{ready && items.length > 0 && <span>{items.reduce((sum, item) => sum + item.quantity, 0)} item{items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "" : "s"}</span>}</div>

            {!ready ? <div className="checkout-loading">Loading your bag…</div> : items.length === 0 ? (
              <div className="cart-empty">
                <ShoppingBag size={30} />
                <h2>Your bag is empty.</h2>
                <p>Explore the latest Nikky Luxe pieces and add something you love.</p>
                <Link href="/collections" className="button button-dark">Browse collections</Link>
              </div>
            ) : (
              <div className="cart-grid">
                <div className="cart-list">
                  {items.map((item) => (
                    <article className="cart-row" key={item.key}>
                      <Link href={`/products/${item.slug}`} className="cart-image">
                        {item.imageUrl ? <Image src={cloudinaryImageUrl(item.imageUrl, 240)} alt={item.name} fill sizes="120px" unoptimized /> : <span>NL</span>}
                      </Link>
                      <div className="cart-row-copy">
                        <Link href={`/products/${item.slug}`}><strong>{item.name}</strong></Link>
                        {item.variantName && <span>{item.variantType || "Option"}: {item.variantName}</span>}
                        <span>{formatNaira(item.unitPrice)} each</span>
                        <div className="quantity-control">
                          <button type="button" onClick={() => setQuantity(item.key, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => setQuantity(item.key, item.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                        </div>
                      </div>
                      <div className="cart-row-end">
                        <strong>{formatNaira(item.unitPrice * item.quantity)}</strong>
                        <button type="button" onClick={() => removeItem(item.key)} className="cart-remove" aria-label={`Remove ${item.name}`}><Trash2 size={16} /> Remove</button>
                      </div>
                    </article>
                  ))}
                </div>

                <aside className="cart-summary">
                  <h2>Summary</h2>
                  <div><span>Subtotal</span><strong>{formatNaira(subtotal)}</strong></div>
                  <div className="delivery-fee-row"><span>Delivery fee</span><strong className="delivery-fee-value">Payable on delivery</strong></div>
                  <div className="cart-summary-total"><span>Total due now</span><strong>{formatNaira(subtotal)}</strong></div>
                  <Link href="/checkout" className="button button-dark wide">Proceed to checkout</Link>
                  <p className="delivery-fee-note">Your product payment does not include delivery. The delivery fee is paid separately when your order is delivered.</p>
                </aside>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
