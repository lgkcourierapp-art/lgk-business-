import { createClient } from '@supabase/supabase-js'

// Service-role client for API routes — bypasses RLS.
// Lazy factory — defers instantiation to request time so the build
// never throws when SUPABASE_SERVICE_ROLE_KEY is absent in CI.
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error(
      '[LGK] SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
      'Admin API routes will not function. ' +
      'Set this in Vercel environment variables.'
    )
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
