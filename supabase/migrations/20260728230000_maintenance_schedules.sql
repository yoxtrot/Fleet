-- Recurring maintenance schedules associated with a vehicle

create table if not exists public.maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  description text not null,
  mileage_interval_miles integer,
  time_interval_days integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_schedules_has_interval check (
    mileage_interval_miles is not null
    or time_interval_days is not null
  ),
  constraint maintenance_schedules_mileage_positive check (
    mileage_interval_miles is null or mileage_interval_miles > 0
  ),
  constraint maintenance_schedules_time_positive check (
    time_interval_days is null or time_interval_days > 0
  )
);

create index if not exists maintenance_schedules_user_id_idx on public.maintenance_schedules (user_id);
create index if not exists maintenance_schedules_vehicle_id_idx on public.maintenance_schedules (vehicle_id);

alter table public.maintenance_schedules enable row level security;

drop policy if exists "Users can select own maintenance schedules" on public.maintenance_schedules;
drop policy if exists "Users can insert own maintenance schedules" on public.maintenance_schedules;
drop policy if exists "Users can update own maintenance schedules" on public.maintenance_schedules;
drop policy if exists "Users can delete own maintenance schedules" on public.maintenance_schedules;

create policy "Users can select own maintenance schedules"
  on public.maintenance_schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert own maintenance schedules"
  on public.maintenance_schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own maintenance schedules"
  on public.maintenance_schedules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own maintenance schedules"
  on public.maintenance_schedules for delete
  using (auth.uid() = user_id);
