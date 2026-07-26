-- Splits the payment-critical identity of a catalog item (its id, price,
-- and TiQR ticket id) out of catalog_overrides into its own table. This is
-- the only place price/ticket id are ever written from — the admin content
-- editor (catalog_overrides) never touches them. Previously every workshop
-- shared one hardcoded "default" ticket id and every event shared another
-- (see src/lib/ticketCatalog.js DEFAULT_WORKSHOP_TICKET/DEFAULT_EVENT_TICKET);
-- this table gives each item its own explicit row instead, seeded from that
-- same placeholder value so nothing changes behaviorally until an admin
-- assigns a real per-item ticket.
create table if not exists public.catalog_identity (
  id text primary key,
  kind text not null check (kind in ('workshop', 'event')),
  price text not null,
  ticket_id integer not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.catalog_identity enable row level security;

create policy "Public can view catalog identity"
  on public.catalog_identity for select
  using (true);

-- No insert/update/delete policy for anon/authenticated: writes only happen
-- server-side via the service-role key in /api/admin/catalog/identity.

insert into public.catalog_identity (id, kind, price, ticket_id) values
  ('rocket', 'workshop', '₹2,499', 3043),
  ('ai-ml', 'workshop', '₹3,999', 3043),
  ('cybersec', 'workshop', '₹3,499', 3043),
  ('robotics', 'workshop', '₹4,499', 3043),
  ('quantum', 'workshop', '₹5,999', 3043),
  ('data-science', 'workshop', '₹3,199', 3043),
  ('cloud', 'workshop', '₹3,699', 3043),
  ('aerospace', 'workshop', '₹3,799', 3043),
  ('blockchain', 'workshop', '₹3,299', 3043),
  ('iot', 'workshop', '₹2,999', 3043),
  ('biotech', 'workshop', '₹4,799', 3043),
  ('code-combat', 'event', 'Free Entry', 3047),
  ('hackathon', 'event', 'Free Entry', 3047),
  ('robo-war', 'event', '₹999', 3047),
  ('tech-talks', 'event', 'Free Entry', 3047),
  ('innovation-expo', 'event', 'Free Entry', 3047),
  ('cultural-night', 'event', 'Free Entry', 3047)
on conflict (id) do nothing;
