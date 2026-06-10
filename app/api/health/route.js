import { createBrowserClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()

  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Lightweight query — just check DB is reachable:
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    })

  } catch (err) {
    return NextResponse.json({
      status: 'error',
      db: 'unreachable',
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
