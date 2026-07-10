/**
 * Protected admin routes: /api/admin/me, /api/admin/logout,
 * /api/admin/messages, /api/admin/messages/:id/read
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type Database from 'better-sqlite3';
import type { AppConfig } from '../config.js';
import {
  validateSession,
  validateCsrf,
  destroySession,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  type SessionRow,
} from '../auth/session.js';
import { getClientIp } from '../middleware/client-ip.js';

// Extend Express Request to carry session data
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminSession?: SessionRow;
    }
  }
}

export interface AdminRouterDeps {
  db: Database.Database;
  config: AppConfig;
}

const paginationSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .transform((v) => Math.max(1, Math.min(100, v)))
    .catch(20),
  offset: z.coerce
    .number()
    .int()
    .transform((v) => Math.max(0, v))
    .catch(0),
});

const markReadSchema = z.object({
  read: z.boolean().default(true),
});

interface SubmissionRow {
  id: number;
  name: string;
  email: string;
  project_type: string;
  message: string;
  created_at: string;
  read: number;
}

export function createAdminRouter({ db, config }: AdminRouterDeps) {
  const router = Router();

  // Auth middleware — runs on all /api/admin/* routes
  function requireSession(req: Request, res: Response, next: NextFunction) {
    const cookieValue = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (!cookieValue) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }

    const session = validateSession(db, cookieValue, config.sessionSecret);
    if (!session) {
      console.warn(JSON.stringify({ event: 'admin_session_invalid', ip: getClientIp(req) }));
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }

    req.adminSession = session;
    next();
  }

  // CSRF middleware — for state-changing methods
  function requireCsrf(req: Request, res: Response, next: NextFunction) {
    const csrfHeader = req.get('X-CSRF-Token') ?? '';
    const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME] ?? '';

    if (!req.adminSession || !validateCsrf(req.adminSession, csrfHeader, csrfCookie)) {
      console.warn(JSON.stringify({ event: 'csrf_failure', ip: getClientIp(req) }));
      res.status(403).json({ error: 'CSRF' });
      return;
    }

    next();
  }

  // Apply auth to all routes on this router
  router.use(requireSession);

  // GET /me
  router.get('/me', (req, res) => {
    res.json({ login: req.adminSession!.login });
  });

  // POST /logout
  router.post('/logout', requireCsrf, (req, res) => {
    destroySession(db, req.adminSession!.id);
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/api/admin' });
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
    res.status(204).end();
  });

  // GET /messages
  router.get('/messages', (req, res) => {
    const parsed = paginationSchema.safeParse(req.query);
    const { limit, offset } = parsed.success ? parsed.data : { limit: 20, offset: 0 };

    const total = (
      db.prepare('SELECT COUNT(*) as count FROM contact_submissions').get() as { count: number }
    ).count;

    const rows = db
      .prepare(
        `SELECT id, name, email, project_type, message, created_at, read
         FROM contact_submissions
         ORDER BY datetime(created_at) DESC, id DESC
         LIMIT ? OFFSET ?`,
      )
      .all(limit, offset) as SubmissionRow[];

    const items = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      projectType: row.project_type,
      message: row.message,
      createdAt: row.created_at,
      read: row.read === 1,
    }));

    res.json({ items, total, limit, offset });
  });

  // PATCH /messages/:id/read
  router.patch('/messages/:id/read', requireCsrf, (req, res) => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = Number.parseInt(rawId ?? '', 10);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid message id' });
      return;
    }

    const parsed = markReadSchema.safeParse(req.body ?? {});
    const readValue = parsed.success ? parsed.data.read : true;

    const result = db
      .prepare('UPDATE contact_submissions SET read = ? WHERE id = ?')
      .run(readValue ? 1 : 0, id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.json({ ok: true });
  });

  // DELETE /messages/:id
  router.delete('/messages/:id', requireCsrf, (req, res) => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = Number.parseInt(rawId ?? '', 10);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid message id' });
      return;
    }

    const result = db.prepare('DELETE FROM contact_submissions WHERE id = ?').run(id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.status(204).end();
  });

  return router;
}
