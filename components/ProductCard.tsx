import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import type { Product } from "@/lib/types";
import { cloudinaryImageUrl } from "@/lib/cloudinary-delivery";
import { effectiveProductPrice, isOfferActive } from "@/lib/offers";

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const media = [...(product.product_media || [])].sort((a, b) => a.display_order - b.display_order)[0];
  const offerActive = isOfferActive(product);
  const displayPrice = effectiveProductPrice(product);

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-media" aria-label={`View ${product.name}`}>
        {media?.media_type === "image" ? (
          <Image
            src={cloudinaryImageUrl(media.url, 600)}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 520px) 50vw, (max-width: 900px) 33vw, 25vw"
            unoptimized
          />
        ) : media?.media_type === "video" ? (
          <div className="media-placeholder video-card-placeholder"><Play size={30} /><span>Video</span></div>
        ) : (
          <div className="media-placeholder"><span>NL</span></div>
        )}
        {offerActive ? <span className="featured-chip offer-chip">Offer</span> : product.featured && <span className="featured-chip">Featured</span>}
      </Link>
      <div className="product-card-body">
        <p className="product-category">{product.category?.name || "Nikky Luxe"}</p>
        <Link href={`/products/${product.slug}`} className="product-card-title">
          <span>{product.name}</span><ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <p className="product-price">{offerActive ? <><strong>{formatNaira(displayPrice)}</strong><del>{formatNaira(product.price)}</del></> : formatNaira(displayPrice)}</p>
      </div>
    </article>
  );
}
