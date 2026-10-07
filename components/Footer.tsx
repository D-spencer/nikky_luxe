import Link from "next/link";
import { Instagram, MapPin, MessageCircle } from "lucide-react";
import { brand, whatsappLink } from "@/lib/brand";

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">Nikky Luxe</div>
          <p>{brand.tagline}. Timeless style, thoughtfully selected.</p>
        </div>
        <div>
          <h3>Visit & contact</h3>
          <p><MapPin size={16} /> {brand.address}</p>
          <p><MessageCircle size={16} /> {brand.phoneDisplay}</p>
          <p><Instagram size={16} /> @{brand.instagram}</p>
        </div>
        <div>
          <h3>Quick links</h3>
          <Link href="/#collections">Collections</Link>
          <Link href="/#featured">Featured pieces</Link>
          <a href={whatsappLink()} target="_blank" rel="noreferrer">Order on WhatsApp</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Nikky Luxe. All rights reserved.</span>
      </div>
    </footer>
  );
}
