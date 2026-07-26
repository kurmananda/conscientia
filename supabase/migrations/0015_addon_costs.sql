-- Merch/accommodation/food prices were hardcoded in
-- src/app/accommodation/merchData.js. Moving them into the tickets table
-- (the `cost` column, already used for events/workshops) so the frontend
-- has nothing pricing-related hardcoded locally — see src/lib/ticketStore.js
-- (getTicketCost/getCostMap) and the accommodation page components.
update public.tickets set cost = '₹450' where id = 'accommodation';
update public.tickets set cost = '₹40' where id = 'breakfast';
update public.tickets set cost = '₹80' where id = 'lunch';
update public.tickets set cost = '₹80' where id = 'dinner';
update public.tickets set cost = '₹60' where id = 'delivery';
update public.tickets set cost = '₹599' where id = 'merch-tshirt';
update public.tickets set cost = '₹1299' where id = 'merch-hoodie';
update public.tickets set cost = '₹349' where id = 'merch-cap';
update public.tickets set cost = '₹249' where id = 'merch-tote';
