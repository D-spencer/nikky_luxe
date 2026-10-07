import Link from "next/link";
import { ArrowRight, BadgeCheck, Gem, Heart, MessageCircle, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import EmptyProducts from "@/components/EmptyProducts";
import CategoryCard from "@/components/CategoryCard";
import { getCategories, getFeaturedProducts, getNewestProducts } from "@/lib/data";
import { brand, whatsappLink } from "@/lib/brand";

const fallbackCategories = [
  { name: "Bangles", slug: "bangles" },
  { name: "Bracelets", slug: "bracelets" },
  { name: "Necklaces", slug: "necklaces" },
  { name: "Wristwatches", slug: "wristwatches" },
  { name: "Sunglasses", slug: "sunglasses" },
  { name: "Luxury Chains", slug: "luxury-chains" },
  { name: "Unisex Wristbands", slug: "unisex-wristbands" },
];

export const revalidate = 60;

export default async function HomePage() {
  const [categories, featured, newest] = await Promise.all([
    getCategories().catch(() => []),
    getFeaturedProducts().catch(() => []),
    getNewestProducts().catch(() => []),
  ]);

  const visibleCategories = categories.length ? categories : fallbackCategories;

  return (
    <>
      <Header />
      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow"><Sparkles size={14} /> Premium jewelry · timeless style</div>
              <h1>Luxury that feels <em>effortless.</em></h1>
              <p>Curated jewelry and accessories designed to make every outfit feel complete — from everyday polish to special moments.</p>
              <div className="hero-actions">
                <Link href="/collections" className="button button-dark">Explore Collections <ArrowRight size={17} /></Link>
                <a href={whatsappLink()} className="button button-light" target="_blank" rel="noreferrer"><MessageCircle size={17} /> Shop on WhatsApp</a>
              </div>
              <div className="hero-proof">
                <span><BadgeCheck size={16} /> Carefully selected</span>
                <span><Heart size={16} /> Style-led pieces</span>
                <span><Gem size={16} /> Luxury feel</span>
              </div>
            </div>

            <div className="hero-art" aria-label="Nikky Luxe brand visual">
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-jewel jewel-one" />
              <div className="hero-jewel jewel-two" />
              <div className="hero-monogram">
                <span>NL</span>
                <small>NIKKY LUXE</small>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="collections">
          <div className="container">
            <div className="section-heading split-heading">
              <div><span className="eyebrow-text">Shop by category</span><h2>Find your signature piece.</h2></div>
              <p>Browse every Nikky Luxe collection in one place. <Link href="/collections" className="inline-link">View all</Link></p>
            </div>
            <div className="category-grid">
              {visibleCategories.map((category, index) => (
                <CategoryCard category={category} index={index} key={category.slug} />
              ))}
            </div>
          </div>
        </section>

        <section className="home-offer-section" aria-label="Nikky Luxe special offers">
          <div className="container">
            <div className="home-offer-card">
              <div className="home-offer-copy">
                <span className="eyebrow-text light">A little something special</span>
                <h2>Luxury, at a special price.</h2>
                <p>Discover selected Nikky Luxe pieces currently available at special prices.</p>
                <Link href="/offers" className="button home-offer-button">View Special Offers <ArrowRight size={17} /></Link>
              </div>
              <div className="home-offer-mark" aria-hidden="true">
                <span>NL</span>
                <small>Special Edit</small>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-soft" id="featured">
          <div className="container">
            <div className="section-heading centered-heading">
              <span className="eyebrow-text">Selected for you</span>
              <h2>Featured pieces</h2>
              <p>Pieces the Nikky Luxe team is highlighting right now.</p>
            </div>
            {featured.length ? <div className="product-grid">{featured.map((p, index) => <ProductCard key={p.id} product={p} priority={index < 2} />)}</div> : <EmptyProducts label="featured collection" />}
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-heading split-heading">
              <div><span className="eyebrow-text">Freshly added</span><h2>New arrivals</h2></div>
              <p>Discover the latest additions uploaded by Nikky Luxe.</p>
            </div>
            {newest.length ? <div className="product-grid">{newest.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <EmptyProducts label="new arrivals" />}
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="container about-grid">
            <div className="about-card about-visual">
              <div className="large-monogram">NL</div>
              <p>Timeless elegance,<br />always.</p>
            </div>
            <div className="about-copy">
              <span className="eyebrow-text">About Nikky Luxe</span>
              <h2>Accessories that make the whole look feel intentional.</h2>
              <p>Nikky Luxe brings together jewelry and fashion accessories for customers who appreciate elegance, versatility and beautiful finishing details.</p>
              <p>Browse online, choose what you love, then message us directly on WhatsApp for current availability, ordering and delivery.</p>
              <a className="text-link" href={whatsappLink("Hello Nikky Luxe, I would like help choosing a piece.")} target="_blank" rel="noreferrer">Talk to us on WhatsApp <ArrowRight size={16} /></a>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container cta-inner">
            <div><span className="eyebrow-text light">Personal shopping</span><h2>Seen something you love?</h2><p>Send Nikky Luxe a message for availability, pricing and delivery information.</p></div>
            <a href={whatsappLink()} className="button button-cream" target="_blank" rel="noreferrer"><MessageCircle size={18} /> Chat with Nikky Luxe</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
