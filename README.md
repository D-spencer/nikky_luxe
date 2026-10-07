# Nikky Luxe

Full-stack Next.js catalogue website for **Nikky Luxe**, with a simple owner-friendly admin dashboard.

## Stack

- Next.js + TypeScript
- Supabase PostgreSQL + Auth
- Cloudinary for product images/videos
- Custom responsive CSS
- WhatsApp ordering

## Features

### Public site
- Responsive luxury homepage
- SEO metadata
- Category pages
- Product detail pages
- Featured products + newest products
- Cloudinary image/video display
- WhatsApp ordering links

### Admin
- Protected `/admin` login
- Admin email allowlist
- Dashboard metrics
- Add/edit/delete products
- Upload multiple images or videos
- Feature/unfeature products
- Show/hide product availability
- Add/edit/delete categories

## 1. Install

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill the values.

## 2. Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In **Authentication → Users**, create the owner/admin user with email + password.
4. Put that same email in `ADMIN_EMAILS` in `.env.local`.
5. Add your Supabase URL, anon key and service-role key to `.env.local`.

> Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code or commit it to Git.

## 3. Cloudinary setup

1. Create a Cloudinary account.
2. Copy the Cloud Name, API Key and API Secret from the Cloudinary dashboard.
3. Add them to `.env.local`.

Uploads are sent through authenticated Next.js server routes, so the Cloudinary API secret never reaches the browser.

## 4. Run locally

```bash
npm run dev
```

Open:
- Website: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`

## 5. Deploy

Recommended: Vercel.

Add every variable from `.env.example` to the Vercel project environment, change `NEXT_PUBLIC_SITE_URL` to the real production domain, then deploy.

## Important notes

- The project intentionally contains no real secret keys.
- Products are empty at first; the supplied category seed is created by `schema.sql`.
- The admin can upload product images/videos without handling URLs manually.
- Product images/videos live in Cloudinary; Supabase stores their URLs and Cloudinary `public_id` values.

## Included references

The uploaded original HTML prototype and brand flyer are kept in `reference/` for design reference. The new application uses the **Nikky Luxe** brand name throughout the implemented site.

## Optional collection images

Categories can optionally have a Cloudinary-backed collection image. Categories without an image keep the original Nikky Luxe card design.

For an existing Supabase project, run this migration once in the Supabase SQL Editor before using category image uploads:

```sql
alter table public.categories
  add column if not exists image_url text,
  add column if not exists image_public_id text;
```

The same migration is available at `supabase/migrations/20260927_add_category_images.sql`.

## Online checkout and Paystack

The storefront now includes a guest cart/checkout flow and an admin Orders section.

1. Run `supabase/migrations/20260929_add_orders_and_payments.sql` in the Supabase SQL Editor.
2. Add `PAYSTACK_SECRET_KEY` to `.env.local` for local testing and to Vercel Environment Variables for deployment. Use a Paystack test secret key first.
3. Keep `NEXT_PUBLIC_SITE_URL` set to the deployed site URL in production.
4. In the Paystack dashboard, set the webhook URL to `https://YOUR-DOMAIN/api/paystack/webhook`.
5. Test a payment in Paystack test mode before switching to live keys.

The checkout total contains product/variant prices only. Delivery is collected as customer address information but no delivery charge is added to the online payment.

## Security hardening migration (30 Sep 2026)

Before deploying the hardened checkout/admin version, run `supabase/migrations/20260930_security_hardening.sql` in Supabase SQL Editor. See `SECURITY_HARDENING.md` for the complete deployment and verification checklist.
