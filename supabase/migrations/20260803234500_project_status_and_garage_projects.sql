-- Seed STI / Mustang projects for the demo garage.
-- Project status already exists remotely (todo | pending | blocked | complete).

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
    and (nickname ilike '%mustang%' or model ilike '%mustang%' or nickname ilike '%stang%')
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
        ('Suspension - coilovers', null::text, 'complete'),
        ('Interior - change to black', null::text, 'complete'),
        ('Audio setup', null::text, 'complete'),
        ('Sway bar and new wheels + tires', null::text, 'complete'),
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
