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
