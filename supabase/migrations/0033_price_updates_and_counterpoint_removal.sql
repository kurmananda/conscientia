-- Price adjustments requested by organizers, plus removal of the
-- Counterpoint (debate) event which is no longer running.
update public.tickets set cost = '₹149' where id = 'astronomy_pc';
update public.tickets set cost = '₹149' where id = 'astroph_pc';
update public.tickets set cost = '₹999' where id = 'robo_pc';
update public.tickets set cost = '₹99'  where id = 'cicada';

delete from public.catalog_items where id = 'counterpoint';
delete from public.tickets where id = 'counterpoint';
