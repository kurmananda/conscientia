-- Prize pool is a free-form display string (e.g. "₹50,000") shown
-- prominently on catalog cards and detail pages, not a numeric amount to
-- compute with — same convention as other display-only text fields.
alter table public.catalog_items
  add column if not exists prize_pool text;
