-- Adds an optional gender attribute to profiles.
alter table profiles
  add column if not exists gender text
  check (gender in ('male', 'female', 'rather_not_say'));
