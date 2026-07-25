-- Migration: admin password + profile address
-- Run this manually in the Supabase SQL editor, after 0001_admin_and_stay_fields.sql.

-- Admins: password hash (sha256 hex, no salt/secret — hashed server-side in
-- /api/admin/login). Existing rows will have password = null until an admin
-- sets one manually (update admins set password = '<sha256 hex>' where callsign = '...').
alter table admins add column if not exists password text;

-- Profiles: freeform address, used to prefill the merch delivery form.
alter table profiles add column if not exists address text;
