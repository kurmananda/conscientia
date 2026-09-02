-- Adds three new events. ticket_id is a placeholder (1234) — swap in the
-- real Tiqr product id for each before these go live for payment, see
-- migration 0014 for how the existing lineup's ticket_ids are assigned.
insert into public.tickets (id, type, cost, ticket_id) values
  ('quantumhackathonindividual', 'event', '₹399', 1234),
  ('quantumhackathonteam', 'event', '₹1499', 1234),
  ('stockodyssey', 'event', 'Free', 1234);

insert into public.catalog_items (
  id, kind, sort_order, title, subtitle, type, section, section_color,
  description, accent_color, glow_color, foil_gradient
) values
  ('quantumhackathonindividual', 'event', 33, 'Quantum Hackathon (Individual)', 'Conscientia 2026', 'Quantum Hackathon', 'Events', '#a855f7', 'Solo track of the Quantum Hackathon.', '#33d6ff', 'rgba(51,214,255,0.5)', 'linear-gradient(135deg,#0b1c2f,#123f5d,#081019)'),
  ('quantumhackathonteam', 'event', 34, 'Quantum Hackathon (Team)', 'Conscientia 2026', 'Quantum Hackathon', 'Events', '#a855f7', 'Team track of the Quantum Hackathon.', '#a855f7', 'rgba(168,85,247,0.5)', 'linear-gradient(135deg,#0b1c2f,#123f5d,#081019)'),
  ('stockodyssey', 'event', 35, 'Stock Odyssey', 'Conscientia 2026', 'Stock Odyssey', 'Events', '#a855f7', 'A stock market simulation challenge.', '#22c55e', 'rgba(34,197,94,0.5)', 'linear-gradient(135deg,#0b1c2f,#123f5d,#081019)');
