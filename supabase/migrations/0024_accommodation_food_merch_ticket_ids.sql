-- Real Tiqr ticket_ids for accommodation/food/merch, matching the pattern
-- from 0023 for events/workshops.
update public.tickets set ticket_id = 3175, cost = '₹450'  where id = 'accommodation';
update public.tickets set ticket_id = 3176, cost = '₹40'   where id = 'breakfast';
update public.tickets set ticket_id = 3177, cost = '₹80'   where id = 'lunch';
update public.tickets set ticket_id = 3178, cost = '₹80'   where id = 'dinner';
update public.tickets set ticket_id = 3179, cost = '₹110'  where id = 'delivery';
update public.tickets set ticket_id = 3180, cost = '₹349'  where id = 'merch-cap';
update public.tickets set ticket_id = 3181, cost = '₹1299' where id = 'merch-hoodie';
update public.tickets set ticket_id = 3182, cost = '₹249'  where id = 'merch-tote';
update public.tickets set ticket_id = 3183, cost = '₹599'  where id = 'merch-tshirt';