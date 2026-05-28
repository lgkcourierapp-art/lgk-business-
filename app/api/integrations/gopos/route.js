import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function extractApiKey(request) {
  const auth = request.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim()
  return request.headers.get('x-lgk-api-key')?.trim() ?? null
}

export async function POST(request) {
  // Feature flag check
  const { data: flagRow } = await supabaseAdmin
    .from('feature_flags')
    .select('enabled')
    .eq('name', 'gopos_integration')
    .single()

  if (!flagRow?.enabled) {
    return NextResponse.json({ error: 'Integration disabled' }, { status: 503 })
  }

  // Validate API key (same pattern as gloriaFood)
  const rawKey = extractApiKey(request)
  if (!rawKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  const { data: keyRow, error: keyErr } = await supabaseAdmin
    .from('api_keys')
    .select('id')
    .eq('key_hash', keyHash)
    .eq('integration_type', 'goPOS')
    .eq('is_active', true)
    .single()

  if (keyErr || !keyRow) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // Rails-only stub — not yet implemented
  return NextResponse.json(
    {
      success: false,
      message: 'GoPOS coming Q3 2026',
      contact: 'lgkcourierapp@gmail.com',
    },
    { status: 501 }
  )
}
