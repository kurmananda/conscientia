-- Mandatory-at-registration fields alongside phone: Aadhaar card number and
-- college ID (student ID number), both free-text since formats vary.
alter table public.profiles add column if not exists aadhaar_number text;
alter table public.profiles add column if not exists college_id text;
