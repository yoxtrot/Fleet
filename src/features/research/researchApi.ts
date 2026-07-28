import { supabase } from '../../lib/supabase'
import type { FixResearchNote } from '../../lib/database.types'

export type ResearchDraft = {
  vehicle_id: string | null
  maintenance_record_id: string | null
  title: string
  symptom: string | null
  diagnosis: string | null
  steps_tried: string | null
  parts_list: string | null
  external_links: string | null
  tags: string[]
}

export async function listResearchNotesForUser(userId: string) {
  const { data, error } = await supabase
    .from('fix_research_notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as FixResearchNote[]
}

export async function listRecentResearchForUser(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from('fix_research_notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as FixResearchNote[]
}

export async function getResearchNoteById(noteId: string) {
  const { data, error } = await supabase.from('fix_research_notes').select('*').eq('id', noteId).single()
  if (error) throw error
  return data as FixResearchNote
}

export async function createResearchNote(userId: string, draft: ResearchDraft) {
  const { data, error } = await supabase
    .from('fix_research_notes')
    .insert({ ...draft, user_id: userId })
    .select('*')
    .single()

  if (error) throw error
  return data as FixResearchNote
}

export async function updateResearchNote(noteId: string, draft: ResearchDraft) {
  const { data, error } = await supabase
    .from('fix_research_notes')
    .update({ ...draft, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .select('*')
    .single()

  if (error) throw error
  return data as FixResearchNote
}

export async function deleteResearchNote(noteId: string) {
  const { error } = await supabase.from('fix_research_notes').delete().eq('id', noteId)
  if (error) throw error
}
