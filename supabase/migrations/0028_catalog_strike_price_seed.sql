-- Seeds a random "fake original price" (30%-80% above the real price,
-- rounded to the nearest ₹50) for every existing event/workshop that
-- doesn't have one set yet. Marketing-only, cosmetic — real price/billing
-- is untouched (still read from `tickets.cost`). Safe to re-run: only
-- fills rows where strike_price is still null/empty, so anything an admin
-- has already set manually is left alone.
update catalog_items ci
set strike_price = '₹' || (
  round(
    (regexp_replace(t.cost, '[^0-9.]', '', 'g'))::numeric
    * (1.3 + random() * 0.5)
    / 50
  ) * 50
)::text
from tickets t
where t.id = ci.id
  and t.cost ~ '[0-9]'
  and (ci.strike_price is null or ci.strike_price = '');
