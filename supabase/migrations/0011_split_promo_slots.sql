-- The homepage "Limited Drop" strip and the floating "Exclusive"
-- notification used to share one promo_settings row ('default'); they now
-- get their own independent rows so an admin can give them different
-- copy/colors/links.
insert into public.promo_settings (
  id, badge_label, heading, description, price, link, image_front, image_back, accent_color, secondary_color
)
select
  'limited_drop', badge_label, heading, description, price, link, image_front, image_back, accent_color, secondary_color
from public.promo_settings where id = 'default'
on conflict (id) do nothing;

insert into public.promo_settings (
  id, badge_label, heading, description, price, link, image_front, image_back, accent_color, secondary_color
) values (
  'exclusive', 'Exclusive', 'Space Merch', 'Official Conscientia 2026 kit — add at checkout',
  '₹599', '/online-workshops', '/assets/wsfront.png', '/assets/wsback.png', '#33d6ff', '#a855f7'
)
on conflict (id) do nothing;

-- Ensure both slots exist even if there was no prior 'default' row to copy.
insert into public.promo_settings (id) values ('limited_drop')
on conflict (id) do nothing;

delete from public.promo_settings where id = 'default';
