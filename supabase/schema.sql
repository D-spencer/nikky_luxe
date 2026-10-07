create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  image_public_id text,
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

alter table public.products add column if not exists variant_type text;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(12,2),
  available boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variant_media (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  url text not null,
  public_id text not null,
  media_type text not null check (media_type in ('image','video')),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_variants_product on public.product_variants(product_id);
create index if not exists idx_product_variant_media_variant on public.product_variant_media(variant_id);

alter table public.product_variants enable row level security;
alter table public.product_variant_media enable row level security;

drop policy if exists "Public can read variants for available products" on public.product_variants;
create policy "Public can read variants for available products" on public.product_variants for select using (
  exists (select 1 from public.products p where p.id = product_id and p.available = true)
);

drop policy if exists "Public can read variant media for available products" on public.product_variant_media;
create policy "Public can read variant media for available products" on public.product_variant_media for select using (
  exists (select 1 from public.product_variants v join public.products p on p.id = v.product_id where v.id = variant_id and p.available = true)
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

-- Orders and secure online payments
create sequence if not exists public.order_number_seq start 1;
create or replace function public.generate_order_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'NL-' || to_char(current_date, 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 3, '0');
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.generate_order_number(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text not null,
  delivery_city text not null,
  delivery_state text not null,
  customer_notes text,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  total numeric(12,2) not null check (total >= 0),
  currency text not null default 'NGN',
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  order_status text not null default 'pending_payment' check (order_status in ('pending_payment','paid','processing','shipped','delivered','cancelled')),
  payment_reference text unique,
  paystack_transaction_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_type text,
  variant_name text,
  product_image_url text,
  quantity integer not null check (quantity > 0 and quantity <= 20),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_order_status on public.orders(order_status);
create index if not exists idx_order_items_order on public.order_items(order_id);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;


-- Special offers
-- Effshorl Kiddies World special-offer support.
alter table public.products add column if not exists offer_price numeric(12,2);
alter table public.products add column if not exists on_offer boolean not null default false;
alter table public.products add column if not exists offer_starts_at timestamptz;
alter table public.products add column if not exists offer_ends_at timestamptz;
alter table public.products drop constraint if exists products_offer_price_check;
alter table public.products add constraint products_offer_price_check check (offer_price is null or offer_price >= 0);
create index if not exists idx_products_active_offers on public.products(on_offer, offer_ends_at) where on_offer = true;
