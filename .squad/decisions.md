# Squad Decisions

## Active Decisions

### 2026-07-09: Phase 0 bootstrap — locked architecture & security decisions

**By:** Squad (Coordinator), requested by gasalaza

**Context:** New public repo `gasalaza/gabriels-landing-page` — Gabriel Salazar's personal portfolio, ported from an existing React/Vite site, retyped to TypeScript, deployed on Railway. Reused the Matrix squad + Addy Osmani agent-skills + the `sec` project's security/dev playbook.

**Decisions:**

1. **Stack** — Frontend: React 19 + TypeScript (strict) + Vite. Backend: Node/Express 5 (ESM, TS). Monorepo via npm workspaces (`backend`, `frontend`), Node >= 22.23.
2. **Database** — `better-sqlite3` (synchronous, first-class TS types, stable prebuilds) over alternatives. Tables: `contact_submissions`, `admin_sessions`. Schema initialized idempotently on startup (no migration tool for v1). DB path via `SQLITE_DATABASE_PATH`; prod on a Railway volume.
3. **Admin auth** — Scoped **GitHub OAuth** on `/admin` + `/api/admin/*` only (`AUTH_ALLOWLIST=gasalaza`); httpOnly/secure/sameSite=lax session cookie scoped to `/api/admin`; CSRF double-submit; token stored as SHA-256 hash. (Chosen over password auth.)
4. **Deploy** — Railway, two services: private `backend` (Node, :3000) + public `web` (Caddy serving the SPA and proxying `/api/*`). Custom domain TBD.
5. **Security baseline** — Security-headers middleware (nosniff, HSTS, X-Frame-Options DENY, no x-powered-by) + tuned CSP; rate limits (contact 5/hr/IP, auth 5/15min, writes 60/min); Zod validation + parameterized SQL; contact honeypot; 16KB body limit; React auto-escaping (never dangerouslySetInnerHTML). Harden tests (`*.harden.test.ts`) gate CI.
6. **GitHub security config** — Branch protection on `main`: require PR + `Test and build` status check (strict) + **0 approvals** (solo-friendly) + enforce_admins, no force-push/deletion. Secret scanning + push protection on. Dependabot alerts + automated security fixes on. Squash-only merges + delete-branch-on-merge. Wiki/Projects disabled. CODEOWNERS `* @gasalaza`.
7. **Public-repo hygiene** — No secrets in git; all secrets via `.env` (gitignored) + Railway env. `.env.example` committed (names only).

**Known follow-ups (first PR candidates):** add `npm audit --audit-level=high` to CI (plan §7.3); bump `actions/checkout`/`actions/setup-node` off deprecated Node 20; add `.github/dependabot.yml` version-updates config; fix reference footer stack copy when the UI is ported.

## Governance
- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
