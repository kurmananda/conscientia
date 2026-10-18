-- Brings back the Counterpoint (debate) event that migration 0033 removed —
-- it is running after all. Restored exactly as it stood before the removal:
-- content from 0014, colors from 0017, ticket_id from 0023, registration
-- fee ₹299. `on conflict do nothing` makes this safe to re-run.
insert into public.tickets (id, type, cost, ticket_id) values
  ('counterpoint', 'event', '₹299', 3162)
on conflict (id) do nothing;

insert into public.catalog_items (
  id, kind, sort_order,
  title, subtitle, type,
  section, section_color,
  accent_color, glow_color, foil_gradient,
  description
) values
  (
    'counterpoint', 'event', 22,
    'Counterpoint', 'Conscientia 2026', 'Counterpoint',
    'Events', '#a855f7',
    '#4df26c', 'rgba(77,242,108,0.5)', 'linear-gradient(135deg,#0b0f14,#3f1938,#05070a)',
    'Debate and discourse in Counterpoint.'
  )
on conflict (id) do nothing;
