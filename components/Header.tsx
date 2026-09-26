import Link from "next/link";
import { Menu, MessageCircle, Sparkles } from "lucide-react";
import { brand, whatsappLink } from "@/lib/brand";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand-lockup" aria-label="Nikky Luxe home">
          <span className="brand-mark">NL</span>
          <span>
            <strong>{brand.name}</strong>
            <small>Premium Jewelry</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/#collections">Collections</Link>
          <Link href="/#featured">Featured</Link>
          <Link href="/#about">About</Link>
          <Link href="/#contact">Contact</Link>
        </nav>

        <a className="nav-whatsapp" href={whatsappLink()} target="_blank" rel="noreferrer">
          <MessageCircle size={17} /> WhatsApp
        </a>

        <details className="mobile-menu">
          <summary aria-label="Open menu"><Menu size={22} /></summary>
          <div className="mobile-menu-panel">
            <Link href="/#collections">Collections</Link>
            <Link href="/#featured">Featured</Link>
            <Link href="/#about">About</Link>
            <Link href="/#contact">Contact</Link>
            <a href={whatsappLink()} target="_blank" rel="noreferrer"><Sparkles size={16} /> Chat on WhatsApp</a>
          </div>
        </details>
      </div>
    </header>
  );
}
