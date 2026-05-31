import { createClient } from '@supabase/supabase-js'

// Service-role client for API routes — bypasses RLS.
// Requires SUPABASE_SERVICE_ROLE_KEY env var (server-only, never NEXT_PUBLIC_).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  throw new Error(
    '[LGK] SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
    'Admin API routes will not function. ' +
    'Set this in Vercel environment variables.'
  )
}

if (process.env.NODE_ENV === 'development') {
  console.log('[supabaseAdmin] Service role key loaded ✓')
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
