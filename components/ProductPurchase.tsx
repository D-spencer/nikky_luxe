"use client";

import { useMemo, useState } from "react";
import { Check, MessageCircle, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import ProductGallery from "@/components/ProductGallery";
import { useCart } from "@/components/CartProvider";
import { formatNaira } from "@/lib/currency";
import { whatsappLink } from "@/lib/brand";
import type { Product, ProductMedia, ProductVariant } from "@/lib/types";
import { effectiveProductPrice, isOfferActive } from "@/lib/offers";

export default function ProductPurchase({ product, generalMedia }: { product: Product; generalMedia: ProductMedia[] }) {
  const { addItem } = useCart();
  const variants = useMemo(() => [...(product.product_variants || [])].sort((a,b)=>a.display_order-b.display_order), [product.product_variants]);
  const firstAvailable = variants.findIndex(v=>v.available);
  const [selectedIndex,setSelectedIndex] = useState(firstAvailable >= 0 ? firstAvailable : 0);
  const [added, setAdded] = useState(false);
  const selected: ProductVariant | undefined = variants[selectedIndex];
  const variantMedia = selected ? [...(selected.product_variant_media || [])].sort((a,b)=>a.display_order-b.display_order) : [];
  const shownMedia = variantMedia.length ? variantMedia.map(m=>({ ...m, product_id:product.id })) : generalMedia;
  const offerActive = isOfferActive(product);
  const basePrice = effectiveProductPrice(product);
  const price = selected?.price ?? basePrice;
  const option = selected ? ` — ${product.variant_type || "Option"}: ${selected.name}` : "";
  const orderMessage = `Hello Nikky Luxe, I am interested in ${product.name}${option}${price ? ` (${formatNaira(price)})` : ""}. Is it available?`;
  const canBuyOnline = price != null && price > 0 && product.available && (!selected || selected.available);
  const firstImage = shownMedia.find((item) => item.media_type === "image")?.url || null;

  function addToBag() {
    if (!canBuyOnline || price == null) return;
    addItem({
      productId: product.id,
      variantId: selected?.id || null,
      name: product.name,
      slug: product.slug,
      variantType: selected ? product.variant_type : null,
      variantName: selected?.name || null,
      unitPrice: price,
      imageUrl: firstImage,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return <div className="product-detail-grid">
    <ProductGallery key={selected?.id || "general"} media={shownMedia} productName={selected ? `${product.name} — ${selected.name}` : product.name} />
    <aside className="product-info">
      <span className="eyebrow-text">{product.category?.name || "Nikky Luxe"}</span>
      <h1>{product.name}</h1>
      <div className="detail-price">{offerActive && !selected?.price ? <><strong>{formatNaira(price)}</strong> <del>{formatNaira(product.price)}</del></> : formatNaira(price)}</div>
      {product.description && <p>{product.description}</p>}
      {variants.length > 0 && <div className="variant-picker"><strong>{product.variant_type || "Options"}</strong><div className="variant-options">{variants.map((v,index)=><button type="button" key={v.id} disabled={!v.available} className={index===selectedIndex?"active":""} onClick={()=>setSelectedIndex(index)}>{v.name}{v.price != null && v.price !== product.price ? <small>{formatNaira(v.price)}</small> : null}</button>)}</div>{selected && <span className="variant-selected">Selected: {selected.name}</span>}</div>}
      <div className="availability"><Check size={17}/> {selected && !selected.available ? "Currently unavailable" : "Available to order"}</div>
      <div className="product-buy-actions">
        <button type="button" className="button button-dark wide" disabled={!canBuyOnline} onClick={addToBag}><ShoppingBag size={18}/> {added ? "Added to bag" : canBuyOnline ? "Add to bag" : "Online checkout unavailable"}</button>
        <a className="button button-soft wide" href={whatsappLink(orderMessage)} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Order on WhatsApp</a>
      </div>
      <div className="product-reassurance"><span><ShieldCheck size={17}/> Secure online payment available</span><span><Truck size={17}/> Delivery fee paid on delivery</span></div>
      <div className="detail-note">Online checkout covers the product total only. The delivery fee is paid separately when your order is delivered.</div>
    </aside>
  </div>;
}
