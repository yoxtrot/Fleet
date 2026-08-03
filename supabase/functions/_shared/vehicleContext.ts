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
export const MAX_COMPLETED_PROJECTS = 10
export const MAX_OPEN_PROJECTS = 8
export const MAX_RESEARCH_NOTES = 6
export const MAX_FIELD_CHARACTERS = 400
export const MAX_TITLE_CHARACTERS = 160
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

function vehicleYearMakeModel(vehicle: Vehicle) {
  return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
}

function renderVehicleIdentity(vehicle: Vehicle) {
  const yearMakeModel = vehicleYearMakeModel(vehicle)
  return joinLines([
    '## Vehicle identity',
    labelledLine('Year / make / model', yearMakeModel || null),
    labelledLine('Year', vehicle.year === null ? null : String(vehicle.year)),
    labelledLine('Make', truncate(vehicle.make, MAX_TITLE_CHARACTERS)),
    labelledLine('Model', truncate(vehicle.model, MAX_TITLE_CHARACTERS)),
    labelledLine('Nickname', truncate(vehicle.nickname, MAX_TITLE_CHARACTERS)),
    labelledLine(
      'Type',
      vehicle.vehicle_subtype
        ? `${vehicle.vehicle_type} (${vehicle.vehicle_subtype})`
        : vehicle.vehicle_type,
    ),
    labelledLine(
      'Current mileage',
      vehicle.current_mileage === null ? null : `${vehicle.current_mileage}`,
    ),
    labelledLine('Owner notes', truncate(vehicle.notes)),
  ])
}

function renderMaintenanceHistory(records: MaintenanceRecord[]) {
  if (records.length === 0) return '## Maintenance history\nNo maintenance records logged.'

  const lines = records.map((record) => {
    const mileage = record.mileage === null ? '' : ` at ${record.mileage} mi`
    const notes = truncate(record.notes, 200)
    const title = truncate(record.title, MAX_TITLE_CHARACTERS)
    return `- ${record.performed_on}${mileage}: ${title}${notes ? ` — ${notes}` : ''}`
  })
  return ['## Maintenance history', ...lines].join('\n')
}

function renderProjectLine(project: VehicleProject) {
  const description = truncate(project.description, 200)
  return `- ${truncate(project.title, MAX_TITLE_CHARACTERS)}${description ? ` — ${description}` : ''}`
}

function renderProjects(projects: VehicleProject[]) {
  const completed = projects
    .filter((project) => project.status === 'complete')
    .slice(0, MAX_COMPLETED_PROJECTS)
  const open = projects
    .filter((project) => project.status !== 'complete')
    .slice(0, MAX_OPEN_PROJECTS)

  if (completed.length === 0 && open.length === 0) {
    return '## Projects\nNo projects logged for this vehicle.'
  }

  const sections: string[] = []
  if (completed.length > 0) {
    sections.push(
      '## Completed projects (already performed on this vehicle)',
      ...completed.map(renderProjectLine),
    )
  } else {
    sections.push('## Completed projects (already performed on this vehicle)', 'None logged.')
  }

  if (open.length > 0) {
    sections.push(
      '',
      '## Open projects (planned or in progress)',
      ...open.map((project) => {
        const status = project.status === 'pending' ? 'pending' : 'to do'
        const description = truncate(project.description, 200)
        return `- [${status}] ${truncate(project.title, MAX_TITLE_CHARACTERS)}${
          description ? ` — ${description}` : ''
        }`
      }),
    )
  }

  return sections.join('\n')
}

function renderResearchNotes(notes: FixResearchNote[]) {
  if (notes.length === 0) return null

  const blocks = notes.map((note) =>
    joinLines([
      `- ${truncate(note.title, MAX_TITLE_CHARACTERS)}`,
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
  const researchNotes = selectRelevantResearchNotes(sources.researchNotes, question)
  const includedProjects =
    Math.min(
      sources.projects.filter((project) => project.status === 'complete').length,
      MAX_COMPLETED_PROJECTS,
    ) +
    Math.min(
      sources.projects.filter((project) => project.status !== 'complete').length,
      MAX_OPEN_PROJECTS,
    )

  const sections = [
    renderVehicleIdentity(sources.vehicle),
    renderProjects(sources.projects),
    renderMaintenanceHistory(maintenanceRecords),
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
    includedProjects,
    includedResearchNotes: researchNotes.length,
    characterCount: text.length,
  }
}
