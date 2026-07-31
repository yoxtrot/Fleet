import type { FixResearchNote, MaintenanceRecord, Vehicle } from '../../src/lib/database.types'

export const sampleUserId = 'user-storybook'

export const sampleVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    user_id: sampleUserId,
    nickname: 'Daily Driver',
    year: 2018,
    make: 'Toyota',
    model: 'Tacoma',
    vehicle_type: 'car',
    vehicle_subtype: null,
    current_mileage: 84210,
    notes: 'Needs cabin filter soon.',
    photo_path: `${sampleUserId}/vehicle-1/photo.jpg`,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'vehicle-2',
    user_id: sampleUserId,
    nickname: 'Weekend Moto',
    year: 2021,
    make: 'Yamaha',
    model: 'MT-07',
    vehicle_type: 'motorcycle',
    vehicle_subtype: 'street',
    current_mileage: 4100,
    notes: null,
    photo_path: null,
    created_at: '2026-01-03T00:00:00.000Z',
    updated_at: '2026-01-03T00:00:00.000Z',
  },
]

export const sampleMaintenance: MaintenanceRecord[] = [
  {
    id: 'maint-1',
    user_id: sampleUserId,
    vehicle_id: 'vehicle-1',
    performed_on: '2026-01-15',
    mileage: 84000,
    title: 'Oil change',
    cost_cents: 6500,
    performed_by: 'Self',
    notes: '5W-30 full synthetic',
    created_at: '2026-01-15T00:00:00.000Z',
    updated_at: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'maint-2',
    user_id: sampleUserId,
    vehicle_id: 'vehicle-1',
    performed_on: '2025-11-02',
    mileage: 81200,
    title: 'Brake pads',
    cost_cents: 18000,
    performed_by: 'Shop',
    notes: null,
    created_at: '2025-11-02T00:00:00.000Z',
    updated_at: '2025-11-02T00:00:00.000Z',
  },
]

export const sampleResearchNotes: FixResearchNote[] = [
  {
    id: 'note-1',
    user_id: sampleUserId,
    vehicle_id: 'vehicle-1',
    maintenance_record_id: null,
    title: 'Squeaky serpentine belt',
    symptom: 'Chirp on cold start',
    diagnosis: 'Belt glazing',
    steps_tried: 'Inspected tensioner',
    parts_list: 'Serpentine belt',
    external_links: 'https://example.com/belt',
    tags: ['engine', 'noise'],
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'note-2',
    user_id: sampleUserId,
    vehicle_id: null,
    maintenance_record_id: null,
    title: 'Battery drain checklist',
    symptom: 'Dead battery overnight',
    diagnosis: null,
    steps_tried: null,
    parts_list: null,
    external_links: null,
    tags: ['electrical'],
    created_at: '2026-01-12T00:00:00.000Z',
    updated_at: '2026-01-12T00:00:00.000Z',
  },
]

export const samplePhotoUrl = 'https://picsum.photos/seed/fleet-tacoma/640/360'
