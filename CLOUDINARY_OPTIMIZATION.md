# Cloudinary delivery optimization

Nikky Luxe keeps the original Cloudinary URL in Supabase. The storefront and admin UI create optimized delivery URLs only when an asset is displayed.

## Before upload

Compress product photos manually before uploading them. A practical target is:

- 1600–2000 px on the longest side
- roughly 300–800 KB for most product photos
- JPEG or WebP for photos
- keep enough quality to preserve jewellery detail

Videos should also be compressed before upload where practical.

## Delivery sizes used by the site

- Product cards: 600 px
- Collection cards: 600 px
- Product gallery: 1400 px
- Gallery thumbnails: 180 px
- Cart: 240 px
- Checkout: 160 px
- Admin/order thumbnails: 160 px
- Admin image previews: 480–700 px
- Product gallery video: max 1280 px wide
- Admin video previews: max 480–640 px wide

Image and video delivery uses Cloudinary `f_auto` and `q_auto:good`. Resizing uses `c_limit`, so smaller originals are not enlarged.

The original asset is not changed and no incoming upload transformation is applied.

## Why the widths are fixed

Using a small, predictable set of delivery sizes avoids creating unnecessary Cloudinary derivatives. Repeated requests for the same transformed URL can be served from Cloudinary's CDN cache.
