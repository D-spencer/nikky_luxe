alter table public.categories
  add column if not exists image_url text,
  add column if not exists image_public_id text;
