// Assembles the model's entire view of the garage for one vehicle.
//
// Two rules drive everything here. The assistant may only ever see the vehicle the user
// is currently viewing, so scoping happens when the rows are selected rather than by
// asking the model to ignore things. And the rendered context is bounded, because an
// unbounded history would eventually crowd out the user's actual question.

import type {
  FixResearchNote,
  MaintenanceRecord,
  Vehicle,
  VehicleProject,
} from '../../../src/lib/database.types.ts'

export const MAX_MAINTENANCE_RECORDS = 12
export const MAX_PROJECTS = 6
export const MAX_RESEARCH_NOTES = 6
export const MAX_FIELD_CHARACTERS = 400
export const MAX_CONTEXT_CHARACTERS = 12_000

export type VehicleContextSources = {
  vehicle: Vehicle
  maintenanceRecords: MaintenanceRecord[]
  projects: VehicleProject[]
  researchNotes: FixResearchNote[]
}

export type RenderedVehicleContext = {
  text: string
  includedMaintenanceRecords: number
  includedProjects: number
  includedResearchNotes: number
  characterCount: number
}

function truncate(value: string | null | undefined, limit = MAX_FIELD_CHARACTERS) {
  if (!value) return null
  const collapsed = value.replace(/\s+/g, ' ').trim()
  if (!collapsed) return null
  return collapsed.length <= limit ? collapsed : `${collapsed.slice(0, limit)}…`
}

function labelledLine(label: string, value: string | null) {
  return value ? `${label}: ${value}` : null
}

function joinLines(lines: (string | null)[]) {
  return lines.filter((line): line is string => Boolean(line)).join('\n')
}

function keywordsOf(text: string) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  )
}

/**
 * Lexical relevance ranking, not vector search. Overlap on distinctive words is enough
 * to surface the right prior note in a garage-sized corpus, and it avoids standing up
 * an embedding pipeline for a few dozen rows. Swapping in pgvector would only change
 * this function.
 */
export function selectRelevantResearchNotes(
  notes: FixResearchNote[],
  question: string,
  limit = MAX_RESEARCH_NOTES,
) {
  const questionKeywords = keywordsOf(question)
  if (questionKeywords.size === 0) return notes.slice(0, limit)

  return notes
    .map((note) => {
      const haystack = [note.title, note.symptom, note.diagnosis, note.tags.join(' ')]
        .filter(Boolean)
        .join(' ')
      const overlap = [...keywordsOf(haystack)].filter((word) => questionKeywords.has(word)).length
      return { note, overlap }
    })
    .sort((left, right) => right.overlap - left.overlap)
    .slice(0, limit)
    .map((scored) => scored.note)
}

function renderVehicleIdentity(vehicle: Vehicle) {
  const name = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
  return joinLines([
    '## Vehicle',
    `Nickname: ${vehicle.nickname}`,
    labelledLine('Vehicle', name || null),
    labelledLine('Type', vehicle.vehicle_subtype ? `${vehicle.vehicle_type} (${vehicle.vehicle_subtype})` : vehicle.vehicle_type),
    labelledLine('Current mileage', vehicle.current_mileage === null ? null : `${vehicle.current_mileage}`),
    labelledLine('Owner notes', truncate(vehicle.notes)),
  ])
}

function renderMaintenanceHistory(records: MaintenanceRecord[]) {
  if (records.length === 0) return '## Maintenance history\nNo maintenance records logged.'

  const lines = records.map((record) => {
    const mileage = record.mileage === null ? '' : ` at ${record.mileage} mi`
    const notes = truncate(record.notes, 200)
    return `- ${record.performed_on}${mileage}: ${record.title}${notes ? ` — ${notes}` : ''}`
  })
  return ['## Maintenance history', ...lines].join('\n')
}

function renderProjects(projects: VehicleProject[]) {
  if (projects.length === 0) return null

  const lines = projects.map((project) => {
    const description = truncate(project.description, 200)
    return `- ${project.title}${description ? ` — ${description}` : ''}`
  })
  return ['## Open projects', ...lines].join('\n')
}

function renderResearchNotes(notes: FixResearchNote[]) {
  if (notes.length === 0) return null

  const blocks = notes.map((note) =>
    joinLines([
      `- ${note.title}`,
      labelledLine('  Symptom', truncate(note.symptom, 240)),
      labelledLine('  Diagnosis', truncate(note.diagnosis, 240)),
      labelledLine('  Steps tried', truncate(note.steps_tried, 240)),
    ]),
  )
  return ['## Prior research notes', ...blocks].join('\n')
}

export function renderVehicleContext(
  sources: VehicleContextSources,
  question: string,
): RenderedVehicleContext {
  const maintenanceRecords = sources.maintenanceRecords.slice(0, MAX_MAINTENANCE_RECORDS)
  const projects = sources.projects.slice(0, MAX_PROJECTS)
  const researchNotes = selectRelevantResearchNotes(sources.researchNotes, question)

  const sections = [
    renderVehicleIdentity(sources.vehicle),
    renderMaintenanceHistory(maintenanceRecords),
    renderProjects(projects),
    renderResearchNotes(researchNotes),
  ].filter((section): section is string => Boolean(section))

  const joined = sections.join('\n\n')
  const text =
    joined.length <= MAX_CONTEXT_CHARACTERS
      ? joined
      : `${joined.slice(0, MAX_CONTEXT_CHARACTERS)}\n\n[context truncated to fit the budget]`

  return {
    text,
    includedMaintenanceRecords: maintenanceRecords.length,
    includedProjects: projects.length,
    includedResearchNotes: researchNotes.length,
    characterCount: text.length,
  }
}
