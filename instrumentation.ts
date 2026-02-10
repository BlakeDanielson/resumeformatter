// This file runs early in Next.js server initialization
// It sets up polyfills before any other code runs

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import polyfills early
    await import('./lib/pdf-polyfills');
  }
}
