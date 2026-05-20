import { NextResponse } from 'next/server';

const ORG     = 'lgk-courier';
const PROJECT = 'javascript-nextjs';

export async function GET(request) {
  const token = request.headers.get('x-sentry-token');
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const headers = { Authorization: `Bearer ${token}` };

  try {
    if (type === 'issues') {
      const query  = searchParams.get('query') || 'is:unresolved';
      const res = await fetch(
        `https://sentry.io/api/0/projects/${ORG}/${PROJECT}/issues/?query=${encodeURIComponent(query)}&limit=30`,
        { headers }
      );
      if (res.status === 401) return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (type === 'stats') {
      const since = Math.floor((Date.now() - 86400000) / 1000);
      const res = await fetch(
        `https://sentry.io/api/0/projects/${ORG}/${PROJECT}/stats/?stat=received&resolution=1h&since=${since}`,
        { headers }
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  }
}
