# Browser-side upload compression

Nikky Luxe now optimizes product, variant, and category images in the admin browser before they are sent to Cloudinary.

- Maximum image dimension: 2400 px on the longest side.
- Output: WebP when compression produces a meaningful saving.
- Quality passes: 86%, 82%, then 78% as needed.
- Target size: about 1.2 MB or less where the image allows it without excessive resizing.
- A second resize pass is used only when the first 2400 px pass remains large.
- Images larger than 20 MB are rejected before processing to avoid excessive browser memory use.
- If browser decoding is unsupported or compression would not save at least about 5%, the original file is kept.
- Videos are not recompressed and continue to upload unchanged.
- The optimized file is uploaded directly from the browser to Cloudinary. Vercel does not receive or process the image bytes, and Cloudinary incoming transformations are not used.
- Existing Cloudinary delivery transformations remain unchanged.

The admin UI displays original -> optimized size for compressed images before saving.

## Upload format hardening

The admin uploader now uses two layers of format restrictions:

- Browser validation accepts only JPG/JPEG, PNG, WEBP, MP4, MOV and WEBM for product media, and only JPG/JPEG, PNG and WEBP for collection images.
- The authenticated server signing endpoints include Cloudinary `allowed_formats` in the signed upload parameters and return a fixed `image` or `video` resource type. The browser sends those exact signed parameters to Cloudinary, so unsupported formats are rejected by Cloudinary even if client-side checks are bypassed.

The Cloudinary API secret remains server-only. Image compression still happens locally in the admin's browser before the signed upload and does not use an incoming Cloudinary transformation.
