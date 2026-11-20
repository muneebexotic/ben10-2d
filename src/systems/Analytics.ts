import { inject } from '@vercel/analytics';

/**
 * Vercel Web Analytics (page views, no cookies). Release builds on a real host only: the script is
 * served by Vercel at /_vercel/insights, so the dev server, the bench and QA builds
 * (`--mode bench`) and `vite preview` on localhost would 404 on it, and the QA sweep fails on that error.
 */
export function installAnalytics(): void {
  if (import.meta.env.MODE !== 'production') return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  inject({ mode: 'production' });
}
