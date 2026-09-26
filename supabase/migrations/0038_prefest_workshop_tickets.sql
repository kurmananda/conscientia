-- New pre-fest workshops (per the planned pre-fest workshop timetable:
-- Kottayam Rocketry + Robotics on Oct 10-11, Aeromodelling in-campus on
-- Oct 24-25). Per migration 0010, an admin adds a new workshop by
-- inserting its (id, type, cost, ticket_id) row directly into `tickets`.
-- Placeholder content is seeded here too (title/venue/timing/description)
-- so these show up on the public site immediately — meant to be edited via
-- the admin Catalog portal once final copy/pricing/images are ready.
insert into public.tickets (id, type, cost, ticket_id) values
  ('kottayam_rocketry_pc', 'workshop', '₹0', 3330),
  ('prefest_aero_pc', 'workshop', '₹0', 3331),
  ('prefest_robo_pc', 'workshop', '₹0', 3332);

insert into public.catalog_items (
  id, kind, sort_order,
  title, subtitle, type,
  section, section_color,
  duration, seats,
  eligibility, venue, timing,
  image,
  accent_color, glow_color, foil_gradient,
  description,
  about_extra, highlights, requirements,
  format, certificate, tags,
  layout, contacts
) values
  (
    'kottayam_rocketry_pc', 'workshop', 90,
    'Kottayam Rocketry', 'Conscientia 2026 Pre-Fest', 'Workshop',
    'Pre-Fest Workshops', '#33d6ff',
    2, 0,
    'Grade 6 and above', 'Kottayam', 'Oct 10 - Oct 11',
    'https://picsum.photos/seed/kottayamrocketry/800/600',
    '#ff6b6b', 'rgba(255,107,107,.5)', 'linear-gradient(135deg,#0b0f14,#2d193f,#05070a)',
    'Pre-fest rocketry workshop held in Kottayam — details being finalized, check back soon.',
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
    'Offline', 'Physical Certificates will be provided', '[]'::jsonb,
    '{}'::jsonb, '[]'::jsonb
  ),
  (
    'prefest_robo_pc', 'workshop', 91,
    'Robotics (Pre-Fest, Kottayam)', 'Conscientia 2026 Pre-Fest', 'Workshop',
    'Pre-Fest Workshops', '#33d6ff',
    2, 0,
    'Grade 6 and above', 'Kottayam', 'Oct 10 - Oct 11',
    'https://picsum.photos/seed/prefestrobo/800/600',
    '#9cf24d', 'rgba(156,242,77,.5)', 'linear-gradient(135deg,#0b0f14,#2d193f,#05070a)',
    'Pre-fest robotics workshop held in Kottayam — details being finalized, check back soon.',
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
    'Offline', 'Physical Certificates will be provided', '[]'::jsonb,
    '{}'::jsonb, '[]'::jsonb
  ),
  (
    'prefest_aero_pc', 'workshop', 92,
    'Aeromodelling (Pre-Fest)', 'Conscientia 2026 Pre-Fest', 'Workshop',
    'Pre-Fest Workshops', '#33d6ff',
    2, 0,
    'Grade 6 and above', 'IIST Campus', 'Oct 24 - Oct 25',
    'https://picsum.photos/seed/prefestaero/800/600',
    '#facc15', 'rgba(250,204,21,.5)', 'linear-gradient(135deg,#0b0f14,#2d193f,#05070a)',
    'Pre-fest aeromodelling workshop, held on campus — details being finalized, check back soon.',
    '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
    'Offline', 'Physical Certificates will be provided', '[]'::jsonb,
    '{}'::jsonb, '[]'::jsonb
  );
