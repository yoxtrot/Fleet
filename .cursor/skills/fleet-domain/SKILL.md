---
name: fleet-domain
description: >-
  Explains Fleet garage domain language and schema for vehicles, maintenance
  records, and research notes. Use when changing vehicle, maintenance, or
  research features, migrations, or API helpers.
---

# Fleet domain

## Core entities

- `Vehicle` — a car/truck/motorcycle in the personal fleet (`vehicles`)
- `VehicleProject` — planned work on a vehicle with images and parts links (`vehicle_projects`)
- `MaintenanceSchedule` — recurring service interval on a vehicle (`maintenance_schedules`)
- `MaintenanceRecord` — logged service/work against a vehicle (`maintenance_records`)
- `FixResearchNote` — research archive for symptoms, diagnosis, steps, parts, links (`fix_research_notes`)

## Relationships

- One vehicle has many projects, maintenance schedules, and maintenance records
- Research notes optionally link to a vehicle and optionally to a maintenance record
- Every row is owned by `user_id` and protected by RLS (`auth.uid() = user_id`)

## Naming

Use the entity names above in types, functions, and UI copy. Prefer:

- `listProjectsForVehicle`
- `createProjectForUser`
- `listMaintenanceSchedulesForVehicle`
- `createMaintenanceSchedule`
- `listMaintenanceForVehicle`
- `createResearchNote`
- `getOverdueMaintenanceForVehicle` (when reminders exist later)

Avoid vague names like `item`, `data`, `record` without a domain qualifier.

## Key files

- Schema: `supabase/migrations/`
- Types: `src/lib/database.types.ts`
- Features: `src/features/vehicles|projects|maintenance|research/`
