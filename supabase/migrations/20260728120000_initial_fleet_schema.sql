-- Fleet MVP schema: vehicles, maintenance, and research with RLS

create extension if not exists pgcrypto;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null,
  year integer,
  make text not null,
  model text not null,
  vin text,
  current_mileage integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  performed_on date not null,
  mileage integer,
  title text not null,
  cost_cents integer,
  performed_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fix_research_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  maintenance_record_id uuid references public.maintenance_records (id) on delete set null,
  title text not null,
  symptom text,
  diagnosis text,
  steps_tried text,
  parts_list text,
  external_links text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_user_id_idx on public.vehicles (user_id);
create index if not exists maintenance_records_vehicle_id_idx on public.maintenance_records (vehicle_id);
create index if not exists maintenance_records_user_id_idx on public.maintenance_records (user_id);
create index if not exists fix_research_notes_user_id_idx on public.fix_research_notes (user_id);
create index if not exists fix_research_notes_vehicle_id_idx on public.fix_research_notes (vehicle_id);

alter table public.vehicles enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.fix_research_notes enable row level security;

create policy "Users can select own vehicles"
  on public.vehicles for select
  using (auth.uid() = user_id);

create policy "Users can insert own vehicles"
  on public.vehicles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vehicles"
  on public.vehicles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own vehicles"
  on public.vehicles for delete
  using (auth.uid() = user_id);

create policy "Users can select own maintenance"
  on public.maintenance_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own maintenance"
  on public.maintenance_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own maintenance"
  on public.maintenance_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own maintenance"
  on public.maintenance_records for delete
  using (auth.uid() = user_id);

create policy "Users can select own research"
  on public.fix_research_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own research"
  on public.fix_research_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own research"
  on public.fix_research_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own research"
  on public.fix_research_notes for delete
  using (auth.uid() = user_id);
