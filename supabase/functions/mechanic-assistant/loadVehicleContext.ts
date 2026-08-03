// Loads the context sources for a single vehicle using the caller's own credentials.
//
// Every query is filtered by vehicle id, and the client carries the user's JWT so row
// level security independently enforces ownership. The scope boundary is therefore held
// by the database rather than by the prompt.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import {
  MAX_COMPLETED_PROJECTS,
  MAX_MAINTENANCE_RECORDS,
  MAX_OPEN_PROJECTS,
  MAX_RESEARCH_NOTES,
  type VehicleContextSources,
} from '../_shared/vehicleContext.ts'

// Research notes are over-fetched so that relevance ranking has candidates to choose
// from before the context builder trims to the notes that match the question.
const RESEARCH_NOTE_CANDIDATES = MAX_RESEARCH_NOTES * 4
const PROJECT_CANDIDATES = MAX_COMPLETED_PROJECTS + MAX_OPEN_PROJECTS

export async function loadVehicleContextSources(
  userClient: SupabaseClient,
  vehicleId: string,
): Promise<VehicleContextSources | null> {
  const { data: vehicle } = await userClient
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .maybeSingle()

  if (!vehicle) return null

  const [maintenance, projects, research] = await Promise.all([
    userClient
      .from('maintenance_records')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('performed_on', { ascending: false })
      .limit(MAX_MAINTENANCE_RECORDS),
    userClient
      .from('vehicle_projects')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('updated_at', { ascending: false })
      .limit(PROJECT_CANDIDATES),
    userClient
      .from('fix_research_notes')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('updated_at', { ascending: false })
      .limit(RESEARCH_NOTE_CANDIDATES),
  ])

  return {
    vehicle,
    maintenanceRecords: maintenance.data ?? [],
    projects: projects.data ?? [],
    researchNotes: research.data ?? [],
  }
}
