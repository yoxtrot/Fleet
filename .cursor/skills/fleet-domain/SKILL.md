---
name: fleet-domain
description: >-
  Explains Fleet garage domain language and schema for vehicles, maintenance
  records, and fix research notes. Use when changing vehicle, maintenance, or
  research features, migrations, or API helpers.
---

# Fleet domain

## Core entities

- `Vehicle` — a car/truck/motorcycle in the personal fleet (`vehicles`)
- `MaintenanceRecord` — logged service/work against a vehicle (`maintenance_records`)
- `FixResearchNote` — research archive for symptoms, diagnosis, steps, parts, links (`fix_research_notes`)

## Relationships

- One vehicle has many maintenance records
- Research notes optionally link to a vehicle and optionally to a maintenance record
- Every row is owned by `user_id` and protected by RLS (`auth.uid() = user_id`)

## Naming

Use the entity names above in types, functions, and UI copy. Prefer:

- `listMaintenanceForVehicle`
- `createResearchNote`
- `getOverdueMaintenanceForVehicle` (when reminders exist later)

Avoid vague names like `item`, `data`, `record` without a domain qualifier.

## Key files

- Schema: `supabase/migrations/`
- Types: `src/lib/database.types.ts`
- Features: `src/features/vehicles|maintenance|research/`
