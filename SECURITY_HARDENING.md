# Nikky Luxe Security Hardening — 30 September 2026

This version hardens the current checkout, Paystack, Cloudinary and admin implementation without changing the normal customer purchase flow.

## Required before deployment

Run this migration in **Supabase → SQL Editor** before deploying the code:

`supabase/migrations/20260930_security_hardening.sql`

It creates the persistent database-backed rate limiter, adds checkout fingerprinting for rapid duplicate-order detection, and adds a unique Paystack transaction-ID index for payment idempotency.

The existing server environment variables are still required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_SITE_URL`

Optional: add a long random server-only `RATE_LIMIT_SALT`. If omitted, the existing Supabase service-role key is used only as the HMAC salt for irreversible rate-limit identifiers. Never prefix it with `NEXT_PUBLIC_`.

`NEXT_PUBLIC_SITE_URL` is now mandatory for checkout. Production checkout no longer falls back to the incoming request origin. On Vercel it should remain the canonical HTTPS production URL.

## Implemented protections

### Rate limiting and abuse controls

- Checkout: per-IP and per-email persistent limits.
- Payment verification page: per-IP limit to prevent abuse of the Paystack Verify API.
- Admin login: separate per-IP and per-email limits with a temporary cooldown.
- Admin mutation/signing APIs: persistent per-IP limits.
- Rate-limit identifiers are HMAC-hashed before storage; raw IP addresses/emails are not stored in the limiter table.
- Checkout rejects rapid duplicate pending orders with the same normalized cart/email fingerprint.
- Pending payment attempts older than 24 hours are opportunistically marked failed/cancelled during checkout instead of remaining active forever.

### Admin authentication / CSRF / IDOR

- Every admin mutation route still verifies the authenticated Supabase user against `ADMIN_EMAILS`.
- Admin mutation routes require a same-origin browser `Origin` header.
- IDs are validated before database use where applicable.
- Login failures no longer reveal whether an email is or is not on the admin allowlist.
- Next.js Server Actions use their normal same-origin protection; the old hard-coded Codespaces `allowedOrigins` override was removed.

### Cloudinary

- Signing routes remain admin-only and rate-limited.
- Product/category API payloads only accept HTTPS `res.cloudinary.com` media for the configured Cloudinary account and Nikky Luxe folders.
- Generic media deletion is restricted to `nikky-luxe/products/` and `nikky-luxe/categories/`.
- Generic deletion refuses to delete media already referenced in the database. Persisted media is deleted only through its product/category route, where the public ID is read from the database.

### Checkout / payment

- Prices are still read and recalculated server-side; browser-supplied prices are never trusted.
- Product and variant availability is rechecked server-side.
- Checkout now validates body size, UUIDs, quantities, total quantity, field lengths, email/phone shape and maximum order value.
- Paystack callback URL must come from `NEXT_PUBLIC_SITE_URL`.
- Webhook HMAC-SHA512 verification and timing-safe comparison are preserved.
- A valid `charge.success` webhook is additionally verified against Paystack's Verify Transaction API before the order is marked paid.
- Payment status, currency, amount and customer email are checked against the server-side order.
- A Paystack transaction ID cannot be attached to two orders.
- Repeated webhook/callback processing is idempotent for an already-paid order.

### Input / error / browser hardening

- Explicit server-side length limits were added for checkout, category, product and variant text.
- Matching client-side `maxLength` attributes were added to the main forms for usability; server checks remain authoritative.
- Internal Supabase/Paystack errors are logged server-side rather than returned verbatim to public clients.
- Added CSP, HSTS in production, `nosniff`, frame protection, Referrer-Policy, Permissions-Policy, COOP/CORP, and removed the `X-Powered-By` header.
- Existing JSON-LD serialization continues escaping `<` before use in `dangerouslySetInnerHTML`.

## Delivery-fee wording

Public product/cart/checkout/confirmation messaging now makes the payment split explicit:

- Product total is paid online.
- **Delivery fee: Payable on delivery** is highlighted in green.
- Delivery is not included in the amount due online.

The admin order view also says the customer pays the delivery fee separately when the order is delivered.

## Post-migration test checklist

1. `npm install`
2. `npm run build`
3. Confirm normal admin login succeeds.
4. Confirm repeated invalid login attempts eventually show the temporary cooldown message.
5. Create/edit/delete a test category and product, including product variants and multiple images.
6. Confirm direct cross-origin POST/DELETE requests to admin APIs return `403`.
7. Confirm normal cart → checkout → Paystack payment → `/checkout/verify` succeeds.
8. Confirm Paystack `charge.success` webhook returns HTTP `200` and the order is marked Paid only once.
9. Confirm `/admin/orders` shows the correct order and status changes still persist.
10. Confirm cart/checkout show the green **Payable on delivery** message.
11. Inspect production response headers (example: `curl -I https://nikky-luxe.vercel.app/`) for CSP, HSTS, `nosniff`, Referrer-Policy and Permissions-Policy.
12. Keep `.env`, `.env.local`, service-role keys, Paystack secret and Cloudinary secret out of Git.

## Signed media format restrictions (2026-10-02)

Product uploads are restricted to JPG/JPEG, PNG, WEBP, MP4, MOV and WEBM. Collection uploads are restricted to JPG/JPEG, PNG and WEBP.

The browser performs an early MIME/extension check for usability, but this is not treated as the security boundary. The authenticated media-signing endpoints sign Cloudinary's `allowed_formats` parameter and return a fixed image/video resource type. The direct Cloudinary upload includes those exact signed parameters, so unsupported formats are rejected at Cloudinary even if browser-side validation is bypassed. The Cloudinary API secret remains server-only.
