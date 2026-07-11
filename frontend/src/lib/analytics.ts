const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

/** Injects the Cloudflare Web Analytics beacon. Idempotent; no-op on empty token or non-browser. */
export function injectBeacon(token: string): void {
  if (typeof document === 'undefined' || !token) return;
  if (document.querySelector('script[data-cf-beacon]')) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = BEACON_SRC;
  s.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  document.head.appendChild(s);
}

/** Loads analytics in production only, when a public beacon token is configured. */
export function initAnalytics(): void {
  if (!import.meta.env.PROD) return;
  injectBeacon(import.meta.env.VITE_CF_BEACON_TOKEN ?? '');
}
