import { supabase } from '../../lib/supabase'
import type { VehicleProject } from '../../lib/database.types'

export const PROJECT_IMAGES_BUCKET = 'project-images'
const MAX_PROJECT_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_PROJECT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type VehicleProjectDraft = {
  vehicle_id: string
  title: string
  description: string | null
  part_links: string[]
}

export async function listProjectsForVehicle(vehicleId: string) {
  const { data, error } = await supabase
    .from('vehicle_projects')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as VehicleProject[]
}

export async function getProjectById(projectId: string) {
  const { data, error } = await supabase
    .from('vehicle_projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data as VehicleProject
}

export async function createProjectForUser(userId: string, draft: VehicleProjectDraft) {
  const { data, error } = await supabase
    .from('vehicle_projects')
    .insert({ ...draft, user_id: userId, image_paths: [] })
    .select('*')
    .single()

  if (error) throw error
  return data as VehicleProject
}

export async function updateProject(projectId: string, draft: Omit<VehicleProjectDraft, 'vehicle_id'>) {
  const { data, error } = await supabase
    .from('vehicle_projects')
    .update({
      title: draft.title,
      description: draft.description,
      part_links: draft.part_links,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select('*')
    .single()

  if (error) throw error
  return data as VehicleProject
}

export function getProjectImagePublicUrl(imagePath: string) {
  const { data } = supabase.storage.from(PROJECT_IMAGES_BUCKET).getPublicUrl(imagePath)
  return data.publicUrl
}

export async function resolveProjectImageUrl(imagePath: string) {
  const { data, error } = await supabase.storage
    .from(PROJECT_IMAGES_BUCKET)
    .createSignedUrl(imagePath, 60 * 60)

  if (!error && data.signedUrl) return data.signedUrl
  return getProjectImagePublicUrl(imagePath)
}

function extensionForImage(file: File) {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

function assertValidProjectImage(file: File) {
  if (!ALLOWED_PROJECT_IMAGE_TYPES.has(file.type)) {
    throw new Error('Project images must be JPEG, PNG, or WebP')
  }
  if (file.size > MAX_PROJECT_IMAGE_BYTES) {
    throw new Error('Each project image must be 5 MB or smaller')
  }
}

export async function uploadProjectImages(userId: string, project: VehicleProject, files: File[]) {
  if (files.length === 0) return project

  const uploadedPaths: string[] = []
  for (const file of files) {
    assertValidProjectImage(file)
    const imagePath = `${userId}/${project.id}/${crypto.randomUUID()}.${extensionForImage(file)}`
    const { error: uploadError } = await supabase.storage
      .from(PROJECT_IMAGES_BUCKET)
      .upload(imagePath, file, { upsert: false, contentType: file.type })

    if (uploadError) {
      const message = uploadError.message.toLowerCase()
      if (message.includes('bucket') || message.includes('not found')) {
        throw new Error(
          'Project image storage is not set up yet. Run the vehicle projects migration (or say “update the database”), then try again.',
        )
      }
      throw uploadError
    }
    uploadedPaths.push(imagePath)
  }

  const imagePaths = [...project.image_paths, ...uploadedPaths]
  const { data, error } = await supabase
    .from('vehicle_projects')
    .update({ image_paths: imagePaths, updated_at: new Date().toISOString() })
    .eq('id', project.id)
    .select('*')
    .single()

  if (error) throw error
  return data as VehicleProject
}

export async function removeProjectImage(project: VehicleProject, imagePath: string) {
  const { error: removeError } = await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove([imagePath])
  if (removeError) throw removeError

  const imagePaths = project.image_paths.filter((path) => path !== imagePath)
  const { data, error } = await supabase
    .from('vehicle_projects')
    .update({ image_paths: imagePaths, updated_at: new Date().toISOString() })
    .eq('id', project.id)
    .select('*')
    .single()

  if (error) throw error
  return data as VehicleProject
}

export async function deleteProject(projectId: string) {
  const project = await getProjectById(projectId)
  if (project.image_paths.length > 0) {
    await supabase.storage.from(PROJECT_IMAGES_BUCKET).remove(project.image_paths)
  }

  const { error } = await supabase.from('vehicle_projects').delete().eq('id', projectId)
  if (error) throw error
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
