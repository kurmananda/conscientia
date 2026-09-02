-- The admin catalog editor's per-field "skip" toggle used to only mean
-- "don't overwrite this field on save" — it never affected what the public
-- site actually shows, since it lived purely in the browser's localStorage.
-- This makes skip do what admins actually expect: a skipped field is hidden
-- from the public events/workshop detail page entirely, not just left
-- alone in the DB. The admin UI now saves its current skip selection here
-- on every save; catalogStore.js reads it back and strips those fields
-- before a card ever reaches the public site.
alter table public.catalog_items
  add column if not exists hidden_fields jsonb not null default '[]'::jsonb;
  