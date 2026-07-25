-- OPTIONAL demo/seed data — NOT a schema migration, do not run this
-- automatically alongside supabase/migrations/0001-0004. Run manually in the
-- Supabase SQL editor only if you want 10 dummy registrants (kurma1..kurma10)
-- to exercise the admin dashboard's filters/grouping/accommodation UI.
--
-- profiles.user_id has a foreign-key constraint against auth.users, so this
-- script first inserts 10 minimal auth.users rows (fixed deterministic
-- UUIDs) for kurma1..kurma10, then profiles/cart_items/registrations rows
-- that reference them. These fake accounts never actually sign in (no
-- usable password), they just exist to satisfy the FK. Safe to re-run
-- (on conflict do nothing everywhere).
--
-- NOTE: profiles has no `email` column — email lives on auth.users and is
-- read client-side via Supabase auth, not stored on the profile row (see
-- src/app/hooks/useProfile.js). registrations.email is the only place email
-- is stored server-side (matching what the TiQR webhook writes), so that's
-- the only table below that gets an email value.

-- 10 fixed UUIDs, one per dummy user.
-- kurma1 -> ...001, kurma2 -> ...002, … kurma10 -> ...010

-- profiles.user_id has a foreign-key constraint against auth.users, so a
-- matching row has to exist there first. These fake accounts never need to
-- actually log in (no real password recovery/sessions), so this is a
-- minimal insert — just enough to satisfy the FK and match the emails used
-- in the registrations insert further down. Safe to re-run.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password,
   email_confirmed_at, created_at, updated_at,
   raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'kurma1@example.com',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'kurma2@example.com',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'kurma3@example.com',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'kurma4@example.com',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'kurma5@example.com',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'kurma6@example.com',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'kurma7@example.com',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'kurma8@example.com',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated', 'kurma9@example.com',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated', 'kurma10@example.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}')
on conflict (id) do nothing;

insert into profiles
  (user_id, name, unique_code, phone, college, city, gender,
   accommodation_booked, accommodation_room, merch_selection, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', 'kurma1',  'KURMA-01', '9800000001', 'IIST Trivandrum', 'Trivandrum', 'male',           true,  'Block A · Room 101', 'Conscientia Tee (M)', now()),
  ('00000000-0000-0000-0000-000000000002', 'kurma2',  'KURMA-02', '9800000002', 'NIT Calicut',     'Calicut',    'female',         true,  'Block A · Room 106', 'Conscientia Cap (One Size)', now()),
  ('00000000-0000-0000-0000-000000000003', 'kurma3',  'KURMA-03', '9800000003', 'IIT Madras',      'Chennai',    'male',           true,  'Block B · Room 204', 'Conscientia Hoodie (L)', now()),
  ('00000000-0000-0000-0000-000000000004', 'kurma4',  'KURMA-04', '9800000004', 'CET Trivandrum',  'Trivandrum', 'rather_not_say', false, null,                  null,                    now()),
  ('00000000-0000-0000-0000-000000000005', 'kurma5',  'KURMA-05', '9800000005', 'IIST Trivandrum', 'Kollam',     'female',         true,  'Block A · Room 118', null,                    now()),
  ('00000000-0000-0000-0000-000000000006', 'kurma6',  'KURMA-06', '9800000006', 'NIT Trichy',      'Trichy',     'male',           true,  'Block C · Room 310', 'Conscientia Cap (One Size)', now()),
  ('00000000-0000-0000-0000-000000000007', 'kurma7',  'KURMA-07', '9800000007', 'VIT Vellore',     'Vellore',    'female',         false, null,                  null,                    now()),
  ('00000000-0000-0000-0000-000000000008', 'kurma8',  'KURMA-08', '9800000008', 'IIST Trivandrum', 'Kochi',      'male',           true,  'Block C · Room 305', null,                    now()),
  ('00000000-0000-0000-0000-000000000009', 'kurma9',  'KURMA-09', '9800000009', 'BITS Pilani',     'Pilani',     'rather_not_say', false, null,                  null,                    now()),
  ('00000000-0000-0000-0000-000000000010', 'kurma10', 'KURMA-10', '9800000010', 'IIST Trivandrum', 'Trivandrum', 'female',         true,  'Block B · Room 212', 'Conscientia Tote Bag (One Size)', now())
on conflict (user_id) do nothing;

-- Cart items: mix of real workshop/event ids (from workshopData.js /
-- eventsData.js), food add-ons, accommodation, and merch. item_key format
-- matches src/app/workshop/[id]/page.jsx's cartKey pattern (workshop:<id> /
-- event:<id>); item_data mirrors the client cart item shape
-- {key,id,kind,title,unitPrice,qty}. kurma4 and kurma9 are deliberately left
-- with extra items here that are NOT mirrored in registrations below, so
-- the admin page's "In Cart" reveal (unpaid, not counted in totals) has
-- something to show.

