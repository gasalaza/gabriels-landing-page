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

### 2026-07-09: User content directives (apply in Phase 2 — UI port)

**By:** gasalaza (via Copilot)

1. **Remove the CV section from the page.** When porting the reference portfolio, do NOT render the on-page CV/résumé section. (Scope to confirm at Phase 2 start: whether this means the entire CV section including the "Download CV" button, or just the inline résumé block. Default assumption: remove the whole CV section and its download button; the CV PDF asset can stay in the repo but stays unlinked unless the user says otherwise.)

2. **No mention of "Microsoft" anywhere.** In all ported content (experience, hero, about, meta/SEO, etc.), do NOT name Microsoft or any employer. Where the reference says "Microsoft" (or a role tied to it), replace with the generic title **"Software Engineer"** with no company name.

**Owner:** Trinity (frontend) during the Phase 2 content typing (`data.jsx` → typed `src/content/*.ts`). Neo/Rai to sanity-check no employer name leaks into committed content or SEO metadata.

### 2026-07-09T21-45-00Z: Phase 1 complete — public contact API shipped ✅

**By:** Tank (API), Neo (security review)

**What:** Tank built the public contact form API endpoint (`POST /api/contact`) with Zod validation, honeypot defense, express-rate-limit (5/hr/IP), 16KB body cap, and better-sqlite3 persistence. 9 tests written and passing. PR #11 merged, branch `feat/contact-api` deleted.

**Decisions embedded:**
- Contact submissions persisted to `contact_submissions` table (timestamp, name, email, message, honeypot_check)
- Honeypot field `website_url` hides in CSS (`display: none`), rate limit enforces per-IP, 5 requests per hour
- Client honeypot validation mirrors server-side check
- Error responses generic (no form validation leaks)

**Security review:** Neo confirmed all four §5 defenses active (validation, honeypot, rate limit, 16KB cap) + trust proxy set. 🟢 GREEN. Three Phase 4 findings noted (catch-all error handler, listSubmissions pagination, validation-bounds refinement).

### 2026-07-09T21-45-00Z: Phase 2 complete — public portfolio UI shipped ✅

**By:** Trinity (UI port), Neo (security review), Rai (content/PII audit)

**What:** Trinity ported the reference portfolio UI to React 19 + TypeScript + Vite. All sections built (Nav/Hero/About/Stack/Services/Projects/Contact/Footer) with typed content. CV section REMOVED per user directive. All "Microsoft" references scrubbed → "Software Engineer" (generic). Public CV PDF asset deleted (privacy). Dev-only tooling/postMessage stripped. Contact form wired to POST /api/contact with honeypot + client-side validation + Vite dev proxy. PR #12 merged, branch `feat/public-ui` deleted.

**Content directives applied:**
- CV/Experience section removed entirely (was not rendered)
- Employer/company names removed; "Microsoft" → "Software Engineer" (no company affiliation shown)
- Public CV PDF asset removed from build

**Security review (client):** Neo-2 confirmed no XSS sinks, relative fetch, honeypot correct, no secrets in bundle. 🟢 GREEN. One info note (CSP is server-header concern, deferred to Phase 4).

**Content/PII review:** Rai confirmed no Microsoft in shipped content, CV removed, phone number NOT rendered, no PII/secrets leaked, content clean. 🟢 GREEN.

## Governance
- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
