-- Food Fest: stalls browsed like a food-delivery app, paid through the
-- existing TIQR flow but priced only from a fixed code-defined ladder
-- (see src/lib/foodfestTickets.js), so no per-item ticket ever needs
-- creating in the database.
create table if not exists foodfest_stalls (
  id text primary key,
  name text not null,
  description text,
  image_url text,
  accent_color text not null default '#ff6b35',
  is_open boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists foodfest_items (
  id uuid primary key default gen_random_uuid(),
  stall_id text not null references foodfest_stalls(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  price numeric not null,
  ticket_id text not null,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists foodfest_orders (
  id uuid primary key default gen_random_uuid(),
  tiqr_booking_uid text unique not null,
  email text,
  name text,
  phone text,
  items jsonb not null default '[]'::jsonb,
  amount numeric not null default 0,
  payment_status text not null default 'pending',
  order_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table foodfest_stalls enable row level security;
alter table foodfest_items enable row level security;
alter table foodfest_orders enable row level security;

create policy "Public read open stalls" on foodfest_stalls for select using (true);
create policy "Public read available items" on foodfest_items for select using (true);
-- No public policy on foodfest_orders — only the service-role key (admin routes,
-- webhook, save-foodfest-order) can read/write it.

insert into foodfest_stalls (id, name, description, image_url, accent_color, sort_order) values
  ('momo-mania', 'Momo Mania', 'Steamed, fried, and pan-seared momos with three house chutneys.', null, '#ff6b35', 10),
  ('sizzle-street', 'Sizzle Street', 'Grilled sandwiches, wraps, and loaded fries.', null, '#22c55e', 20)
on conflict (id) do nothing;

insert into foodfest_items (stall_id, name, description, price, ticket_id, sort_order) values
  ('momo-mania', 'Steamed Veg Momo (6 pc)', 'Classic steamed momos with red chutney.', 60, 'REPLACE_ME_60', 10),
  ('momo-mania', 'Fried Chicken Momo (6 pc)', 'Crispy fried momos, chicken filling.', 80, 'REPLACE_ME_80', 20),
  ('sizzle-street', 'Loaded Cheese Fries', 'Fries loaded with cheese sauce and jalapenos.', 100, 'REPLACE_ME_100', 10),
  ('sizzle-street', 'Grilled Paneer Wrap', 'Grilled paneer, veggies, mint mayo, tortilla wrap.', 120, 'REPLACE_ME_120', 20)
on conflict do nothing;
