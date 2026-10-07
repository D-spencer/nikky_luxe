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
