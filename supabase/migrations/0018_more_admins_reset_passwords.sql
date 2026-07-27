-- Adds another batch of admins, and resets every existing admin's password
-- (whatever it currently is) back to the same temporary password the rest
-- of the roster started with ("temporary"), so everyone is on a known
-- baseline again. Same sha256-hex hashing scheme /api/admin/login expects
-- (see migration 0002). Admins should change this via
-- `update admins set password = encode(sha256('newpass'::bytea), 'hex') where callsign = '...'`
-- once they've logged in.
insert into public.admins (name, role, callsign, password) values
  ('Farohar', 'publicity', 'fahhh', encode(sha256('temporary'::bytea), 'hex')),
  ('Sreesanth', 'creatives', 'fonkmaster', encode(sha256('temporary'::bytea), 'hex')),
  ('Vaibhav', 'creatives', 'vbv', encode(sha256('temporary'::bytea), 'hex')),
  ('Jyothi Swaroop', 'deco', 'blunderpro', encode(sha256('temporary'::bytea), 'hex')),
  ('Komal', 'deco', 'komal', encode(sha256('temporary'::bytea), 'hex')),
  ('Geethika', 'hospi', 'geethika', encode(sha256('temporary'::bytea), 'hex')),
  ('Padmasri', 'media', 'vani', encode(sha256('temporary'::bytea), 'hex')),
  ('Adi Pranav', 'logi', 'mayya', encode(sha256('temporary'::bytea), 'hex')),
  ('Sanandhu', 'mtc', 'sanandhu', encode(sha256('temporary'::bytea), 'hex')),
  ('Shaurya', 'webd', 'billi', encode(sha256('temporary'::bytea), 'hex')),
  ('Yashwanth Babu', 'logi', 'babu', encode(sha256('temporary'::bytea), 'hex'))
on conflict (callsign) do update set
  name = excluded.name,
  role = excluded.role,
  password = excluded.password;

-- Reset everyone else's password too, so the whole roster is back on the
-- same temporary password regardless of what any admin had changed it to.
update public.admins set password = encode(sha256('temp'::bytea), 'hex');
