import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { openDatabase } from './db/database.js';
import { applySecurityHeaders } from './middleware/security-headers.js';
import { createContactRouter } from './routes/contact.js';
import { healthRouter } from './routes/health.js';
import { createAdminAuthRouter } from './routes/admin-auth.js';
import { createAdminRouter } from './routes/admin.js';
import { createAuthRateLimiter } from './middleware/auth-rate-limit.js';
import { loadConfig } from './config.js';
import type { GitHubAuthDeps } from './auth/github.js';

export interface CreateAppOptions {
  githubAuth?: GitHubAuthDeps;
}

export function createApp(options: CreateAppOptions = {}) {
  const config = loadConfig();
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(applySecurityHeaders());
  app.use(express.json({ limit: '25kb' }));
  app.use(express.urlencoded({ extended: false, limit: '25kb' }));
  app.use(cookieParser());

  // CORS — manual implementation (no cors package). Reflect allowed origins only;
  // disallowed origins simply get no CORS headers (browser blocks the request).
  const allowedOrigins = new Set([config.publicBaseUrl]);
  if (config.nodeEnv !== 'production') {
    allowedOrigins.add('http://localhost:5173');
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('origin');
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  const db = openDatabase();

  // Expired session cleanup — run once on startup to prevent unbounded growth
  db.prepare("DELETE FROM admin_sessions WHERE datetime(expires_at) < datetime('now')").run();

  // Origin guard on POST /api/contact — defense-in-depth CSRF/abuse protection.
  // If Origin is present and NOT in the allowlist → 403. Absent Origin (non-browser) falls through.
  app.post('/api/contact', (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('origin');
    if (origin && !allowedOrigins.has(origin)) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }
    next();
  });

  // Public routes
  app.use('/api', createContactRouter());
  app.use('/api', healthRouter);

  // Auth rate limiter
  app.use('/api/admin/auth', createAuthRateLimiter(config));

  // Admin auth routes (login, callback) — not session-protected
  app.use(
    '/api/admin/auth',
    createAdminAuthRouter({ db, config, githubAuth: options.githubAuth }),
  );

  // Protected admin routes
  app.use('/api/admin', createAdminRouter({ db, config }));

  // Catch-all error handler — never leak stack traces
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(err);
    }
    res.status(500).json({ error: 'INTERNAL' });
  });

  return app;
}

