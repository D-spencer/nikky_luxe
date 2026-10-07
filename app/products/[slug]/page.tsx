import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductPurchase from "@/components/ProductPurchase";
import { getProduct } from "@/lib/data";
import { brand } from "@/lib/brand";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);

  const image = product?.product_media?.find(
    (item) => item.media_type === "image"
  )?.url;

  const title = product?.name || "Product";
  const description =
    product?.description || "Shop this Nikky Luxe piece.";

  return {
    title,
    description,

    alternates: {
      canonical: `/products/${slug}`,
    },

    openGraph: {
      title,
      description,
      type: "website",
      images: image
        ? [
            {
              url: image,
              alt: `${title} — Nikky Luxe`,
            },
          ]
        : [{ url: "/og-image.jpg?v=20261005", alt: "Nikky Luxe — Premium Jewelry and Accessories" }],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : ["/og-image.jpg?v=20261005"],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  const nonce = (await headers()).get("x-nonce") || undefined;

  if (!product) return <><Header /><main className="not-found"><h1>Piece not found.</h1><Link href="/collections">Browse collections</Link></main><Footer /></>;

  const media = [...(product.product_media || [])].sort((a, b) => a.display_order - b.display_order);
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/products/${product.slug}`;
  const image = media.find((item) => item.media_type === "image")?.url;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: image ? [image] : undefined,
    url: productUrl || undefined,
    brand: { "@type": "Brand", name: brand.name },
    offers: product.price ? { "@type": "Offer", priceCurrency: "NGN", price: product.price, availability: "https://schema.org/InStock", url: productUrl || undefined } : undefined,
  };

  return (
    <>
      <Header />
      <main className="subpage-main">
        <section className="product-detail section">
          <div className="container">
            <Link href={product.category ? `/collections/${product.category.slug}` : "/collections"} className="back-link"><ArrowLeft size={15} /> Back to collection</Link>
<ProductPurchase product={product} generalMedia={media} />
          </div>
        </section>
      </main>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Footer />
    </>
  );
}
