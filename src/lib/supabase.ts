import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

function readViteEnv(value: unknown) {
  if (typeof value !== 'string') return ''
  // Vercel/dashboard pastes sometimes include wrapping quotes or newlines,
  // which make browser fetch() throw "Invalid value" on Authorization headers.
  const cleaned = value.trim().replace(/^['"]|['"]$/g, '')
  const jwt = cleaned.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)
  if (jwt) return jwt[0]
  const publishable = cleaned.match(/sb_publishable_[A-Za-z0-9_-]+/)
  if (publishable) return publishable[0]
  return cleaned.replace(/[\r\n\u0000-\u001F]+/g, '')
}

const supabaseUrl = readViteEnv(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = readViteEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey !== 'your-anon-key'

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
