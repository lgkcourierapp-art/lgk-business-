'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html>
      <body style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#FFF' }}>
          <div style={{ color: '#D4FF00', fontWeight: 900, fontSize: '24px', marginBottom: '12px' }}>LGK</div>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>Something went wrong. Our team has been notified.</div>
          <button
            onClick={reset}
            style={{ background: '#D4FF00', color: '#000', border: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
