import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const SAFE_REDIRECTS = ['/dashboard', '/orders', '/settings', '/profile', '/support'];

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') || '/dashboard';

  const next = SAFE_REDIRECTS.includes(nextParam) ? nextParam : '/dashboard';
  const redirectTo = `${origin}${next}`;

  if (!code) {
    return NextResponse.redirect(redirectTo);
  }

  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  await supabase.auth.exchangeCodeForSession(code);

  return response;
}
