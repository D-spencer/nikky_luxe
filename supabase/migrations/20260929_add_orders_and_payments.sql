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
create index if not exists idx_orders_payment_reference on public.orders(payment_reference);
create index if not exists idx_order_items_order on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- No public policies are created for orders or order_items.
-- Customer checkout and admin order management use trusted server-side routes only.
