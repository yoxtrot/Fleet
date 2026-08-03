import type { VehicleProject } from '../../src/lib/database.types'

export const PROJECT_IMAGES_BUCKET = 'project-images'

export type VehicleProjectDraft = {
  vehicle_id: string
  title: string
  description: string | null
  status: VehicleProject['status']
  part_links: string[]
  maintenance_description: string | null
  maintenance_mileage_interval_miles: number | null
  maintenance_time_interval_days: number | null
}

export const PROJECT_STATUSES = ['todo', 'pending', 'blocked', 'complete'] as const

export const PROJECT_STATUS_LABELS: Record<VehicleProject['status'], string> = {
  todo: 'To do',
  pending: 'Pending',
  blocked: 'Blocked',
  complete: 'Completed',
}

const sampleProjects: VehicleProject[] = [
  {
    id: 'project-1',
    user_id: 'user-storybook',
    vehicle_id: 'vehicle-1',
    title: 'Lift kit install',
    description: '2.5" lift with new UCAs.',
    status: 'todo',
    image_paths: ['user-storybook/project-1/a.jpg'],
    part_links: ['https://example.com/lift-kit', 'https://example.com/uca'],
    maintenance_description: null,
    maintenance_mileage_interval_miles: null,
    maintenance_time_interval_days: null,
    created_at: '2026-02-01T00:00:00.000Z',
    updated_at: '2026-02-02T00:00:00.000Z',
  },
]

let projects = [...sampleProjects]

export async function listProjectsForVehicle(vehicleId: string) {
  return projects.filter((row) => row.vehicle_id === vehicleId)
}

export async function getProjectById(projectId: string) {
  const project = projects.find((row) => row.id === projectId)
  if (!project) throw new Error('Project not found')
  return project
}

export async function createProjectForUser(userId: string, draft: VehicleProjectDraft) {
  const created: VehicleProject = {
    id: `project-${projects.length + 1}`,
    user_id: userId,
    image_paths: [],
    maintenance_description: null,
    maintenance_mileage_interval_miles: null,
    maintenance_time_interval_days: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...draft,
  }
  projects = [created, ...projects]
  return created
}

export async function updateProject(projectId: string, draft: Omit<VehicleProjectDraft, 'vehicle_id'>) {
  const existing = await getProjectById(projectId)
  const updated = { ...existing, ...draft, updated_at: new Date().toISOString() }
  projects = projects.map((row) => (row.id === projectId ? updated : row))
  return updated
}

export function getProjectImagePublicUrl(imagePath: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(imagePath)}/640/360`
}

export async function resolveProjectImageUrl(imagePath: string) {
  return getProjectImagePublicUrl(imagePath)
}

export async function uploadProjectImages(_userId: string, project: VehicleProject, files: File[]) {
  const imagePaths = [
    ...project.image_paths,
    ...files.map((_, index) => `${project.user_id}/${project.id}/new-${index}.jpg`),
  ]
  const updated = { ...project, image_paths: imagePaths, updated_at: new Date().toISOString() }
  projects = projects.map((row) => (row.id === project.id ? updated : row))
  return updated
}

export async function removeProjectImage(project: VehicleProject, imagePath: string) {
  const updated = {
    ...project,
    image_paths: project.image_paths.filter((path) => path !== imagePath),
    updated_at: new Date().toISOString(),
  }
  projects = projects.map((row) => (row.id === project.id ? updated : row))
  return updated
}

export async function deleteProject(projectId: string) {
  projects = projects.filter((row) => row.id !== projectId)
}

export function parsePartLinksText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function formatPartLinksText(links: string[]) {
  return links.join('\n')
}

export function monthsToDays(months: number) {
  return months * 30
}

export function daysToMonths(days: number) {
  if (days % 30 !== 0) return null
  return days / 30
}

export function formatMaintenanceTimeInterval(days: number) {
  const months = daysToMonths(days)
  if (months != null) {
    return `Every ${months} month${months === 1 ? '' : 's'}`
  }
  return `Every ${days} day${days === 1 ? '' : 's'}`
}

export function formatProjectMaintenanceInterval(project: VehicleProject) {
  const parts: string[] = []
  if (project.maintenance_mileage_interval_miles != null) {
    parts.push(`Every ${project.maintenance_mileage_interval_miles.toLocaleString()} mi`)
  }
  if (project.maintenance_time_interval_days != null) {
    parts.push(formatMaintenanceTimeInterval(project.maintenance_time_interval_days))
  }
  return parts.join(' · ')
}

export function projectHasMaintenance(project: VehicleProject) {
  return Boolean(project.maintenance_description)
}
