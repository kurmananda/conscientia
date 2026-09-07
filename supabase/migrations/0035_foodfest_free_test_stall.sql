-- ₹0 test stall so order-status flow (pending -> preparing -> ready ->
-- completed) can be exercised end-to-end without real TIQR ticket ids.
insert into foodfest_stalls (id, name, description, accent_color, sort_order) values
  ('test-kitchen', 'Test Kitchen (Free)', 'Free sample items for testing checkout and order status — remove before the fest.', '#22c55e', 0)
on conflict (id) do nothing;

insert into foodfest_items (stall_id, name, description, price, ticket_id, sort_order) values
  ('test-kitchen', 'Sample Combo', 'Free test item — no real payment involved.', 0, 'FREE', 0)
on conflict do nothing;
