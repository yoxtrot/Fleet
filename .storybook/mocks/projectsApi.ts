import type { VehicleProject } from '../../src/lib/database.types'

export const PROJECT_IMAGES_BUCKET = 'project-images'

export type VehicleProjectDraft = {
  vehicle_id: string
  title: string
  description: string | null
  part_links: string[]
}

const sampleProjects: VehicleProject[] = [
  {
    id: 'project-1',
    user_id: 'user-storybook',
    vehicle_id: 'vehicle-1',
    title: 'Lift kit install',
    description: '2.5" lift with new UCAs.',
    image_paths: ['user-storybook/project-1/a.jpg'],
    part_links: ['https://example.com/lift-kit', 'https://example.com/uca'],
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
