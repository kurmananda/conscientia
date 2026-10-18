-- Paid bookings were invisible on /profile (and missing from capacity counts,
-- the cart's "already bought" check and the admin paid-items list) for 30
-- accounts, because every one of those reads `payment_status` and hides the
-- whole row unless it is 'paid' (or 'team'):
--   * 27 rows had status/payment_status blanked by the 2026-09-28 export
--     reconcile — the bookings themselves (workshop_ids, details.items_paid)
--     were intact.
--   * 3 account-owned rows were left as 'merged' by the earlier phone-number
--     merge, one of which later had new paid items imported onto it. A
--     booking belongs to the email/CNS id that paid for it, even when the
--     phone number is shared with another account.
-- Run this manually in the Supabase SQL editor. Safe to re-run.

-- 1. Repair the rows that are hidden today.
update public.registrations
set payment_status = 'paid',
    status = 'confirmed'
where jsonb_typeof(details->'items_paid') = 'array'
  and jsonb_array_length(details->'items_paid') > 0
  and (
    payment_status is null
    or (payment_status = 'merged' and user_id is not null)
  );

-- 2. Keep it from happening again, whichever script or route does the write.
-- A row that holds paid items can never be saved with a blank payment_status,
-- and adding a paid item to a row that isn't 'paid' yet (teammate-only
-- 'team', 'merged', blank) marks it paid — the same thing the TiQR webhook
-- and /api/save-registration already do for live purchases.
create or replace function public.registrations_paid_status_guard()
returns trigger
language plpgsql
as $$
declare
  new_count int := case
    when jsonb_typeof(new.details->'items_paid') = 'array'
      then jsonb_array_length(new.details->'items_paid')
    else 0
  end;
  old_count int := 0;
begin
  if tg_op = 'UPDATE' and jsonb_typeof(old.details->'items_paid') = 'array' then
    old_count := jsonb_array_length(old.details->'items_paid');
  end if;

  if new_count > 0 and (
    new.payment_status is null
    or (new.payment_status <> 'paid' and new_count > old_count)
  ) then
    new.payment_status := 'paid';
    new.status := 'confirmed';
  end if;

  return new;
end;
$$;

drop trigger if exists registrations_paid_status_guard on public.registrations;
create trigger registrations_paid_status_guard
  before insert or update on public.registrations
  for each row execute function public.registrations_paid_status_guard();
