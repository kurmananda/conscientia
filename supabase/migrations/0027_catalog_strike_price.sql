-- Marketing-only "fake" original price shown struck through next to the
-- real price on event/workshop cards, to make the real price look like a
-- discount. Purely cosmetic — never used for actual billing/checkout, which
-- always reads the real price from `tickets.cost`.
alter table catalog_items
  add column if not exists strike_price text;
