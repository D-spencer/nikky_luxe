-- Nikky Luxe security hardening: persistent rate limiting, checkout deduplication,
-- and payment idempotency. Run once in Supabase SQL Editor before deploying.

create table if not exists public.security_rate_limits (
  bucket text not null,
  identifier_hash text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  primary key (bucket, identifier_hash)
);

create index if not exists idx_security_rate_limits_window on public.security_rate_limits(window_started_at);

alter table public.security_rate_limits enable row level security;
-- Deliberately no anon/authenticated policies. Only the service-role backend accesses this table.

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.security_rate_limits%rowtype;
  v_now timestamptz := clock_timestamp();
  v_window interval;
begin
  if p_limit < 1 or p_window_seconds < 1 or length(p_bucket) > 100 or length(p_identifier_hash) > 128 then
    raise exception 'invalid rate limit parameters';
  end if;

  v_window := make_interval(secs => p_window_seconds);

  insert into public.security_rate_limits(bucket, identifier_hash, window_started_at, request_count)
  values (p_bucket, p_identifier_hash, v_now, 0)
  on conflict (bucket, identifier_hash) do nothing;

  select * into v_row
  from public.security_rate_limits
  where bucket = p_bucket and identifier_hash = p_identifier_hash
  for update;

  if v_row.window_started_at + v_window <= v_now then
    update public.security_rate_limits
    set window_started_at = v_now, request_count = 1
    where bucket = p_bucket and identifier_hash = p_identifier_hash;

    return query select true, greatest(p_limit - 1, 0), p_window_seconds;
    return;
  end if;

  if v_row.request_count >= p_limit then
    return query select false, 0,
      greatest(1, ceil(extract(epoch from ((v_row.window_started_at + v_window) - v_now)))::integer);
    return;
  end if;

  update public.security_rate_limits
  set request_count = request_count + 1
  where bucket = p_bucket and identifier_hash = p_identifier_hash;

  return query select true, greatest(p_limit - (v_row.request_count + 1), 0),
    greatest(1, ceil(extract(epoch from ((v_row.window_started_at + v_window) - v_now)))::integer);
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from anon;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

alter table public.orders add column if not exists checkout_fingerprint text;
create index if not exists idx_orders_checkout_fingerprint_created
  on public.orders(checkout_fingerprint, created_at desc)
  where checkout_fingerprint is not null;

-- A Paystack transaction ID must never be attached to two different orders.
create unique index if not exists idx_orders_paystack_transaction_unique
  on public.orders(paystack_transaction_id)
  where paystack_transaction_id is not null;

-- Old abandoned pending orders are retained for audit/history but marked failed/cancelled.
create index if not exists idx_orders_pending_cleanup
  on public.orders(created_at)
  where payment_status = 'pending' and order_status = 'pending_payment';
