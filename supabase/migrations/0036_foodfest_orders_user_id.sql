-- Capture the ordering user's auth id so the admin portal can resolve their
-- CNS ID (profiles.unique_code) — profiles are only ever joined by user_id
-- elsewhere in this codebase, email is not a reliable join key.
alter table foodfest_orders add column if not exists user_id uuid references auth.users(id);
