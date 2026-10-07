import Link from "next/link";
import { Menu, MessageCircle, Sparkles } from "lucide-react";
import { brand, whatsappLink } from "@/lib/brand";
import CartButton from "@/components/CartButton";
import SearchButton from "@/components/SearchButton";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand-lockup" aria-label="Nikky Luxe home">
          <span className="brand-mark">NL</span>
          <span className="brand-copy"><strong>{brand.name}</strong><small>Premium Jewelry</small></span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/collections">Collections</Link>
          <Link href="/offers">Offers</Link>
          <Link href="/#featured">Featured</Link>
          <Link href="/#about">About</Link>
          <Link href="/#contact">Contact</Link>
        </nav>

        <div className="nav-actions">
          <SearchButton />
          <CartButton />
          <a className="nav-whatsapp" href={whatsappLink()} target="_blank" rel="noreferrer">
            <MessageCircle size={17} /> WhatsApp
          </a>
        </div>

        <details className="mobile-menu">
          <summary aria-label="Open navigation menu"><Menu size={23} /></summary>
          <nav className="mobile-menu-panel" aria-label="Mobile navigation">
            <Link href="/collections">Collections</Link>
            <Link href="/offers">Offers</Link>
            <Link href="/#featured">Featured</Link>
            <Link href="/#about">About</Link>
            <Link href="/#contact">Contact</Link>
            <Link href="/cart">Shopping bag</Link>
            <a href={whatsappLink()} target="_blank" rel="noreferrer"><Sparkles size={16} /> Chat on WhatsApp</a>
          </nav>
        </details>
      </div>
    </header>
  );
}
