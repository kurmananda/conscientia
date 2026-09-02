-- Group-registration support: an event/workshop can require a fixed-size
-- team instead of a solo registrant. group_size = 1 (default) means no
-- team step at all — the existing solo registration flow is unchanged.
alter table public.catalog_items add column if not exists group_size integer not null default 1;

-- One row per team per event. The person who actually registered/paid is
-- the "leader" — everyone else is added by CNS-id afterwards from their
-- profile. `member_codes` always includes the leader's own unique_code as
-- the first entry. Once `confirmed` is true, only an admin (via the
-- service-role-only /api/admin/team route) can change member_codes — the
-- user-facing /api/team route refuses any further edits.
create table if not exists public.event_teams (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  leader_user_id uuid not null references auth.users(id) on delete cascade,
  leader_unique_code text not null,
  member_codes text[] not null default '{}',
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, leader_user_id)
);

create index if not exists event_teams_event_id_idx on public.event_teams (event_id);

-- No public policies: every read/write goes through service-role API
-- routes (/api/team, /api/admin/team), which do their own auth — same
-- pattern as admin_logs.
alter table public.event_teams enable row level security;
