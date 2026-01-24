import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

export const hasSupabasePublicCredentials = Boolean(supabaseUrl) && Boolean(supabaseAnonKey)

// Don't throw error - just log warning and allow password login fallback
if (!hasSupabasePublicCredentials && !isBuildPhase) {
  console.warn(
    'Supabase public credentials are missing. Microsoft SSO will be disabled, password login will be used instead.'
  )
}

// Create Supabase client only if credentials are available, otherwise null
export const supabaseBrowser = hasSupabasePublicCredentials
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
