-- Seeds the admin roster requested for the fest, all with the same
-- temporary password ("temporary") — same sha256-hex hashing scheme
-- /api/admin/login already expects (see migration 0002). Admins should
-- change this via `update admins set password = encode(sha256('newpass'::bytea), 'hex') where callsign = '...'`
-- once they've logged in.
-- ON CONFLICT so this is safe to re-run if a callsign already exists.
insert into public.admins (name, role, callsign, password) values
  ('Niranjan Patil', 'cc', 'netaji', encode(sha256('temporary'::bytea), 'hex')),
  ('Sanmitha Sree', 'vcc', 'kannu', encode(sha256('temporary'::bytea), 'hex')),
  ('Vedandra Vardhan', 'vcc', 'veda', encode(sha256('temporary'::bytea), 'hex')),
  ('Poonam Sachdev', 'vcc', 'didi', encode(sha256('temporary'::bytea), 'hex')),
  ('Chirag Katkar', 'vcc', 'genie', encode(sha256('temporary'::bytea), 'hex')),
  ('Ved Pandit', 'publicity', 'pandit', encode(sha256('temporary'::bytea), 'hex')),
  ('Neehar Sujay', 'hospi', 'neehar', encode(sha256('temporary'::bytea), 'hex')),
  ('Sunandhan', 'workshop', 'suno', encode(sha256('temporary'::bytea), 'hex')),
  ('Omkar Sai Rayudu', 'events', 'rayudu', encode(sha256('temporary'::bytea), 'hex')),
  ('Shreenidh', 'events', 'shreenidh', encode(sha256('temporary'::bytea), 'hex')),
  ('Sathwick Chatkara', 'finance', 'sathwick', encode(sha256('temporary'::bytea), 'hex')),
  ('Gaurav Gill', 'finance', 'gilli', encode(sha256('temporary'::bytea), 'hex')),
  ('Kurmananda Pavan Sai B', 'webd', 'po', encode(sha256('temporary'::bytea), 'hex')),
  ('Aryan Thakur', 'workshop', 'aryan', encode(sha256('temporary'::bytea), 'hex')),
  ('Vaibhav Rikhari', 'creatives', 'vbv', encode(sha256('temporary'::bytea), 'hex')),
  ('Sajan', 'finance', 'krishna', encode(sha256('temporary'::bytea), 'hex'))
on conflict (callsign) do update set
  name = excluded.name,
  role = excluded.role,
  password = excluded.password;
