import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import EmptyProducts from "@/components/EmptyProducts";
import { getProductsByCategory } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getProductsByCategory(slug).catch(() => ({ category: null, products: [] }));
  return { title: category?.name || "Collection", description: category?.description || `Shop the ${category?.name || "Nikky Luxe"} collection.` };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { category, products } = await getProductsByCategory(slug).catch(() => ({ category: null, products: [] }));

  return (
    <>
      <Header />
      <main className="subpage-main">
        <section className="collection-hero">
          <div className="container">
            <Link href="/#collections" className="back-link"><ArrowLeft size={15} /> All collections</Link>
            <span className="eyebrow-text">Nikky Luxe Collection</span>
            <h1>{category?.name || slug.replaceAll("-", " ")}</h1>
            <p>{category?.description || "Explore selected pieces from this Nikky Luxe collection."}</p>
          </div>
        </section>
        <section className="section">
          <div className="container">
            {products.length ? <div className="product-grid">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <EmptyProducts label={category?.name || "collection"} />}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
