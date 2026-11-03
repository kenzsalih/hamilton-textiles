-- Hamilton Textiles — initial schema
-- Money is stored as integer fils (1 BHD = 1000 fils). Lengths are numeric metres.

create extension if not exists "pgcrypto";

-- ─── Owner access ────────────────────────────────────────────────────────
-- Only users listed here can use the admin console. Add the owner's auth
-- user id after creating their account in Supabase Auth.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ─── Catalogue ───────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  description_en text,
  description_ar text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create type public.fabric_pattern as enum
  ('plain', 'crepe', 'twill', 'satin', 'linen', 'stripe', 'floral', 'lace', 'chiffon');

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  category_id uuid not null references public.categories (id) on delete restrict,
  name_en text not null,
  name_ar text not null,
  description_en text,
  description_ar text,
  composition text,                       -- e.g. "100% Cotton"
  width_cm int,
  weight_gsm int,
  colour_name_en text,
  colour_name_ar text,
  colour_hex text check (colour_hex ~ '^#[0-9a-fA-F]{6}$'),
  pattern public.fabric_pattern not null default 'plain',
  occasions text[] not null default '{}', -- abaya, thobe, eid, wedding, everyday …
  price_fils int not null check (price_fils > 0),        -- per metre
  compare_at_fils int check (compare_at_fils is null or compare_at_fils > price_fils),
  stock_m numeric(10, 2) not null default 0 check (stock_m >= 0),
  low_stock_m numeric(10, 2) not null default 10,
  min_order_m numeric(5, 2) not null default 0.5,
  step_m numeric(5, 2) not null default 0.5,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index materials_category_idx on public.materials (category_id) where is_active;
create index materials_featured_idx on public.materials (is_featured) where is_active;

create table public.material_images (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  url text not null,
  alt_en text,
  alt_ar text,
  sort_order int not null default 0
);

create index material_images_material_idx on public.material_images (material_id, sort_order);

-- ─── Customers & orders ──────────────────────────────────────────────────
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text not null,
  country text not null default 'BH',
  notes text,
  created_at timestamptz not null default now(),
  unique (phone)
);

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  kind text not null check (kind in ('percent', 'fixed')),
  value int not null check (value > 0),   -- percent (1–100) or fils
  min_order_fils int not null default 0,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);

create type public.order_status as enum
  ('pending_payment', 'paid', 'packed', 'shipped', 'ready_for_pickup', 'delivered', 'cancelled', 'refunded');

create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('HT-' || nextval('public.order_number_seq')),
  customer_id uuid not null references public.customers (id),
  status public.order_status not null default 'pending_payment',
  fulfilment text not null check (fulfilment in ('delivery', 'pickup')),
  shipping_address jsonb,                 -- { line1, line2, block, road, city, country, postcode }
  subtotal_fils int not null,
  discount_fils int not null default 0,
  shipping_fils int not null default 0,
  vat_fils int not null default 0,
  total_fils int not null,
  promo_code_id uuid references public.promo_codes (id),
  display_currency text not null default 'BHD',
  locale text not null default 'en',
  payment_provider text,                  -- tap
  payment_method text,                    -- benefitpay | card
  payment_ref text,
  customer_note text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_idx on public.orders (status, created_at desc);
create index orders_customer_idx on public.orders (customer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  -- Snapshot so history survives later edits or deletion of the material.
  name_en text not null,
  name_ar text not null,
  sku text not null,
  price_fils int not null,
  metres numeric(6, 2) not null check (metres > 0),
  line_total_fils int not null
);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id bigint generated always as identity primary key,
  material_id uuid not null references public.materials (id) on delete cascade,
  change_m numeric(10, 2) not null,
  reason text not null check (reason in ('order', 'restock', 'adjustment', 'cancellation')),
  order_id uuid references public.orders (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- ─── Triggers ────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger materials_touch before update on public.materials
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create or replace function public.log_order_status()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_events (order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

create trigger orders_status_log after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- Called by the payment webhook. Marks the order paid, takes the stock and
-- counts the promo use in one transaction; safe to call twice.
create or replace function public.mark_order_paid(p_order_id uuid, p_payment_ref text, p_method text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order % not found', p_order_id;
  end if;
  if v_order.status <> 'pending_payment' then
    return;
  end if;

  for v_item in select material_id, metres from public.order_items where order_id = p_order_id and material_id is not null loop
    update public.materials set stock_m = greatest(stock_m - v_item.metres, 0) where id = v_item.material_id;
    insert into public.stock_movements (material_id, change_m, reason, order_id)
      values (v_item.material_id, -v_item.metres, 'order', p_order_id);
  end loop;

  if v_order.promo_code_id is not null then
    update public.promo_codes set used_count = used_count + 1 where id = v_order.promo_code_id;
  end if;

  update public.orders
    set status = 'paid', paid_at = now(), payment_ref = p_payment_ref, payment_method = p_method
    where id = p_order_id;
end;
$$;

revoke execute on function public.mark_order_paid(uuid, text, text) from public, anon, authenticated;

-- ─── Row level security ──────────────────────────────────────────────────
-- Shoppers read the active catalogue. Checkout and order tracking go through
-- server routes using the service role, so no public write access exists.
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.materials enable row level security;
alter table public.material_images enable row level security;
alter table public.customers enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.stock_movements enable row level security;

create policy "public reads active categories" on public.categories
  for select using (is_active or public.is_admin());
create policy "public reads active materials" on public.materials
  for select using (is_active or public.is_admin());
create policy "public reads images of active materials" on public.material_images
  for select using (
    public.is_admin()
    or exists (select 1 from public.materials m where m.id = material_id and m.is_active)
  );

create policy "admin manages categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages materials" on public.materials for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages images" on public.material_images for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages customers" on public.customers for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages promo codes" on public.promo_codes for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin reads order events" on public.order_events for select using (public.is_admin());
create policy "admin manages stock movements" on public.stock_movements for all using (public.is_admin()) with check (public.is_admin());
create policy "admin reads admins" on public.admins for select using (public.is_admin());

-- ─── Storage ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('materials', 'materials', true)
  on conflict (id) do nothing;

create policy "public reads material photos" on storage.objects
  for select using (bucket_id = 'materials');
create policy "admin uploads material photos" on storage.objects
  for insert with check (bucket_id = 'materials' and public.is_admin());
create policy "admin updates material photos" on storage.objects
  for update using (bucket_id = 'materials' and public.is_admin());
create policy "admin deletes material photos" on storage.objects
  for delete using (bucket_id = 'materials' and public.is_admin());
