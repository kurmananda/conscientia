-- Migration: single accommodation room/building text field
-- Run this manually in the Supabase SQL editor, after 0002_admin_password_and_address.sql.
-- You can SKIP 0003_room_building_and_logout.sql and 0004_single_stay_field.sql
-- entirely — this migration supersedes both of them with just the one column
-- the app actually uses today.

-- Profiles: a single free-text field admins fill in once accommodation is
-- booked, e.g. "Block A · Room 204". No separate building/room columns.
alter table profiles
  add column if not exists accommodation_room text;

-- admin_logs.action already accepts arbitrary text ('update_profile' so far);
-- 'login' and 'logout' rows are also inserted from /api/admin/login and
-- /api/admin/logout respectively. No schema change needed for admin_logs
-- itself — this comment documents the new action values (this part of what
-- 0003 covered, minus the building/room split).
