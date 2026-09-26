import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProduct } from "@/lib/data";
import { formatNaira } from "@/lib/currency";
import { whatsappLink } from "@/lib/brand";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  return { title: product?.name || "Product", description: product?.description || "Shop this Nikky Luxe piece." };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);

  if (!product) {
    return <><Header /><main className="not-found"><h1>Piece not found.</h1><Link href="/">Return home</Link></main><Footer /></>;
  }

  const media = [...(product.product_media || [])].sort((a, b) => a.display_order - b.display_order);
  const orderMessage = `Hello Nikky Luxe, I am interested in ${product.name}${product.price ? ` (${formatNaira(product.price)})` : ""}. Is it available?`;

  return (
    <>
      <Header />
      <main className="subpage-main">
        <section className="product-detail section">
          <div className="container product-detail-grid">
            <div>
              <Link href={product.category ? `/collections/${product.category.slug}` : "/"} className="back-link"><ArrowLeft size={15} /> Back to collection</Link>
              <div className="product-gallery">
                {media.length ? media.map((item, index) => (
                  <div className="gallery-item" key={item.id}>
                    {item.media_type === "image" ? <Image src={item.url} alt={`${product.name} ${index + 1}`} fill sizes="(max-width: 900px) 100vw, 55vw" priority={index === 0} /> : <video src={item.url} controls playsInline />}
                  </div>
                )) : <div className="gallery-item media-placeholder"><span>NL</span></div>}
              </div>
            </div>
            <aside className="product-info">
              <span className="eyebrow-text">{product.category?.name || "Nikky Luxe"}</span>
              <h1>{product.name}</h1>
              <div className="detail-price">{formatNaira(product.price)}</div>
              {product.description && <p>{product.description}</p>}
              <div className="availability"><Check size={17} /> {product.available ? "Available to order" : "Currently unavailable"}</div>
              <a className="button button-dark wide" href={whatsappLink(orderMessage)} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Order on WhatsApp</a>
              <div className="detail-note">For final stock confirmation, delivery cost and payment details, speak directly with Nikky Luxe on WhatsApp.</div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
