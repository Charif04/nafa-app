-- ============================================================
-- Decrement product stock on order item insert
--
-- Problem: createOrder() inserts into order_items but never
-- decrements products.stock, so stock never goes down no matter
-- how many orders are placed.
--
-- Fix: trigger fires AFTER INSERT on order_items and decrements
-- the referenced product's stock. Uses GREATEST(0, stock - qty)
-- so the stock can never go negative (avoids the CHECK constraint
-- violation). SECURITY DEFINER bypasses the products RLS update
-- policy (only vendors can update their own products).
-- ============================================================

create or replace function decrement_product_stock()
returns trigger language plpgsql security definer as $$
begin
  if new.product_id is not null then
    update products
    set stock = greatest(0, stock - new.quantity)
    where id = new.product_id;
  end if;
  return new;
end;
$$;

-- Drop first so this migration is re-runnable
drop trigger if exists order_item_decrement_stock on order_items;

create trigger order_item_decrement_stock
  after insert on order_items
  for each row execute procedure decrement_product_stock();
