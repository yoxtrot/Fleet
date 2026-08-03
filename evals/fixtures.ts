// Two vehicles in one garage. Most evals exist to prove that context built for one of
// them never contains a trace of the other.

import type {
  FixResearchNote,
  MaintenanceRecord,
  Vehicle,
  VehicleProject,
} from '../src/lib/database.types.ts'
import type { VehicleContextSources } from '../supabase/functions/_shared/vehicleContext.ts'

const OWNER_ID = '00000000-0000-4000-8000-000000000001'
const RUNNER_ID = '11111111-1111-4111-8111-111111111111'
const TRAIL_BIKE_ID = '22222222-2222-4222-8222-222222222222'

const TIMESTAMPS = {
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

export const OTHER_VEHICLE_MARKERS = [
  'Trail bike',
  'Stumpjumper',
  'dropper post',
  'fork lowers service',
]

function vehicle(overrides: Partial<Vehicle> & Pick<Vehicle, 'id' | 'nickname'>): Vehicle {
  return {
    user_id: OWNER_ID,
    year: null,
    make: '',
    model: '',
    vehicle_type: 'car',
    vehicle_subtype: null,
    current_mileage: null,
    notes: null,
    photo_path: null,
    ...TIMESTAMPS,
    ...overrides,
  }
}

function maintenanceRecord(
  vehicleId: string,
  id: string,
  performedOn: string,
  title: string,
  extras: Partial<MaintenanceRecord> = {},
): MaintenanceRecord {
  return {
    id,
    user_id: OWNER_ID,
    vehicle_id: vehicleId,
    performed_on: performedOn,
    mileage: null,
    title,
    cost_cents: null,
    performed_by: null,
    notes: null,
    ...TIMESTAMPS,
    ...extras,
  }
}

function researchNote(
  vehicleId: string,
  id: string,
  title: string,
  extras: Partial<FixResearchNote> = {},
): FixResearchNote {
  return {
    id,
    user_id: OWNER_ID,
    vehicle_id: vehicleId,
    maintenance_record_id: null,
    title,
    symptom: null,
    diagnosis: null,
    steps_tried: null,
    parts_list: null,
    external_links: null,
    tags: [],
    ...TIMESTAMPS,
    ...extras,
  }
}

function project(
  vehicleId: string,
  id: string,
  title: string,
  status: VehicleProject['status'] = 'todo',
): VehicleProject {
  return {
    id,
    user_id: OWNER_ID,
    vehicle_id: vehicleId,
    title,
    description: null,
    status,
    image_paths: [],
    part_links: [],
    maintenance_description: null,
    maintenance_mileage_interval_miles: null,
    maintenance_time_interval_days: null,
    ...TIMESTAMPS,
  }
}

export const runnerSources: VehicleContextSources = {
  vehicle: vehicle({
    id: RUNNER_ID,
    nickname: 'Runner',
    year: 2004,
    make: 'Toyota',
    model: '4Runner',
    vehicle_type: 'car',
    current_mileage: 214_000,
    notes: 'Daily driver. Slow coolant loss being monitored.',
  }),
  maintenanceRecords: [
    maintenanceRecord(RUNNER_ID, 'm-1', '2026-05-02', 'Front brake pads and rotors', {
      mileage: 212_400,
      notes: 'Replaced pads and rotors on the front axle. Rears left alone.',
    }),
    maintenanceRecord(RUNNER_ID, 'm-2', '2026-03-11', 'Oil and filter change', {
      mileage: 209_800,
    }),
    maintenanceRecord(RUNNER_ID, 'm-3', '2025-11-20', 'Radiator replacement', {
      mileage: 203_100,
      notes: 'Original radiator was seeping at the end tank.',
    }),
  ],
  projects: [
    project(RUNNER_ID, 'p-0', 'Old Man Emu lift', 'complete'),
    project(RUNNER_ID, 'p-1', 'Rear axle seal refresh', 'todo'),
  ],
  researchNotes: [
    researchNote(RUNNER_ID, 'r-1', 'Brake pedal pulsation under light braking', {
      symptom: 'Steering wheel shimmy and pedal pulsation when braking from highway speed.',
      diagnosis: 'Suspected warped front rotors or uneven pad deposit.',
      tags: ['brakes'],
    }),
    researchNote(RUNNER_ID, 'r-2', 'Coolant smell after long drives', {
      symptom: 'Sweet smell at the front of the engine bay once parked.',
      tags: ['cooling'],
    }),
    researchNote(RUNNER_ID, 'r-3', 'Tailgate window motor intermittent', {
      symptom: 'Rear window only sometimes responds to the key switch.',
      tags: ['electrical'],
    }),
  ],
}

export const trailBikeSources: VehicleContextSources = {
  vehicle: vehicle({
    id: TRAIL_BIKE_ID,
    nickname: 'Trail bike',
    year: 2022,
    make: 'Specialized',
    model: 'Stumpjumper',
    vehicle_type: 'bike',
    vehicle_subtype: 'mountain',
    notes: 'Weekend trail bike.',
  }),
  maintenanceRecords: [
    maintenanceRecord(TRAIL_BIKE_ID, 'm-b1', '2026-04-18', 'Fork lowers service'),
  ],
  projects: [project(TRAIL_BIKE_ID, 'p-b1', 'Dropper post rebuild')],
  researchNotes: [
    researchNote(TRAIL_BIKE_ID, 'r-b1', 'Dropper post sagging under weight', {
      symptom: 'Dropper post slowly sinks when seated.',
      tags: ['dropper post'],
    }),
  ],
}

/** A single oversized free-text field must not be able to consume the whole budget. */
export function sourcesWithPathologicalTitle(): VehicleContextSources {
  return {
    ...runnerSources,
    maintenanceRecords: [
      maintenanceRecord(RUNNER_ID, 'm-huge', '2026-06-01', 'A'.repeat(50_000)),
    ],
    researchNotes: [researchNote(RUNNER_ID, 'r-huge', 'B'.repeat(50_000))],
  }
}

export function sourcesWithLongHistory(recordCount: number): VehicleContextSources {
  return {
    ...runnerSources,
    maintenanceRecords: Array.from({ length: recordCount }, (_, index) =>
      maintenanceRecord(
        RUNNER_ID,
        `bulk-${index}`,
        '2025-01-01',
        `Service visit ${index} with a deliberately long description repeated to consume budget`,
        { notes: 'Filler notes. '.repeat(40) },
      ),
    ),
  }
}
