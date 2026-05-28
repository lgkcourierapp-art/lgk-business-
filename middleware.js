import { NextResponse } from 'next/server';

// Public routes — no auth required
const PUBLIC_ROUTES = new Set(['/', '/login', '/register', '/privacy', '/terms']);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes always pass through
  if (PUBLIC_ROUTES.has(pathname)) return NextResponse.next();

  // All other routes pass through — auth is enforced client-side
  // (server-side enforcement would require migrating to @supabase/ssr)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|api/).*)'],
};
