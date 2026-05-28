import { createClient } from '@supabase/supabase-js'

// Service-role client for API routes — bypasses RLS.
// Requires SUPABASE_SERVICE_ROLE_KEY env var (server-only, never NEXT_PUBLIC_).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.warn('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY not set — API routes will fail RLS checks')
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
