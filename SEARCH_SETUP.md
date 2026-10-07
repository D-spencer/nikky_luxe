# Nikky Luxe secure search setup

The storefront search covers available product names, descriptions, collections/categories, and available variant names.

## 1. Run the migration

In Supabase SQL Editor, run:

`supabase/migrations/20261001_add_secure_product_search.sql`

The search function is `security invoker`, so Supabase RLS remains active. It explicitly searches available products only, accepts the search term as a database function parameter, treats `%` and `_` as ordinary characters rather than SQL wildcards, and caps limit/offset values inside PostgreSQL.

## 2. Security controls

- `/api/search` accepts GET only.
- Search terms must be 2–80 characters and control characters are rejected.
- The endpoint is limited to 60 requests per IP per 60 seconds using the existing persistent Supabase rate limiter.
- Live suggestions are capped at 8 results.
- Full search results are capped at 24 results per page and 100 pages.
- The public/anon Supabase client performs the search; the service-role client is used only by the existing server-side rate limiter.
- Only public product fields are returned. Admin, order and payment data are never queried.
- Search errors are logged server-side while the browser receives a generic message.
- React renders search text as text, not raw HTML.
- Search result images use the existing Cloudinary delivery optimization (160 px suggestions, 600 px result cards).
- Search pages are marked `noindex, follow` to avoid indexing arbitrary query URLs.

## 3. Usage controls

Live search waits 350 ms after typing before requesting suggestions. This avoids sending one request for every keystroke and reduces unnecessary Supabase/Vercel usage.

## 4. Verification

After the migration is applied:

```bash
npm run build
npm audit
npm run dev
```

Test normal product-name, description, category and variant searches. Also verify that unavailable products do not appear and that rapid repeated requests eventually return HTTP 429.
