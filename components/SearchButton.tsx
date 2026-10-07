"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, Search, X } from "lucide-react";
import { cloudinaryImageUrl } from "@/lib/cloudinary-delivery";
import { formatNaira } from "@/lib/currency";
import {
  normalizeSearchQuery,
  SEARCH_MAX_LENGTH,
  SEARCH_MIN_LENGTH,
  type SearchProduct,
  type SearchResponse,
} from "@/lib/search";

export default function SearchButton() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const query = normalizeSearchQuery(value);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("search-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("search-open");
    };
  }, [open]);

  useEffect(() => {
    if (!open || query.length < SEARCH_MIN_LENGTH) {
      setResults([]);
      setLoading(false);
      setMessage("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setMessage("");
      try {
        const response = await fetch(`/api/search?mode=suggest&q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json()) as SearchResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Search failed");
        setResults(payload.results || []);
        if (!payload.results?.length) setMessage("No matching pieces found.");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
          setMessage(error instanceof Error ? error.message : "Search is temporarily unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.length < SEARCH_MIN_LENGTH) {
      setMessage("Type at least 2 characters to search.");
      return;
    }
    window.location.assign(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <>
      <button type="button" className="nav-search" aria-label="Search Nikky Luxe" onClick={() => setOpen(true)}>
        <Search size={18} />
        <span>Search</span>
      </button>

      {open && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search Nikky Luxe">
          <button type="button" className="search-backdrop" aria-label="Close search" onClick={() => setOpen(false)} />
          <section className="search-panel">
            <div className="search-panel-heading">
              <div><span className="eyebrow-text">Find your piece</span><strong>Search Nikky Luxe</strong></div>
              <button type="button" className="search-close" aria-label="Close search" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>

            <form className="search-form" onSubmit={submit} role="search">
              <Search size={19} aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={value}
                onChange={(event) => setValue(event.target.value.slice(0, SEARCH_MAX_LENGTH))}
                placeholder="Search necklaces, watches, colours..."
                aria-label="Search products"
                autoComplete="off"
                maxLength={SEARCH_MAX_LENGTH}
              />
              {loading && <LoaderCircle className="search-spinner" size={18} aria-label="Searching" />}
            </form>

            <div className="search-suggestions" aria-live="polite">
              {query.length < SEARCH_MIN_LENGTH && <p className="search-hint">Search by product name, description, collection or option.</p>}
              {message && <p className="search-message">{message}</p>}
              {results.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} className="search-suggestion" onClick={() => setOpen(false)}>
                  <span className="search-suggestion-image">
                    {product.imageUrl ? <Image src={cloudinaryImageUrl(product.imageUrl, 160)} alt="" fill sizes="64px" unoptimized /> : <b>NL</b>}
                  </span>
                  <span className="search-suggestion-copy">
                    <small>{product.categoryName}</small>
                    <strong>{product.name}</strong>
                    <span>{formatNaira(product.price)}</span>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
            </div>

            {results.length > 0 && (
              <Link className="search-view-all" href={`/search?q=${encodeURIComponent(query)}`} onClick={() => setOpen(false)}>
                View all results for “{query}” <ArrowRight size={16} />
              </Link>
            )}
          </section>
        </div>
      )}
    </>
  );
}
