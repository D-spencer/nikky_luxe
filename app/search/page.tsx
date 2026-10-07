import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchResults from "@/components/SearchResults";
import { normalizeSearchQuery, SEARCH_MAX_LENGTH } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Nikky Luxe jewelry and accessories.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const initialQuery = normalizeSearchQuery(String(params.q || "")).slice(0, SEARCH_MAX_LENGTH);

  return (
    <>
      <Header />
      <main className="search-page section">
        <div className="container">
          <div className="search-page-heading">
            <span className="eyebrow-text">Discover Nikky Luxe</span>
            <h1>Search our collection.</h1>
            <p>Search product names, descriptions, collections and available options.</p>
          </div>
          <SearchResults initialQuery={initialQuery} />
        </div>
      </main>
      <Footer />
    </>
  );
}
