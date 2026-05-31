import { createClient } from '@supabase/supabase-js'

// Service-role client for API routes — bypasses RLS.
// Requires SUPABASE_SERVICE_ROLE_KEY env var (server-only, never NEXT_PUBLIC_).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'Admin routes will not work. ' +
    'Set this environment variable in Vercel.'
  )
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
