/**
 * Admin auth routes: GitHub OAuth login + callback.
 */

import { randomBytes, createHash } from 'node:crypto';
import { Router } from 'express';
import type { CookieOptions } from 'express';
import type Database from 'better-sqlite3';
import type { AppConfig } from '../config.js';
import {
  createSession,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
} from '../auth/session.js';
import { exchangeCodeForToken, fetchGitHubUser } from '../auth/github.js';
import type { GitHubAuthDeps } from '../auth/github.js';

const PA_COOKIE_NAME = '__pa';
const PA_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function base64url(buffer: Buffer): string {
  return buffer.toString('base64url');
}

function sha256Base64url(data: string): string {
  return createHash('sha256').update(data).digest('base64url');
}

export interface AdminAuthRouterDeps {
  db: Database.Database;
  config: AppConfig;
  githubAuth?: GitHubAuthDeps;
}

export function createAdminAuthRouter({ db, config, githubAuth }: AdminAuthRouterDeps) {
  const router = Router();

  const redirectUri = `${config.publicBaseUrl}/api/admin/auth/github/callback`;

  // GET /github — redirect to GitHub authorize
  router.get('/github', (_req, res) => {
    const state = base64url(randomBytes(32));
    const codeVerifier = base64url(randomBytes(32));
    const codeChallenge = sha256Base64url(codeVerifier);

    const paCookieValue = JSON.stringify({ state, codeVerifier });

    const cookieOpts: CookieOptions = {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/api/admin/auth',
      maxAge: PA_MAX_AGE_MS,
    };

    res.cookie(PA_COOKIE_NAME, paCookieValue, cookieOpts);

    const params = new URLSearchParams({
      client_id: config.githubClientId,
      redirect_uri: redirectUri,
      scope: 'read:user',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      allow_signup: 'false',
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  });

  // GET /github/callback — handle OAuth callback
  router.get('/github/callback', async (req, res) => {
    const adminRedirect = (query: string) => `${config.publicBaseUrl}/admin${query}`;

    const { code, state } = req.query;
    const paCookieRaw = req.cookies?.[PA_COOKIE_NAME] as string | undefined;

    // Clear PA cookie immediately
    res.clearCookie(PA_COOKIE_NAME, { path: '/api/admin/auth' });

    // Validate state
    if (!paCookieRaw || !state || !code) {
      res.redirect(adminRedirect('?auth=error'));
      return;
    }

    let paData: { state: string; codeVerifier: string };
    try {
      paData = JSON.parse(paCookieRaw) as { state: string; codeVerifier: string };
    } catch {
      res.redirect(adminRedirect('?auth=error'));
      return;
    }

    if (typeof state !== 'string' || state !== paData.state) {
      res.redirect(adminRedirect('?auth=error'));
      return;
    }

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(
      code as string,
      paData.codeVerifier,
      config.githubClientId,
      config.githubClientSecret,
      redirectUri,
      githubAuth,
    );

    if (!tokenResponse) {
      res.redirect(adminRedirect('?auth=error'));
      return;
    }

    // Fetch user
    const user = await fetchGitHubUser(tokenResponse.access_token, githubAuth);
    if (!user) {
      res.redirect(adminRedirect('?auth=error'));
      return;
    }

    // Check allowlist
    if (!config.authAllowlist.includes(user.login.toLowerCase())) {
      res.redirect(adminRedirect('?auth=forbidden'));
      return;
    }

    // Create session
    const ip = req.ip ?? null;
    const userAgent = req.get('user-agent') ?? null;
    const { sessionCookie, csrfToken } = createSession(db, user.login, config.sessionSecret, ip, userAgent);

    const secureCookie = config.nodeEnv === 'production';

    res.cookie(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
      path: '/api/admin',
      maxAge: SESSION_COOKIE_MAX_AGE,
    });

    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: secureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE,
    });

    res.redirect(adminRedirect(''));
  });

  return router;
}
