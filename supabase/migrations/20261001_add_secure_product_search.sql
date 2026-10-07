-- Nikky Luxe secure public product search.
-- Run once in Supabase SQL Editor before deploying the search UI.

create or replace function public.search_products(
  p_query text,
  p_limit integer default 8,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  featured boolean,
  category_name text,
  image_url text,
  rank_score integer,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with params as (
    select lower(trim(coalesce(p_query, ''))) as term,
           least(greatest(coalesce(p_limit, 8), 1), 24) as safe_limit,
           least(greatest(coalesce(p_offset, 0), 0), 2376) as safe_offset
  ),
  matches as (
    select
      p.id,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.featured,
      c.name as category_name,
      coalesce(
        (
          select pm.url
          from public.product_media pm
          where pm.product_id = p.id and pm.media_type = 'image'
          order by pm.display_order asc, pm.created_at asc
          limit 1
        ),
        (
          select pvm.url
          from public.product_variants pv
          join public.product_variant_media pvm on pvm.variant_id = pv.id
          where pv.product_id = p.id and pv.available = true and pvm.media_type = 'image'
          order by pv.display_order asc, pvm.display_order asc, pvm.created_at asc
          limit 1
        )
      ) as image_url,
      case
        when lower(p.name) = params.term then 100
        when lower(p.name) like params.term || '%' then 80
        when position(params.term in lower(p.name)) > 0 then 60
        when position(params.term in lower(c.name)) > 0 then 45
        when position(params.term in lower(coalesce(p.variant_type, ''))) > 0 then 40
        when exists (
          select 1 from public.product_variants pv
          where pv.product_id = p.id
            and pv.available = true
            and position(params.term in lower(pv.name)) > 0
        ) then 35
        when position(params.term in lower(coalesce(p.description, ''))) > 0 then 20
        else 0
      end as rank_score,
      p.created_at
    from public.products p
    join public.categories c on c.id = p.category_id
    cross join params
    where p.available = true
      and char_length(params.term) between 2 and 80
      and (
        position(params.term in lower(p.name)) > 0
        or position(params.term in lower(coalesce(p.description, ''))) > 0
        or position(params.term in lower(c.name)) > 0
        or position(params.term in lower(coalesce(p.variant_type, ''))) > 0
        or exists (
          select 1 from public.product_variants pv
          where pv.product_id = p.id
            and pv.available = true
            and position(params.term in lower(pv.name)) > 0
        )
      )
  )
  select
    matches.id,
    matches.name,
    matches.slug,
    matches.description,
    matches.price,
    matches.featured,
    matches.category_name,
    matches.image_url,
    matches.rank_score,
    count(*) over() as total_count
  from matches
  cross join params
  order by matches.rank_score desc, matches.created_at desc, matches.name asc
  limit (select safe_limit from params)
  offset (select safe_offset from params);
$$;

revoke all on function public.search_products(text, integer, integer) from public;
grant execute on function public.search_products(text, integer, integer) to anon;
grant execute on function public.search_products(text, integer, integer) to authenticated;
