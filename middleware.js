import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Auth is handled client-side by app/admin/layout.js
  // which checks session + is_admin via the browser Supabase client.
  // Server-side cookie-based auth would require migrating the entire
  // platform to @supabase/ssr — deferred until then.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
