-- Project workflow status, plus the STI / Mustang project backlog for the demo garage.

alter table public.vehicle_projects
  add column if not exists status text not null default 'todo'
    check (status in ('todo', 'pending', 'completed'));

create index if not exists vehicle_projects_status_idx
  on public.vehicle_projects (vehicle_id, status);

-- Seed is scoped to the demo garage owner and matched by nickname/model so it is safe
-- to re-run: each title is inserted only when that vehicle does not already have it.
do $$
declare
  demo_user_id uuid := 'a68629f5-a927-4b7e-b593-53b4d7ac8697';
  sti_vehicle_id uuid;
  mustang_vehicle_id uuid;
begin
  select id into sti_vehicle_id
  from public.vehicles
  where user_id = demo_user_id
    and (
      nickname ilike '%sti%'
      or model ilike '%sti%'
      or (make ilike '%subaru%' and model ilike '%wrx%')
    )
  order by created_at asc
  limit 1;

  select id into mustang_vehicle_id
  from public.vehicles
  where user_id = demo_user_id
    and (nickname ilike '%mustang%' or model ilike '%mustang%')
  order by created_at asc
  limit 1;

  if sti_vehicle_id is not null then
    insert into public.vehicle_projects (user_id, vehicle_id, title, description, status)
    select demo_user_id, sti_vehicle_id, 'Cylinder 4 cooling mod', null, 'todo'
    where not exists (
      select 1
      from public.vehicle_projects
      where vehicle_id = sti_vehicle_id
        and title = 'Cylinder 4 cooling mod'
    );
  end if;

  if mustang_vehicle_id is not null then
    insert into public.vehicle_projects (user_id, vehicle_id, title, description, status)
    select demo_user_id, mustang_vehicle_id, seed.title, seed.description, seed.status
    from (
      values
        ('Suspension - coilovers', null::text, 'completed'),
        ('Interior - change to black', null::text, 'completed'),
        ('Audio setup', null::text, 'completed'),
        ('Sway bar and new wheels + tires', null::text, 'completed'),
        ('Install alternator', null::text, 'pending')
    ) as seed(title, description, status)
    where not exists (
      select 1
      from public.vehicle_projects existing
      where existing.vehicle_id = mustang_vehicle_id
        and existing.title = seed.title
    );
  end if;
end $$;
