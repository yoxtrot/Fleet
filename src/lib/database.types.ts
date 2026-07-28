export type Vehicle = {
  id: string
  user_id: string
  nickname: string
  year: number | null
  make: string
  model: string
  vin: string | null
  current_mileage: number | null
  notes: string | null
  photo_path: string | null
  created_at: string
  updated_at: string
}

export type MaintenanceRecord = {
  id: string
  user_id: string
  vehicle_id: string
  performed_on: string
  mileage: number | null
  title: string
  cost_cents: number | null
  performed_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type FixResearchNote = {
  id: string
  user_id: string
  vehicle_id: string | null
  maintenance_record_id: string | null
  title: string
  symptom: string | null
  diagnosis: string | null
  steps_tried: string | null
  parts_list: string | null
  external_links: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type VehicleProject = {
  id: string
  user_id: string
  vehicle_id: string
  title: string
  description: string | null
  image_paths: string[]
  part_links: string[]
  created_at: string
  updated_at: string
}

export type MaintenanceSchedule = {
  id: string
  user_id: string
  vehicle_id: string
  description: string
  mileage_interval_miles: number | null
  time_interval_days: number | null
  created_at: string
  updated_at: string
}

type VehiclesTable = {
  Row: Vehicle
  Insert: {
    id?: string
    user_id: string
    nickname: string
    year?: number | null
    make: string
    model: string
    vin?: string | null
    current_mileage?: number | null
    notes?: string | null
    photo_path?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    nickname?: string
    year?: number | null
    make?: string
    model?: string
    vin?: string | null
    current_mileage?: number | null
    notes?: string | null
    photo_path?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

type MaintenanceRecordsTable = {
  Row: MaintenanceRecord
  Insert: {
    id?: string
    user_id: string
    vehicle_id: string
    performed_on: string
    mileage?: number | null
    title: string
    cost_cents?: number | null
    performed_by?: string | null
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    vehicle_id?: string
    performed_on?: string
    mileage?: number | null
    title?: string
    cost_cents?: number | null
    performed_by?: string | null
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'maintenance_records_vehicle_id_fkey'
      columns: ['vehicle_id']
      isOneToOne: false
      referencedRelation: 'vehicles'
      referencedColumns: ['id']
    },
  ]
}

type FixResearchNotesTable = {
  Row: FixResearchNote
  Insert: {
    id?: string
    user_id: string
    vehicle_id?: string | null
    maintenance_record_id?: string | null
    title: string
    symptom?: string | null
    diagnosis?: string | null
    steps_tried?: string | null
    parts_list?: string | null
    external_links?: string | null
    tags?: string[]
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    vehicle_id?: string | null
    maintenance_record_id?: string | null
    title?: string
    symptom?: string | null
    diagnosis?: string | null
    steps_tried?: string | null
    parts_list?: string | null
    external_links?: string | null
    tags?: string[]
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'fix_research_notes_vehicle_id_fkey'
      columns: ['vehicle_id']
      isOneToOne: false
      referencedRelation: 'vehicles'
      referencedColumns: ['id']
    },
    {
      foreignKeyName: 'fix_research_notes_maintenance_record_id_fkey'
      columns: ['maintenance_record_id']
      isOneToOne: false
      referencedRelation: 'maintenance_records'
      referencedColumns: ['id']
    },
  ]
}

type VehicleProjectsTable = {
  Row: VehicleProject
  Insert: {
    id?: string
    user_id: string
    vehicle_id: string
    title: string
    description?: string | null
    image_paths?: string[]
    part_links?: string[]
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    vehicle_id?: string
    title?: string
    description?: string | null
    image_paths?: string[]
    part_links?: string[]
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'vehicle_projects_vehicle_id_fkey'
      columns: ['vehicle_id']
      isOneToOne: false
      referencedRelation: 'vehicles'
      referencedColumns: ['id']
    },
  ]
}

type MaintenanceSchedulesTable = {
  Row: MaintenanceSchedule
  Insert: {
    id?: string
    user_id: string
    vehicle_id: string
    description: string
    mileage_interval_miles?: number | null
    time_interval_days?: number | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    vehicle_id?: string
    description?: string
    mileage_interval_miles?: number | null
    time_interval_days?: number | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'maintenance_schedules_vehicle_id_fkey'
      columns: ['vehicle_id']
      isOneToOne: false
      referencedRelation: 'vehicles'
      referencedColumns: ['id']
    },
  ]
}

export type Database = {
  public: {
    Tables: {
      vehicles: VehiclesTable
      maintenance_records: MaintenanceRecordsTable
      fix_research_notes: FixResearchNotesTable
      vehicle_projects: VehicleProjectsTable
      maintenance_schedules: MaintenanceSchedulesTable
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
