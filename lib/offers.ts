import type { Product } from "@/lib/types";

export function isOfferActive(product: Pick<Product, "on_offer" | "offer_price" | "offer_starts_at" | "offer_ends_at">, now = new Date()) {
  if (!product.on_offer || product.offer_price == null || product.offer_price <= 0) return false;
  const time = now.getTime();
  if (product.offer_starts_at && new Date(product.offer_starts_at).getTime() > time) return false;
  if (product.offer_ends_at && new Date(product.offer_ends_at).getTime() < time) return false;
  return true;
}

export function effectiveProductPrice(product: Pick<Product, "price" | "on_offer" | "offer_price" | "offer_starts_at" | "offer_ends_at">) {
  return isOfferActive(product) ? product.offer_price : product.price;
}
