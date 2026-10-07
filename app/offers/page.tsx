import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import EmptyProducts from "@/components/EmptyProducts";
import { getOfferProducts } from "@/lib/data";

export const metadata: Metadata = { title: "Special Offers", description: "Shop current special offers from Nikky Luxe.", alternates: { canonical: "/offers" } };
export const revalidate = 60;

export default async function OffersPage() {
  const products = await getOfferProducts().catch(() => []);
  return <><Header/><main className="subpage-main"><section className="collection-hero offers-hero"><div className="container"><span className="eyebrow-text">Exclusive Offers</span><h1>Luxury, now at a special price.</h1></div></section><section className="section"><div className="container">{products.length ? <div className="product-grid">{products.map((product,index)=><ProductCard product={product} priority={index<4} key={product.id}/>)}</div> : <EmptyProducts label="special offers"/>}</div></section></main><Footer/></>;
}
