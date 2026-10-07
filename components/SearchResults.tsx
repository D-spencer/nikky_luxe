"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LoaderCircle, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { cloudinaryImageUrl } from "@/lib/cloudinary-delivery";
import { formatNaira } from "@/lib/currency";
import {
  normalizeSearchQuery,
  SEARCH_MAX_LENGTH,
  SEARCH_MIN_LENGTH,
  type SearchResponse,
} from "@/lib/search";

export default function SearchResults({ initialQuery }: { initialQuery: string }) {
  const [value, setValue] = useState(initialQuery);
  const [query, setQuery] = useState(normalizeSearchQuery(initialQuery));
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.length < SEARCH_MIN_LENGTH) {
      setData(null);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/search?mode=results&page=${page}&q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const payload = (await response.json()) as SearchResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Search failed");
        return payload;
      })
      .then(setData)
      .catch((fetchError: Error) => {
        if (fetchError.name !== "AbortError") setError(fetchError.message || "Search is temporarily unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = normalizeSearchQuery(value);
    if (nextQuery.length < SEARCH_MIN_LENGTH) {
      setError("Type at least 2 characters to search.");
      return;
    }
    setPage(1);
    setQuery(nextQuery);
    window.history.replaceState(null, "", `/search?q=${encodeURIComponent(nextQuery)}`);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <form className="search-page-form" onSubmit={submit} role="search">
        <Search size={20} aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, SEARCH_MAX_LENGTH))}
          placeholder="Search products, descriptions, collections or options..."
          aria-label="Search Nikky Luxe products"
          maxLength={SEARCH_MAX_LENGTH}
          autoComplete="off"
        />
        <button className="button button-dark" type="submit">Search</button>
      </form>

      {loading && <div className="search-page-state"><LoaderCircle className="search-spinner" size={24} /> Searching Nikky Luxe...</div>}
      {!loading && error && <div className="search-page-state search-page-error">{error}</div>}
      {!loading && !error && query.length < SEARCH_MIN_LENGTH && <div className="search-page-state">Enter at least 2 characters to search.</div>}

      {!loading && !error && data && (
        <>
          <div className="search-results-heading">
            <p>{data.total === 1 ? "1 piece" : `${data.total} pieces`} found for <strong>“{data.query}”</strong></p>
          </div>

          {data.results.length ? (
            <div className="search-result-grid">
              {data.results.map((product) => (
                <article className="search-result-card" key={product.id}>
                  <Link href={`/products/${product.slug}`} className="search-result-image" aria-label={`View ${product.name}`}>
                    {product.imageUrl ? <Image src={cloudinaryImageUrl(product.imageUrl, 600)} alt={product.name} fill sizes="(max-width: 760px) 50vw, 25vw" unoptimized /> : <span>NL</span>}
                  </Link>
                  <div className="search-result-copy">
                    <small>{product.categoryName}</small>
                    <Link href={`/products/${product.slug}`}><strong>{product.name}</strong><ArrowRight size={16} /></Link>
                    <span>{formatNaira(product.price)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="search-page-state">No matching pieces found. Try another word or collection.</div>}

          {totalPages > 1 && (
            <nav className="search-pagination" aria-label="Search result pages">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft size={16} /> Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next <ArrowRight size={16} /></button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
