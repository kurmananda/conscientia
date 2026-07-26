-- Every ticket id in the app now lives in `tickets` and nowhere else —
-- including the online-workshops combo tickets that used to be a hardcoded
-- object literal duplicated in src/lib/ticketCatalog.js and again inline in
-- src/app/online-workshops/page.jsx. Both were deleted; the checkout flow
-- now reads ticket ids from this table exclusively (src/lib/ticketStore.js).
alter table public.tickets drop constraint if exists tickets_type_check;
alter table public.tickets add constraint tickets_type_check
  check (type in ('workshop', 'event', 'addon', 'combo'));

insert into public.tickets (id, type, cost, ticket_id) values
  ('c4', 'combo', null, 3050),
  ('c3', 'combo', null, 3049),
  ('c1', 'combo', null, 3047),
  ('5', 'combo', null, 3042),
  ('c2', 'combo', null, 3048),
  ('1', 'combo', null, 3043),
  ('2', 'combo', null, 3044),
  ('3', 'combo', null, 3045),
  ('4', 'combo', null, 3046),
  ('6', 'combo', null, 3062)
on conflict (id) do nothing;
