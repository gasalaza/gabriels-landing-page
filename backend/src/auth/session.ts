/**
 * Session management — HMAC-signed cookie, SHA-256 hashed storage.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type Database from 'better-sqlite3';

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionRow {
  id: string;
  login: string;
  csrf_hash: string;
  created_at: string;
  expires_at: string;
  ip: string | null;
  user_agent: string | null;
}

function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function hmacSign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function createSession(
  db: Database.Database,
  login: string,
  secret: string,
  ip: string | null,
  userAgent: string | null,
): { sessionCookie: string; csrfToken: string } {
  const tokenRaw = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(32).toString('base64url');

  const sessionId = sha256Hex(tokenRaw);
  const csrfHash = sha256Hex(csrfToken);
  const hmac = hmacSign(tokenRaw, secret);
  const sessionCookie = `${tokenRaw}.${hmac}`;

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString();

  db.prepare(
    `INSERT INTO admin_sessions (id, login, csrf_hash, expires_at, ip, user_agent)
     VALUES (@id, @login, @csrfHash, @expiresAt, @ip, @userAgent)`,
  ).run({ id: sessionId, login, csrfHash, expiresAt, ip, userAgent });

  return { sessionCookie, csrfToken };
}

export function validateSession(
  db: Database.Database,
  cookieValue: string,
  secret: string,
): SessionRow | null {
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;

  const [tokenRaw, providedHmac] = parts as [string, string];

  // Verify HMAC signature
  const expectedHmac = hmacSign(tokenRaw, secret);
  if (!constantTimeEqual(expectedHmac, providedHmac)) return null;

  // Look up session by hash of the raw token
  const sessionId = sha256Hex(tokenRaw);
  const row = db
    .prepare('SELECT id, login, csrf_hash, created_at, expires_at, ip, user_agent FROM admin_sessions WHERE id = ?')
    .get(sessionId) as SessionRow | undefined;

  if (!row) return null;

  // Check expiration
  if (new Date(row.expires_at) <= new Date()) {
    // Lazily delete expired session
    db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(sessionId);
    return null;
  }

  return row;
}

export function destroySession(db: Database.Database, sessionId: string): void {
  db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(sessionId);
}

export function validateCsrf(session: SessionRow, headerValue: string, cookieValue: string): boolean {
  if (!headerValue || !cookieValue) return false;
  // Header must match cookie
  if (!constantTimeEqual(headerValue, cookieValue)) return false;
  // Cookie value's hash must match stored hash
  const hash = sha256Hex(cookieValue);
  if (!constantTimeEqual(hash, session.csrf_hash)) return false;
  return true;
}

export const SESSION_COOKIE_NAME = '__session';
export const CSRF_COOKIE_NAME = '__csrf';
export const SESSION_COOKIE_MAX_AGE = SESSION_MAX_AGE_MS;
