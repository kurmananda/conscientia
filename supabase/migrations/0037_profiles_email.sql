-- profiles never stored the account's email (it only ever lived in
-- auth.users), so every admin-page load had to call the Auth Admin
-- listUsers API to show it — and that API is unreliable on this project
-- (500s past ~200 accounts). Storing email directly on profiles removes
-- that dependency entirely for display purposes.
alter table profiles add column if not exists email text;
create index if not exists profiles_email_idx on profiles (email);

-- One-time backfill from auth.users for every profile that already exists.
update profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and p.email is null;
