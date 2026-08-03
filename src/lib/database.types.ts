export type Vehicle = {
  id: string
  user_id: string
  nickname: string
  year: number | null
  make: string
  model: string
  vehicle_type: 'car' | 'bike' | 'motorcycle'
  vehicle_subtype: 'road' | 'gravel' | 'mountain' | 'street' | 'dirt_bike' | null
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
  maintenance_description: string | null
  maintenance_mileage_interval_miles: number | null
  maintenance_time_interval_days: number | null
  created_at: string
  updated_at: string
}

export type AiModelCall = {
  id: string
  user_id: string
  trace_id: string
  feature: string
  model: string
  prompt_version: string
  status: 'succeeded' | 'failed'
  finish_reason: string | null
  error_message: string | null
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  cost_micro_usd: number | null
  pricing_version: string
  latency_ms: number
  created_at: string
}

export type AiPromptLog = {
  id: string
  model_call_id: string
  user_id: string
  system_prompt: string
  rendered_context: string
  user_message: string
  response_text: string | null
  created_at: string
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
    vehicle_type?: 'car' | 'bike' | 'motorcycle'
    vehicle_subtype?: 'road' | 'gravel' | 'mountain' | 'street' | 'dirt_bike' | null
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
    vehicle_type?: 'car' | 'bike' | 'motorcycle'
    vehicle_subtype?: 'road' | 'gravel' | 'mountain' | 'street' | 'dirt_bike' | null
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
    maintenance_description?: string | null
    maintenance_mileage_interval_miles?: number | null
    maintenance_time_interval_days?: number | null
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
    maintenance_description?: string | null
    maintenance_mileage_interval_miles?: number | null
    maintenance_time_interval_days?: number | null
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

// Observability rows are written only by Edge Functions holding the service role. The
// browser has select-only RLS, so the write shapes exist purely to satisfy the client
// generics and are never used from `src`.
type AiModelCallsTable = {
  Row: AiModelCall
  Insert: AiModelCall
  Update: Partial<AiModelCall>
  Relationships: []
}

type AiPromptLogsTable = {
  Row: AiPromptLog
  Insert: AiPromptLog
  Update: Partial<AiPromptLog>
  Relationships: [
    {
      foreignKeyName: 'ai_prompt_logs_model_call_id_fkey'
      columns: ['model_call_id']
      isOneToOne: false
      referencedRelation: 'ai_model_calls'
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
      ai_model_calls: AiModelCallsTable
      ai_prompt_logs: AiPromptLogsTable
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
