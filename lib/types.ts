export type Category = {
  id: string; name: string; slug: string; description: string | null; display_order: number; image_url: string | null; image_public_id: string | null; created_at: string;
};

export type ProductMedia = {
  id: string; product_id: string; url: string; public_id: string; media_type: "image" | "video"; display_order: number; created_at: string;
};

export type ProductVariantMedia = {
  id: string; variant_id: string; url: string; public_id: string; media_type: "image" | "video"; display_order: number; created_at: string;
};

export type ProductVariant = {
  id: string; product_id: string; name: string; price: number | null; available: boolean; display_order: number; created_at: string; product_variant_media?: ProductVariantMedia[];
};

export type Product = {
  id: string; category_id: string; name: string; slug: string; description: string | null; price: number | null; offer_price: number | null; on_offer: boolean; offer_starts_at: string | null; offer_ends_at: string | null; featured: boolean; available: boolean; variant_type: string | null; created_at: string; updated_at: string; category?: Category | null; product_media?: ProductMedia[]; product_variants?: ProductVariant[];
};

export type OrderItem = {
  id: string; order_id: string; product_id: string | null; variant_id: string | null; product_name: string; variant_type: string | null; variant_name: string | null; product_image_url: string | null; quantity: number; unit_price: number; line_total: number; created_at: string;
};

export type Order = {
  id: string; order_number: string; customer_name: string; customer_email: string; customer_phone: string; delivery_address: string; delivery_city: string; delivery_state: string; customer_notes: string | null; subtotal: number; total: number; currency: string; payment_status: "pending" | "paid" | "failed" | "refunded"; order_status: "pending_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled"; payment_reference: string | null; paystack_transaction_id: string | null; paid_at: string | null; created_at: string; updated_at: string; order_items?: OrderItem[];
};
