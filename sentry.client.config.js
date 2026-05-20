import * as Sentry from '@sentry/nextjs';

// Only initialise if DSN is set — safe to deploy without it
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',

    // Capture 10% of sessions for performance monitoring (free tier friendly)
    tracesSampleRate: 0.1,

    // Don't flood you with noise — only send errors, not every console.warn
    debug: false,

    // Ignore non-actionable browser errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /^Network Error/,
      /^Failed to fetch/,
      /^Load failed/,
    ],
  });
}
