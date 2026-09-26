import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const media = [...(product.product_media || [])].sort((a, b) => a.display_order - b.display_order)[0];

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-media">
        {media?.media_type === "image" ? (
          <Image src={media.url} alt={product.name} fill sizes="(max-width: 700px) 50vw, 25vw" />
        ) : media?.media_type === "video" ? (
          <video src={media.url} muted playsInline preload="metadata" />
        ) : (
          <div className="media-placeholder"><span>NL</span></div>
        )}
        {product.featured && <span className="featured-chip">Featured</span>}
      </Link>
      <div className="product-card-body">
        <p className="product-category">{product.category?.name || "Nikky Luxe"}</p>
        <Link href={`/products/${product.slug}`} className="product-card-title">
          {product.name} <ArrowUpRight size={16} />
        </Link>
        <p className="product-price">{formatNaira(product.price)}</p>
      </div>
    </article>
  );
}
