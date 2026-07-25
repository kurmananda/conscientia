-- Migration: admin portal + accommodation/merch fields
-- Run this manually in the Supabase SQL editor. Not applied automatically —
-- this repo has no migration tooling wired up.

-- Profiles: admin-only-writable fields (enforced in API layer via service-role
-- key, not RLS, consistent with existing _supabase-server.js usage).
alter table profiles
  add column if not exists accommodation_booked boolean default false,
  add column if not exists accommodation_checkin timestamptz,
  add column if not exists accommodation_checkout timestamptz,
  add column if not exists merch_selection text;

-- Admins: rows inserted manually by the user. callsign is the codeword used
-- to log into /admin (e.g. "FALCON-1"). No passwords/usernames.
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  callsign text unique not null,
  name text,
  role text,
  created_at timestamptz default now()
);

-- Admin action log: every admin write to a profile appends a row here.
create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_callsign text,
  admin_name text,
  action text,
  target_user_id text,
  target_email text,
  changes jsonb,
  created_at timestamptz default now()
);
