export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
};

export type ProductMedia = {
  id: string;
  product_id: string;
  url: string;
  public_id: string;
  media_type: "image" | "video";
  display_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  featured: boolean;
  available: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  product_media?: ProductMedia[];
};
