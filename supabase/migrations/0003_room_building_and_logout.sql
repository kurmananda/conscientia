-- Migration: room/building assignment + admin login/logout audit
-- Run this manually in the Supabase SQL editor, after 0002_admin_password_and_address.sql.

-- Profiles: room/building assignment, filled in by admins during accommodation
-- check-in setup. accommodation_booked is kept as-is (simple flag / backward
-- compat); building+room are the actual assignment detail.
alter table profiles
  add column if not exists accommodation_building text,
  add column if not exists accommodation_room text;

-- admin_logs.action already accepts arbitrary text ('update_profile' so far);
-- 'login' and 'logout' rows are now also inserted from
-- /api/admin/login and /api/admin/logout respectively. No schema change
-- needed for admin_logs itself — this comment documents the new action values.
