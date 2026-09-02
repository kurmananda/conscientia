-- Splits what used to be one combined "timing" free-text field (e.g. "12
-- Mar, 4:00 PM") into a dedicated date column and a time-only `timing`,
-- so the two can be styled/shown independently everywhere instead of as
-- one string an admin had to format by hand.
alter table public.catalog_items
  add column if not exists event_date text;
