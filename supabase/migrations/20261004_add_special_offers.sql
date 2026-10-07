
alter table public.products add column if not exists offer_price numeric(12,2);
alter table public.products add column if not exists on_offer boolean not null default false;
alter table public.products add column if not exists offer_starts_at timestamptz;
alter table public.products add column if not exists offer_ends_at timestamptz;
alter table public.products drop constraint if exists products_offer_price_check;
alter table public.products add constraint products_offer_price_check check (offer_price is null or offer_price >= 0);
create index if not exists idx_products_active_offers on public.products(on_offer, offer_ends_at) where on_offer = true;
