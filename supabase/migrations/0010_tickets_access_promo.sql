-- Splits payment identity (id / type / cost / ticket_id) fully out of
-- catalog_items into its own `tickets` table. This is the ONLY place price
-- and ticket id live now, and it is intentionally never written to from the
-- admin portal — an admin adds a new workshop/event by inserting a row
-- directly into this table (id, type, cost, ticket_id); the catalog then
-- shows that item with empty content fields for the admin to fill in via
-- the portal. Food/merch/accommodation addon ticket ids are recorded here
-- too (type = 'addon') for a single source of truth, alongside workshops
-- and events.
create table if not exists public.tickets (
  id text primary key,
  type text not null check (type in ('workshop', 'event', 'addon')),
  cost text,
  ticket_id integer,
  created_at timestamptz not null default now()
);

alter table public.tickets enable row level security;

drop policy if exists "Public can view tickets" on public.tickets;
create policy "Public can view tickets"
  on public.tickets for select
  using (true);

-- No insert/update/delete policy for anon/authenticated — this table is
-- managed directly in the database, not through the app.

-- Guarded: safe to re-run even after a previous run already dropped
-- catalog_items.price/ticket_id below.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'price'
  ) then
    insert into public.tickets (id, type, cost, ticket_id)
    select id, kind, price, ticket_id from public.catalog_items
    on conflict (id) do nothing;
  end if;
end $$;

insert into public.tickets (id, type, cost, ticket_id) values
  ('accommodation', 'addon', null, 3047),
  ('breakfast', 'addon', null, 3047),
  ('lunch', 'addon', null, 3047),
  ('dinner', 'addon', null, 3047),
  ('delivery', 'addon', null, 3042),
  ('merch-tshirt', 'addon', null, 3042),
  ('merch-hoodie', 'addon', null, 3042),
  ('merch-cap', 'addon', null, 3042),
  ('merch-tote', 'addon', null, 3042)
on conflict (id) do nothing;

alter table public.catalog_items drop column if exists price;
alter table public.catalog_items drop column if exists ticket_id;

-- Coordinator access list: CNS-ids (profiles.unique_code) allowed to view
-- this item's registrants on /data. Never shown publicly, and never part of
-- the general content-editor payload accidentally — it's its own field.
alter table public.catalog_items add column if not exists access text[] not null default '{}';

-- Single-row config for the "Limited Drop" / "Exclusive" merch promo shown
-- on the homepage, the floating notification, and the online-workshops
-- registration flow. Previously hardcoded independently in three places.
create table if not exists public.promo_settings (
  id text primary key default 'default',
  badge_label text not null default 'Limited drop',
  heading text not null default 'Get official Space Merch',
  description text not null default 'Hoodie-style kit for Conscientia 2026 — limited run, ships to your door.',
  price text not null default '₹599',
  link text not null default '/online-workshops',
  image_front text not null default '/assets/wsfront.png',
  image_back text not null default '/assets/wsback.png',
  accent_color text not null default '#33d6ff',
  secondary_color text not null default '#a855f7',
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.promo_settings enable row level security;

drop policy if exists "Public can view promo settings" on public.promo_settings;
create policy "Public can view promo settings"
  on public.promo_settings for select
  using (true);

insert into public.promo_settings (id) values ('default')
on conflict (id) do nothing;
