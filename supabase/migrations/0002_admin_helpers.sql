-- Admin console helpers.

-- Deleting a promo code keeps the orders that used it.
alter table public.orders drop constraint orders_promo_code_id_fkey;
alter table public.orders
  add constraint orders_promo_code_id_fkey foreign key (promo_code_id)
  references public.promo_codes (id) on delete set null;

-- Atomic stock change plus its audit row.
create or replace function public.adjust_stock(
  p_material_id uuid,
  p_change numeric,
  p_reason text,
  p_note text default null,
  p_order_id uuid default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock numeric;
begin
  update public.materials
    set stock_m = greatest(stock_m + p_change, 0)
    where id = p_material_id
    returning stock_m into v_stock;
  if not found then
    raise exception 'material % not found', p_material_id;
  end if;
  insert into public.stock_movements (material_id, change_m, reason, order_id, note)
    values (p_material_id, p_change, p_reason, p_order_id, p_note);
  return v_stock;
end;
$$;

revoke execute on function public.adjust_stock(uuid, numeric, text, text, uuid) from public, anon, authenticated;

-- Notes on status changes come from the admin console.
create or replace function public.log_order_status()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_events (order_id, status, note)
      values (new.id, new.status, current_setting('hamilton.status_note', true));
  end if;
  return new;
end;
$$;

create or replace function public.set_order_status(p_order_id uuid, p_status public.order_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('hamilton.status_note', coalesce(p_note, ''), true);
  update public.orders set status = p_status where id = p_order_id;
  if not found then
    raise exception 'order % not found', p_order_id;
  end if;
end;
$$;

revoke execute on function public.set_order_status(uuid, public.order_status, text) from public, anon, authenticated;
