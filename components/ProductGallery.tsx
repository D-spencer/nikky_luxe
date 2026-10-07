"use client";

import Image from "next/image";
import { TouchEvent, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { ProductMedia, ProductVariantMedia } from "@/lib/types";
import { cloudinaryImageUrl, cloudinaryVideoUrl } from "@/lib/cloudinary-delivery";

type GalleryMedia = ProductMedia | ProductVariantMedia;

export default function ProductGallery({
  media,
  productName,
}: {
  media: GalleryMedia[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    setActive(0);
  }, [media]);

  const current = media[active];

  function previous() {
    setActive((currentIndex) =>
      currentIndex === 0 ? media.length - 1 : currentIndex - 1
    );
  }

  function next() {
    setActive((currentIndex) =>
      currentIndex === media.length - 1 ? 0 : currentIndex + 1
    );
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }

  function handleTouchMove(e: TouchEvent<HTMLDivElement>) {
    setTouchEnd(e.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;
    const minimumSwipeDistance = 50;

    if (distance > minimumSwipeDistance) {
      next();
    }

    if (distance < -minimumSwipeDistance) {
      previous();
    }

    setTouchStart(null);
    setTouchEnd(null);
  }

  if (!media.length || !current) {
    return (
      <div className="product-gallery-main media-placeholder">
        <span>NL</span>
      </div>
    );
  }

  return (
    <div className="product-gallery-shell">
      <div
        className="product-gallery-main"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {current.media_type === "image" ? (
          <Image
            src={cloudinaryImageUrl(current.url, 1400)}
            alt={`${productName} — view ${active + 1}`}
            fill
            priority={active === 0}
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 58vw, 650px"
            unoptimized
          />
        ) : (
          <video
            src={cloudinaryVideoUrl(current.url, 1280)}
            controls
            playsInline
            preload="metadata"
            aria-label={`${productName} video ${active + 1}`}
          />
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow gallery-arrow-left"
              onClick={previous}
              aria-label="Previous product image"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              className="gallery-arrow gallery-arrow-right"
              onClick={next}
              aria-label="Next product image"
            >
              <ChevronRight size={22} />
            </button>

            <div className="gallery-counter">
              {active + 1} / {media.length}
            </div>
          </>
        )}
      </div>

      {media.length > 1 && (
        <>
          <div className="product-thumbnails" aria-label="Product media">
            {media.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={`product-thumbnail ${
                  index === active ? "active" : ""
                }`}
                onClick={() => setActive(index)}
                aria-label={`Show ${item.media_type} ${index + 1}`}
                aria-pressed={index === active}
              >
                {item.media_type === "image" ? (
                  <Image
                    src={cloudinaryImageUrl(item.url, 180)}
                    alt=""
                    fill
                    sizes="90px"
                    unoptimized
                  />
                ) : (
                  <span className="video-thumb">
                    <Play size={18} fill="currentColor" />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="gallery-dots" aria-hidden="true">
            {media.map((item, index) => (
              <span
                key={item.id}
                className={index === active ? "active" : ""}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}