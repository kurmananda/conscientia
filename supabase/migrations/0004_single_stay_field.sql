-- Migration: single stay field (code-only change, no destructive SQL)
-- Run this manually in the Supabase SQL editor, after 0003_room_building_and_logout.sql.

-- The admin UI now uses a single free-text field for room/building assignment
-- (accommodation_room, e.g. "Block A · Room 204") instead of two separate
-- inputs. accommodation_building is intentionally left in place — it may
-- already be live in some deployments — but the app no longer reads or
-- writes it going forward. No column drop here; this file exists only to
-- document the change and keep the migration sequence numbered.
comment on column profiles.accommodation_building is
  'Deprecated: no longer written by the app. Use accommodation_room for the combined "Block A · Room 204" style value.';
