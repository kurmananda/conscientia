-- Admin-editable overrides layered on top of the static workshop/event
-- catalog (src/app/workshop/workshopData.js, src/app/events/eventsData.js).
-- A row here overrides the matching field on the static base item with the
-- same id; null/absent columns fall back to the static value. This lets
-- admins edit catalog content without a full data migration, while id,
-- price, and ticket-id derivation (src/lib/ticketCatalog.js) stay fixed to
-- the static catalog and are never editable here.
create table if not exists public.catalog_overrides (
  id text primary key,
  kind text not null check (kind in ('workshop', 'event')),

  title text,
  subtitle text,
  type text,
  section text,
  section_color text,
  duration integer,
  seats integer,
  eligibility text,
  venue text,
  timing text,
  image text,
  badge_icon text,
  accent_color text,
  glow_color text,
  foil_gradient text,
  description text,
  about_extra jsonb,
  highlights jsonb,
  requirements jsonb,
  format text,
  certificate text,
  tags jsonb,
  brochure_url text,
  layout jsonb,

  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.catalog_overrides enable row level security;

create policy "Public can view catalog overrides"
  on public.catalog_overrides for select
  using (true);

-- No insert/update/delete policy for anon/authenticated: writes only happen
-- server-side via the service-role key in /api/admin/catalog routes.
