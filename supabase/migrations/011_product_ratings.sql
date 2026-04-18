-- Migration 011 — product-level ratings
-- Adds product_id to reviews + trigger to keep products.rating / review_count fresh

-- 1. Add product_id column (nullable — vendor-to-client reviews have no product)
alter table reviews
  add column product_id uuid references products(id) on delete set null;

-- 2. Drop the old unique constraint (was per order+type, not per product)
alter table reviews
  drop constraint if exists reviews_from_user_id_order_id_type_key;

-- 3. One review per product per order (client → vendor)
create unique index reviews_product_unique
  on reviews (from_user_id, order_id, product_id)
  where product_id is not null;

-- 4. One vendor-to-client review per order (no product)
create unique index reviews_vendor_unique
  on reviews (from_user_id, order_id, type)
  where product_id is null;

-- 5. Index for fast per-product lookup
create index on reviews (product_id) where product_id is not null;

-- 6. Trigger: keep products.rating and products.review_count in sync
create or replace function update_product_rating()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  -- Determine which product_id to recalculate
  if TG_OP = 'DELETE' then
    target_id := old.product_id;
  else
    target_id := new.product_id;
  end if;

  if target_id is null then
    return coalesce(new, old);
  end if;

  update products
  set
    rating       = coalesce((
      select avg(rating)::numeric(3,2)
      from reviews
      where product_id = target_id
        and type = 'client_to_vendor'
    ), 0),
    review_count = (
      select count(*)::int
      from reviews
      where product_id = target_id
        and type = 'client_to_vendor'
    )
  where id = target_id;

  return coalesce(new, old);
end;
$$;

create trigger trg_update_product_rating
after insert or update or delete on reviews
for each row execute function update_product_rating();
