-- Add vehicle type / subtype; drop VIN. Existing rows become cars.

alter table public.vehicles
  add column if not exists vehicle_type text,
  add column if not exists vehicle_subtype text;

update public.vehicles
set vehicle_type = coalesce(vehicle_type, 'car'),
    vehicle_subtype = case
      when coalesce(vehicle_type, 'car') = 'car' then null
      else vehicle_subtype
    end;

alter table public.vehicles
  alter column vehicle_type set default 'car',
  alter column vehicle_type set not null;

alter table public.vehicles
  drop constraint if exists vehicles_vehicle_type_check;

alter table public.vehicles
  add constraint vehicles_vehicle_type_check
  check (vehicle_type in ('car', 'bike', 'motorcycle'));

alter table public.vehicles
  drop constraint if exists vehicles_vehicle_subtype_check;

alter table public.vehicles
  add constraint vehicles_vehicle_subtype_check
  check (
    vehicle_subtype is null
    or vehicle_subtype in ('road', 'gravel', 'mountain', 'street', 'dirt_bike')
  );

alter table public.vehicles
  drop constraint if exists vehicles_type_subtype_consistency_check;

alter table public.vehicles
  add constraint vehicles_type_subtype_consistency_check
  check (
    (vehicle_type = 'car' and vehicle_subtype is null)
    or (vehicle_type = 'bike' and vehicle_subtype in ('road', 'gravel', 'mountain'))
    or (vehicle_type = 'motorcycle' and vehicle_subtype in ('street', 'dirt_bike'))
  );

alter table public.vehicles
  drop column if exists vin;
