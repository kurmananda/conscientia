-- Recreates the `registrations` table from scratch — it was accidentally
-- dropped. Run this manually in the Supabase SQL editor. This reconstructs
-- every column actually read/written by the app, gathered from:
--   src/app/api/tiqr/webhook/route.js        (payment webhook upsert)
--   src/app/api/save-registration/route.js   (manual save-after-payment upsert)
--   src/app/api/get-registrations/route.js   (profile page registration lookup)
--   src/app/api/registration-by-tiqr/route.js
--   src/app/api/admin/registrations/route.js
--   src/app/api/admin/users/route.js         (admin dashboard join)
--   src/app/online-workshops/page.jsx        (returning-user prefill lookup)
--   supabase_registrations_user_link.sql     (pre-existing user_id + RLS setup)
--
-- Safe to run once; re-running is a no-op thanks to `if not exists` guards.

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users(id),
  workshop_ids text[] not null default '{}',
  details jsonb not null default '{}'::jsonb,
  payment_id text,
  order_id text,
  amount numeric default 0,
  status text,
  payment_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every upsert in the app targets `onConflict: 'email'` (the plain column),
-- so the unique constraint must be a real column constraint — an expression
-- index like `lower(email)` doesn't satisfy Postgres's ON CONFLICT matching
-- and raises "42P10: no unique or exclusion constraint matching the ON
-- CONFLICT specification".
drop index if exists registrations_email_key;
alter table public.registrations
  drop constraint if exists registrations_email_key;
alter table public.registrations
  add constraint registrations_email_key unique (email);

create index if not exists registrations_user_id_idx on public.registrations (user_id);

-- Service-role API routes (webhook, save-registration, admin/*) bypass RLS
-- entirely via SUPABASE_SERVICE_ROLE_KEY in src/app/api/_supabase-server.js.
-- src/app/online-workshops/page.jsx, however, queries this table directly
-- from the browser with the anon key, looking up a registration by email —
-- often before the visitor has any authenticated session at all (some
-- registrants only ever go through the guest/email-based flow). A policy
-- restricted to auth.uid() = user_id would silently return nothing for
-- that lookup and break the returning-visitor prefill, so this stays a
-- public-read policy, matching the app's actual existing behavior.
alter table public.registrations enable row level security;

drop policy if exists "Users can view own registrations" on public.registrations;
drop policy if exists "Public can view registrations by email" on public.registrations;
create policy "Public can view registrations by email"
  on public.registrations for select
  using (true);