insert into cart_items (user_id, item_key, item_data) values
  -- kurma1: workshop + accommodation + all three meals, all paid
  ('00000000-0000-0000-0000-000000000001', 'workshop:rocket',   '{"key":"workshop:rocket","id":"rocket","kind":"workshop","title":"Rocketry Workshop","unitPrice":499,"qty":1}'),
  ('00000000-0000-0000-0000-000000000001', 'accommodation',      '{"key":"accommodation","id":"accommodation","kind":"accommodation","title":"Accommodation","unitPrice":400,"qty":1}'),
  ('00000000-0000-0000-0000-000000000001', 'breakfast',          '{"key":"breakfast","id":"breakfast","kind":"food","title":"Breakfast","unitPrice":40,"qty":1}'),
  ('00000000-0000-0000-0000-000000000001', 'lunch',              '{"key":"lunch","id":"lunch","kind":"food","title":"Lunch","unitPrice":80,"qty":1}'),
  ('00000000-0000-0000-0000-000000000001', 'dinner',             '{"key":"dinner","id":"dinner","kind":"food","title":"Dinner","unitPrice":80,"qty":1}'),

  -- kurma2: event + accommodation + breakfast/lunch, all paid
  ('00000000-0000-0000-0000-000000000002', 'event:code-combat',  '{"key":"event:code-combat","id":"code-combat","kind":"event","title":"Code Combat","unitPrice":199,"qty":1}'),
  ('00000000-0000-0000-0000-000000000002', 'accommodation',      '{"key":"accommodation","id":"accommodation","kind":"accommodation","title":"Accommodation","unitPrice":400,"qty":1}'),
  ('00000000-0000-0000-0000-000000000002', 'breakfast',          '{"key":"breakfast","id":"breakfast","kind":"food","title":"Breakfast","unitPrice":40,"qty":1}'),
  ('00000000-0000-0000-0000-000000000002', 'lunch',              '{"key":"lunch","id":"lunch","kind":"food","title":"Lunch","unitPrice":80,"qty":1}'),

  -- kurma3: workshop + accommodation + lunch/dinner, all paid
  ('00000000-0000-0000-0000-000000000003', 'workshop:ai-ml',     '{"key":"workshop:ai-ml","id":"ai-ml","kind":"workshop","title":"AI/ML Workshop","unitPrice":499,"qty":1}'),
  ('00000000-0000-0000-0000-000000000003', 'accommodation',      '{"key":"accommodation","id":"accommodation","kind":"accommodation","title":"Accommodation","unitPrice":400,"qty":1}'),
  ('00000000-0000-0000-0000-000000000003', 'lunch',              '{"key":"lunch","id":"lunch","kind":"food","title":"Lunch","unitPrice":80,"qty":1}'),
  ('00000000-0000-0000-0000-000000000003', 'dinner',             '{"key":"dinner","id":"dinner","kind":"food","title":"Dinner","unitPrice":80,"qty":1}'),

  -- kurma4: event + workshop, paid, but accommodation still sitting unpaid in cart
  ('00000000-0000-0000-0000-000000000004', 'event:hackathon',    '{"key":"event:hackathon","id":"hackathon","kind":"event","title":"Hackathon","unitPrice":299,"qty":1}'),
  ('00000000-0000-0000-0000-000000000004', 'workshop:cybersec',  '{"key":"workshop:cybersec","id":"cybersec","kind":"workshop","title":"Cybersecurity Workshop","unitPrice":499,"qty":1}'),
  ('00000000-0000-0000-0000-000000000004', 'accommodation',      '{"key":"accommodation","id":"accommodation","kind":"accommodation","title":"Accommodation","unitPrice":400,"qty":1}'),

  -- kurma5: accommodation + dinner + merch, all paid
  ('00000000-0000-0000-0000-000000000005', 'accommodation',      '{"key":"accommodation","id":"accommodation","kind":"accommodation","title":"Accommodation","unitPrice":400,"qty":1}'),
  ('00000000-0000-0000-0000-000000000005', 'dinner',             '{"key":"dinner","id":"dinner","kind":"food","title":"Dinner","unitPrice":80,"qty":1}'),
  ('00000000-0000-0000-0000-000000000005', 'merch-tshirt',       '{"key":"merch-tshirt","id":"merch-tshirt","kind":"merch","title":"Conscientia Tee","unitPrice":599,"qty":1}'),

  -- kurma6: workshop + accommodation + all three meals + merch, all paid
  ('00000000-0000-0000-0000-000000000006', 'workshop:robotics',  '{"key":"workshop:robotics","id":"robotics","kind":"workshop","title":"Robotics Workshop","unitPrice":499,"qty":1}'),
  ('00000000-0000-0000-0000-000000000006', 'accommodation',      '{"key":"accommodation","id":"accommodation","kind":"accommodation","title":"Accommodation","unitPrice":400,"qty":1}'),
  ('00000000-0000-0000-0000-000000000006', 'breakfast',          '{"key":"breakfast","id":"breakfast","kind":"food","title":"Breakfast","unitPrice":40,"qty":1}'),
  ('00000000-0000-0000-0000-000000000006', 'lunch',              '{"key":"lunch","id":"lunch","kind":"food","title":"Lunch","unitPrice":80,"qty":1}'),
  ('00000000-0000-0000-0000-000000000006', 'dinner',             '{"key":"dinner","id":"dinner","kind":"food","title":"Dinner","unitPrice":80,"qty":1}'),
  ('00000000-0000-0000-0000-000000000006', 'merch-cap',          '{"key":"merch-cap","id":"merch-cap","kind":"merch","title":"Conscientia Cap","unitPrice":349,"qty":1}'),

  -- kurma7: event only, paid, no accommodation/food at all (control case)
  ('00000000-0000-0000-0000-000000000007', 'event:robo-war',     '{"key":"event:robo-war","id":"robo-war","kind":"event","title":"Robo War","unitPrice":299,"qty":1}'),

  -- kurma8: workshop + accommodation + breakfast, all paid
  ('00000000-0000-0000-0000-000000000008', 'workshop:quantum',   '{"key":"workshop:quantum","id":"quantum","kind":"workshop","title":"Quantum Computing Workshop","unitPrice":499,"qty":1}'),
  ('00000000-0000-0000-0000-000000000008', 'accommodation',      '{"key":"accommodation","id":"accommodation","kind":"accommodation","title":"Accommodation","unitPrice":400,"qty":1}'),
  ('00000000-0000-0000-0000-000000000008', 'breakfast',          '{"key":"breakfast","id":"breakfast","kind":"food","title":"Breakfast","unitPrice":40,"qty":1}'),

  -- kurma9: event paid, plus breakfast/lunch still sitting unpaid in cart (nothing booked)
  ('00000000-0000-0000-0000-000000000009', 'event:tech-talks',   '{"key":"event:tech-talks","id":"tech-talks","kind":"event","title":"Tech Talks","unitPrice":99,"qty":1}'),
  ('00000000-0000-0000-0000-000000000009', 'breakfast',          '{"key":"breakfast","id":"breakfast","kind":"food","title":"Breakfast","unitPrice":40,"qty":1}'),
  ('00000000-0000-0000-0000-000000000009', 'lunch',              '{"key":"lunch","id":"lunch","kind":"food","title":"Lunch","unitPrice":80,"qty":1}'),

  -- kurma10: accommodation + lunch/dinner + merch, all paid
  ('00000000-0000-0000-0000-000000000010', 'accommodation',      '{"key":"accommodation","id":"accommodation","kind":"accommodation","title":"Accommodation","unitPrice":400,"qty":1}'),
  ('00000000-0000-0000-0000-000000000010', 'lunch',              '{"key":"lunch","id":"lunch","kind":"food","title":"Lunch","unitPrice":80,"qty":1}'),
  ('00000000-0000-0000-0000-000000000010', 'dinner',             '{"key":"dinner","id":"dinner","kind":"food","title":"Dinner","unitPrice":80,"qty":1}'),
  ('00000000-0000-0000-0000-000000000010', 'merch-tote',         '{"key":"merch-tote","id":"merch-tote","kind":"merch","title":"Conscientia Tote Bag","unitPrice":249,"qty":1}')
