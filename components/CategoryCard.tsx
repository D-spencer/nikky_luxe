import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem } from "lucide-react";
import { cloudinaryImageUrl } from "@/lib/cloudinary-delivery";

export type CategoryCardData = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
};

export default function CategoryCard({ category, index, heading = "h3" }: { category: CategoryCardData; index: number; heading?: "h2" | "h3" }) {
  const Heading = heading;
  const hasImage = Boolean(category.image_url);

  return (
    <Link href={`/collections/${category.slug}`} className={`category-card${hasImage ? " has-image" : ""}`}>
      {hasImage && (
        <>
          <Image
            src={cloudinaryImageUrl(category.image_url!, 600)}
            alt={`${category.name} collection`}
            fill
            sizes="(max-width: 760px) 50vw, (max-width: 1000px) 33vw, 25vw"
            className="category-card-image"
            unoptimized
          />
          <span className="category-card-overlay" aria-hidden="true" />
        </>
      )}
      <span className="category-number">{String(index + 1).padStart(2, "0")}</span>
      <div className="category-card-content">
        {!hasImage && <div className="category-icon"><Gem size={24} /></div>}
        <Heading>{category.name}</Heading>
        {category.description && <p>{category.description}</p>}
        <span className="category-link">View collection <ArrowRight size={15} /></span>
      </div>
    </Link>
  );
}
