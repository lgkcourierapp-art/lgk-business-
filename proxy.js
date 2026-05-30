import { NextResponse } from 'next/server';

// Public routes — no auth required
const PUBLIC_ROUTES = new Set(['/', '/login', '/register', '/privacy', '/terms']);

// In-memory rate limiter — sufficient for single-instance launch
const rateLimitMap = new Map();

function rateLimit(ip, limit = 20, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const requests = rateLimitMap.get(ip).filter(t => t > windowStart);
  if (requests.length >= limit) return false;
  requests.push(now);
  rateLimitMap.set(ip, requests);
  return true;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Rate limit all /api/* routes before any other logic
  if (pathname.startsWith('/api/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (!rateLimit(ip, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    return NextResponse.next();
  }

  // Public routes always pass through
  if (PUBLIC_ROUTES.has(pathname)) return NextResponse.next();

  // All other routes pass through — auth is enforced client-side
  // (server-side enforcement would require migrating to @supabase/ssr)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)'],
};
