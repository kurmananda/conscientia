-- Ties /admin access to the signed-in account, not just the shared
-- codeword+password: only accounts flagged is_admin here can log into the
-- admin dashboard, so the codeword/password alone doesn't work on a device
-- signed into a non-admin account.
alter table profiles add column if not exists is_admin boolean default false;

-- Flip specific accounts to admin manually, e.g.:
-- update profiles set is_admin = true where email = 'someone@example.com';
