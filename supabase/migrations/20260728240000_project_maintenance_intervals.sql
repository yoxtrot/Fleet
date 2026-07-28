-- Move maintenance intervals onto vehicle projects; drop vehicle-level schedules

alter table public.vehicle_projects
  add column if not exists maintenance_description text,
  add column if not exists maintenance_mileage_interval_miles integer,
  add column if not exists maintenance_time_interval_days integer;

alter table public.vehicle_projects
  drop constraint if exists vehicle_projects_maintenance_interval;

alter table public.vehicle_projects
  add constraint vehicle_projects_maintenance_interval check (
    (
      maintenance_description is null
      and maintenance_mileage_interval_miles is null
      and maintenance_time_interval_days is null
    )
    or (
      maintenance_description is not null
      and (
        maintenance_mileage_interval_miles is not null
        or maintenance_time_interval_days is not null
      )
    )
  );

alter table public.vehicle_projects
  drop constraint if exists vehicle_projects_maintenance_mileage_positive;

alter table public.vehicle_projects
  add constraint vehicle_projects_maintenance_mileage_positive check (
    maintenance_mileage_interval_miles is null
    or maintenance_mileage_interval_miles > 0
  );

alter table public.vehicle_projects
  drop constraint if exists vehicle_projects_maintenance_time_positive;

alter table public.vehicle_projects
  add constraint vehicle_projects_maintenance_time_positive check (
    maintenance_time_interval_days is null
    or maintenance_time_interval_days > 0
  );

drop table if exists public.maintenance_schedules;
