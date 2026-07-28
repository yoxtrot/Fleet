#!/usr/bin/env node
/**
 * Link the Fleet Supabase project and push pending SQL migrations.
 * Loads secrets from .env.supabase (and project URL from .env.local if needed).
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) return
  const text = fs.readFileSync(absolutePath, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separatorIndex = line.indexOf('=')
    if (separatorIndex < 0) continue
    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

function projectIdFromSupabaseUrl(url) {
  if (!url) return null
  const match = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i)
  return match?.[1] ?? null
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

function runSupabase(args) {
  const result = spawnSync('npx', ['supabase', ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  })
  if (result.error) fail(result.error.message)
  if (result.status !== 0) process.exit(result.status ?? 1)
}

loadEnvFile('.env.supabase')
loadEnvFile('.env.local')

const accessToken = process.env.SUPABASE_ACCESS_TOKEN
const dbPassword = process.env.SUPABASE_DB_PASSWORD
const projectId =
  process.env.SUPABASE_PROJECT_ID || projectIdFromSupabaseUrl(process.env.VITE_SUPABASE_URL)

if (!accessToken) {
  fail(
    'Missing SUPABASE_ACCESS_TOKEN. Copy .env.supabase.example to .env.supabase and add a personal access token from https://supabase.com/dashboard/account/tokens',
  )
}
if (!dbPassword) {
  fail(
    'Missing SUPABASE_DB_PASSWORD. Copy .env.supabase.example to .env.supabase and set your project database password.',
  )
}
if (!projectId) {
  fail(
    'Missing SUPABASE_PROJECT_ID (or VITE_SUPABASE_URL in .env.local). Set the project ref, e.g. biwqkkmozwpcozwnzcaz.',
  )
}

process.env.SUPABASE_ACCESS_TOKEN = accessToken
process.env.SUPABASE_DB_PASSWORD = dbPassword
process.env.SUPABASE_PROJECT_ID = projectId

const includeAll = process.argv.includes('--include-all')
const dryRun = process.argv.includes('--dry-run')

console.log(`Linking Supabase project ${projectId}…`)
runSupabase(['link', '--project-ref', projectId, '--yes'])

const pushArgs = ['db', 'push', '--linked', '--yes']
if (includeAll) pushArgs.push('--include-all')
if (dryRun) pushArgs.push('--dry-run')

console.log(dryRun ? 'Dry-run: migrations that would be applied…' : 'Pushing pending migrations…')
runSupabase(pushArgs)
console.log(dryRun ? 'Dry-run finished.' : 'Database update finished.')
