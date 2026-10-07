import { cleanOptionalText, cleanText, isNikkyCloudinaryMedia, safeNumber, validUuid } from "@/lib/security";

type MediaInput = { url: string; public_id: string; media_type: "image" | "video"; display_order?: number };
type VariantInput = { name: string; price: number | null; available: boolean; media: MediaInput[] };

export function parseCategoryInput(body: Record<string, unknown>) {
  const name = cleanText(body.name, 80);
  const description = cleanOptionalText(body.description, 500);
  const displayOrder = safeNumber(body.display_order, 0, 10000);
  const imageUrl = body.image_url == null || body.image_url === "" ? null : String(body.image_url);
  const imagePublicId = body.image_public_id == null || body.image_public_id === "" ? null : String(body.image_public_id);

  if (!name) return { error: "Category name is required and must be 80 characters or fewer." } as const;
  if (description === null) return { error: "Category description must be 500 characters or fewer." } as const;
  if (displayOrder == null) return { error: "Display order is invalid." } as const;
  if ((imageUrl || imagePublicId) && !isNikkyCloudinaryMedia(imageUrl, imagePublicId, ["nikky-luxe/categories"])) {
    return { error: "Invalid collection image." } as const;
  }

  return { value: { name, description: description || null, display_order: Math.trunc(displayOrder), image_url: imageUrl, image_public_id: imagePublicId } } as const;
}

function parseMedia(input: unknown, maxItems: number): { value?: MediaInput[]; error?: string } {
  if (!Array.isArray(input)) return { value: [] };
  if (input.length > maxItems) return { error: `A maximum of ${maxItems} media files is allowed.` };
  const output: MediaInput[] = [];
  for (let i = 0; i < input.length; i++) {
    const item = input[i] as Record<string, unknown>;
    const mediaType = item?.media_type === "video" ? "video" : item?.media_type === "image" ? "image" : null;
    if (!mediaType || !isNikkyCloudinaryMedia(item?.url, item?.public_id, ["nikky-luxe/products"])) {
      return { error: "Invalid product media." };
    }
    output.push({ url: String(item.url), public_id: String(item.public_id), media_type: mediaType, display_order: i });
  }
  return { value: output };
}

export function parseProductInput(body: Record<string, unknown>) {
  const name = cleanText(body.name, 120);
  const description = cleanOptionalText(body.description, 2000);
  const categoryId = cleanText(body.category_id, 36);
  const variantType = cleanOptionalText(body.variant_type, 50);
  const price = safeNumber(body.price, 0, 100_000_000, true);
  const offerPrice = safeNumber(body.offer_price, 0, 100_000_000, true);
  const onOffer = Boolean(body.on_offer);
  const offerStartsAt = body.offer_starts_at ? new Date(String(body.offer_starts_at)) : null;
  const offerEndsAt = body.offer_ends_at ? new Date(String(body.offer_ends_at)) : null;
  const media = parseMedia(body.media, 20);

  if (!name) return { error: "Product name is required and must be 120 characters or fewer." } as const;
  if (!categoryId || !validUuid(categoryId)) return { error: "A valid category is required." } as const;
  if (description === null) return { error: "Product description must be 2,000 characters or fewer." } as const;
  if (variantType === null) return { error: "Variant type must be 50 characters or fewer." } as const;
  if (price === undefined) return { error: "Product price is invalid." } as const;
  if (offerPrice === undefined) return { error: "Offer price is invalid." } as const;
  if (onOffer && (offerPrice == null || offerPrice <= 0)) return { error: "Enter an offer price before enabling the special offer." } as const;
  if (onOffer && price != null && offerPrice != null && offerPrice >= price) return { error: "Offer price must be lower than the regular price." } as const;
  if (offerStartsAt && Number.isNaN(offerStartsAt.getTime())) return { error: "Offer start date is invalid." } as const;
  if (offerEndsAt && Number.isNaN(offerEndsAt.getTime())) return { error: "Offer end date is invalid." } as const;
  if (offerStartsAt && offerEndsAt && offerEndsAt <= offerStartsAt) return { error: "Offer end date must be after the start date." } as const;
  if (media.error) return { error: media.error } as const;

  const rawVariants = Array.isArray(body.variants) ? body.variants : [];
  if (rawVariants.length > 30) return { error: "A maximum of 30 variants is allowed per product." } as const;
  if (rawVariants.length && !variantType) return { error: "Variant type is required when variants are added." } as const;

  const variants: VariantInput[] = [];
  for (const raw of rawVariants) {
    const variant = raw as Record<string, unknown>;
    const variantName = cleanText(variant.name, 100);
    const variantPrice = safeNumber(variant.price, 0, 100_000_000, true);
    const variantMedia = parseMedia(variant.media, 20);
    if (!variantName) return { error: "Each variant needs a name of 100 characters or fewer." } as const;
    if (variantPrice === undefined) return { error: `Invalid price for variant ${variantName}.` } as const;
    if (variantMedia.error) return { error: variantMedia.error } as const;
    variants.push({ name: variantName, price: variantPrice ?? null, available: Boolean(variant.available), media: variantMedia.value || [] });
  }

  return {
    value: {
      name,
      description: description || null,
      price: price ?? null,
      offer_price: offerPrice ?? null,
      on_offer: onOffer,
      offer_starts_at: offerStartsAt?.toISOString() || null,
      offer_ends_at: offerEndsAt?.toISOString() || null,
      category_id: categoryId,
      featured: Boolean(body.featured),
      available: Boolean(body.available),
      variant_type: variantType || null,
      media: media.value || [],
      variants,
    },
  } as const;
}
