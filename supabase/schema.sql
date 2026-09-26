create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2),
  featured boolean not null default false,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  public_id text not null,
  media_type text not null check (media_type in ('image','video')),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_featured on public.products(featured) where featured = true;
create index if not exists idx_product_media_product on public.product_media(product_id);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;

create policy "Public can read categories" on public.categories for select using (true);
create policy "Public can read available products" on public.products for select using (available = true);
create policy "Public can read media for available products" on public.product_media for select using (
  exists (select 1 from public.products p where p.id = product_id and p.available = true)
);

insert into public.categories (name, slug, description, display_order) values
  ('Bangles', 'bangles', 'Classic, designer and statement bangles.', 1),
  ('Bracelets', 'bracelets', 'Tennis, charm and luxury bracelets.', 2),
  ('Necklaces', 'necklaces', 'Pendant, chain and statement necklaces.', 3),
  ('Wristwatches', 'wristwatches', 'Luxury, fashion and unisex watches.', 4),
  ('Sunglasses', 'sunglasses', 'Designer shades and luxury frames.', 5),
  ('Luxury Chains', 'luxury-chains', 'Gold, silver and Cuban-style chains.', 6),
  ('Unisex Wristbands', 'unisex-wristbands', 'Leather, beaded and designer wristbands.', 7)
on conflict (slug) do nothing;
