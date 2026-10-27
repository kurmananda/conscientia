-- Keep profile gender values aligned with the profile forms.
alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  add constraint profiles_gender_check
  check (gender in ('male', 'female', 'other', 'rather_not_say'));

-- Normalize the profile email index/lookup source from the authoritative
-- auth email for both existing and newly linked accounts.
update public.profiles as p
set email = lower(btrim(u.email))
from auth.users as u
where p.user_id = u.id
  and u.email is not null
  and p.email is distinct from lower(btrim(u.email));

-- Link registrations only when the normalized email identifies exactly one
-- auth account. Rows already linked to a different account are left untouched.
with unique_email_accounts as (
  select lower(btrim(email)) as email_key, min(id::text)::uuid as user_id
  from auth.users
  where email is not null
  group by lower(btrim(email))
  having count(*) = 1
)
update public.registrations as r
set user_id = a.user_id,
    updated_at = now()
from unique_email_accounts as a
where lower(btrim(r.email)) = a.email_key
  and (r.user_id is null or r.user_id = a.user_id);

-- Account profiles own the CNS ID; make any linked registration use that ID.
update public.registrations as r
set details = jsonb_set(
      coalesce(r.details, '{}'::jsonb),
      '{unique_code}',
      to_jsonb(p.unique_code),
      true
    ),
    updated_at = now()
from public.profiles as p
where p.user_id = r.user_id
  and p.unique_code is not null
  and r.details->>'unique_code' is distinct from p.unique_code;
