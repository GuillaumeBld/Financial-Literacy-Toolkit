import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

export const hasSupabasePublicCredentials = Boolean(supabaseUrl) && Boolean(supabaseAnonKey)

if (!hasSupabasePublicCredentials && !isBuildPhase) {
  throw new Error('Missing Supabase public configuration environment variables')
}

if (!hasSupabasePublicCredentials) {
  console.warn(
    'Supabase public credentials are missing. Using placeholder values for build-time steps.'
  )
}

export const supabaseBrowser = createClient(
  supabaseUrl || 'https://placeholder.supabase.local',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
