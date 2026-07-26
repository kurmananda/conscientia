-- Links the registrations table (bookings/payments) back to the Supabase
-- auth user, so cart, profile, and registrations are all attributes of the
-- same account instead of being joined loosely by email string.

alter table registrations
  add column if not exists user_id uuid references auth.users(id);

create index if not exists registrations_user_id_idx on registrations (user_id);

alter table registrations enable row level security;

drop policy if exists "Users can view own registrations" on registrations;
create policy "Users can view own registrations"
  on registrations for select
  using (auth.uid() = user_id);