on conflict (user_id, item_key) do nothing;

-- Matching registrations rows so admin/users' registration join
-- (workshop_ids / payment_status) shows up correctly. Since the admin
-- dashboard now treats registrations.workshop_ids + payment_status = 'paid'
-- as the sole "what did this person actually pay for" signal (see paidIds()
-- in src/app/admin/page.jsx), accommodation/food ids are listed here too —
-- not just in cart_items — for a dummy user to correctly show as "Booked" /
-- have food counted. Column names taken from
-- src/app/api/save-registration/route.js's upsert payload. kurma4 and
-- kurma9 are deliberately left without their extra cart items reflected
-- here, so they show up under the unpaid "In Cart" reveal instead.

insert into registrations (email, user_id, workshop_ids, payment_status, status, amount, updated_at) values
  ('kurma1@example.com',  '00000000-0000-0000-0000-000000000001', array['rocket','accommodation','breakfast','lunch','dinner'], 'paid', 'confirmed', 499 + 400 + 40 + 80 + 80, now()),
  ('kurma2@example.com',  '00000000-0000-0000-0000-000000000002', array['code-combat','accommodation','breakfast','lunch'], 'paid', 'confirmed', 199 + 400 + 40 + 80, now()),
  ('kurma3@example.com',  '00000000-0000-0000-0000-000000000003', array['ai-ml','accommodation','lunch','dinner'], 'paid', 'confirmed', 499 + 400 + 80 + 80, now()),
  ('kurma4@example.com',  '00000000-0000-0000-0000-000000000004', array['hackathon','cybersec'], 'paid', 'confirmed', 798, now()),
  ('kurma5@example.com',  '00000000-0000-0000-0000-000000000005', array['accommodation','dinner','merch-tshirt'], 'paid', 'confirmed', 400 + 80 + 599, now()),
  ('kurma6@example.com',  '00000000-0000-0000-0000-000000000006', array['robotics','accommodation','breakfast','lunch','dinner','merch-cap'], 'paid', 'confirmed', 499 + 400 + 40 + 80 + 80 + 349, now()),
  ('kurma7@example.com',  '00000000-0000-0000-0000-000000000007', array['robo-war'], 'paid', 'confirmed', 299, now()),
  ('kurma8@example.com',  '00000000-0000-0000-0000-000000000008', array['quantum','accommodation','breakfast'], 'paid', 'confirmed', 499 + 400 + 40, now()),
  ('kurma9@example.com',  '00000000-0000-0000-0000-000000000009', array['tech-talks'], 'paid', 'confirmed', 99, now()),
  ('kurma10@example.com', '00000000-0000-0000-0000-000000000010', array['accommodation','lunch','dinner','merch-tote'], 'paid', 'confirmed', 400 + 80 + 80 + 249, now())
on conflict (email) do nothing;
