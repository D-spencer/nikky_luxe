import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = { title: "Collections", description: "Browse all Nikky Luxe jewelry and accessory collections.", alternates: { canonical: "/collections" } };
export const revalidate = 60;

export default async function CollectionsPage() {
  const categories = await getCategories().catch(() => []);
  return <><Header /><main className="subpage-main"><section className="collection-hero"><div className="container"><span className="eyebrow-text">Nikky Luxe</span><h1>Collections</h1><p>Explore our jewelry and accessories, organised to make finding your next piece effortless.</p></div></section><section className="section"><div className="container"><div className="category-grid">{categories.map((category, index) => <CategoryCard category={category} index={index} heading="h2" key={category.id} />)}</div></div></section></main><Footer /></>;
}
