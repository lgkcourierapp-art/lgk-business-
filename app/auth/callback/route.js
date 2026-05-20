import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SAFE_REDIRECTS = ['/dashboard', '/orders', '/settings', '/profile', '/support'];

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') || '/dashboard';

  // Only allow redirects to known safe internal paths
  const next = SAFE_REDIRECTS.includes(nextParam) ? nextParam : '/dashboard';

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
