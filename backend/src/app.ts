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
  app.set('trust proxy', 1);
  app.use(applySecurityHeaders());
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));
  app.use(cookieParser());

  const db = openDatabase();

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

