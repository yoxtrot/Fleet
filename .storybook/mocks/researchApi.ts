import type { FixResearchNote } from '../../src/lib/database.types'
import { sampleResearchNotes, sampleUserId } from './fixtures'

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

let notes = [...sampleResearchNotes]

export async function listResearchNotesForUser(_userId: string) {
  return notes
}

export async function listRecentResearchForUser(_userId: string, limit = 5) {
  return notes.slice(0, limit)
}

export async function getResearchNoteById(noteId: string) {
  const note = notes.find((row) => row.id === noteId)
  if (!note) throw new Error('Research note not found')
  return note
}

export async function createResearchNote(userId: string, draft: ResearchDraft) {
  const created: FixResearchNote = {
    id: `note-${notes.length + 1}`,
    user_id: userId || sampleUserId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...draft,
  }
  notes = [created, ...notes]
  return created
}

export async function updateResearchNote(noteId: string, draft: ResearchDraft) {
  const existing = await getResearchNoteById(noteId)
  const updated = { ...existing, ...draft, updated_at: new Date().toISOString() }
  notes = notes.map((row) => (row.id === noteId ? updated : row))
  return updated
}

export async function deleteResearchNote(noteId: string) {
  notes = notes.filter((row) => row.id !== noteId)
}
