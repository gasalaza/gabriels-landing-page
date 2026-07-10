/**
 * Centralized configuration. Reads from process.env with safe dev defaults.
 * Throws on missing secrets when NODE_ENV === 'production'.
 */

function requireInProduction(name: string, fallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return fallback;
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig() {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: readPositiveInt('PORT', 3000),
    publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:5173',
    sessionSecret: requireInProduction('SESSION_SECRET', 'dev-session-secret-do-not-use-in-prod'),
    githubClientId: requireInProduction('GITHUB_CLIENT_ID', ''),
    githubClientSecret: requireInProduction('GITHUB_CLIENT_SECRET', ''),
    authAllowlist: (process.env.AUTH_ALLOWLIST ?? 'gasalaza')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    authRateLimitWindowMs: readPositiveInt('AUTH_RATE_LIMIT_WINDOW_MS', 900_000),
    authRateLimitMax: readPositiveInt('AUTH_RATE_LIMIT_MAX', 5),
  } as const;
}

export type AppConfig = ReturnType<typeof loadConfig>;
