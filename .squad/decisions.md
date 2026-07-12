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
5. **Security baseline** — Security-headers middleware (nosniff, HSTS preload, X-Frame-Options DENY, Permissions-Policy, no x-powered-by) + tuned CSP; rate limits (contact 5/hr/IP, auth 5/15min, writes 60/min); Zod validation + parameterized SQL; contact honeypot; 25KB body limit (sized to fit max Zod-validated message of ~20KB); React auto-escaping (never dangerouslySetInnerHTML). Harden tests (`*.harden.test.ts`) gate CI.
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

### 2026-07-09T22:09:23-0600: Phase 4-5 — deploy topology & production security headers

**By:** Tank (backend/infra), Neo (security review)

**What:** Railway deploy topology finalized as two services: private `backend` (Node/Express, SQLite on volume at /app/backend/data) + public `web` (Caddy: serves SPA, reverse-proxies /api/* to backend, terminates security headers). Single browser origin. Deployed via:
- `Dockerfile` (backend): multi-stage Alpine Node 22, non-root user, better-sqlite3 native build, schema.sql runtime copy, healthcheck
- `Dockerfile.railway-web`: Vite build → Caddy 2 Alpine
- `Caddyfile.railway`: full CSP (script-src 'self', no unsafe-inline; style-src allows 'unsafe-inline' for React inline styles + Google Fonts; img-src allows GitHub avatars; connect-src 'self'), HSTS preload, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, Server header removed
- `docker-compose.yml` (local full-stack dev)
- `.env.example` (placeholders only, no secrets)
- `DEPLOYMENT.md` (Railway service topology + env contract)

**Why:** Security headers delivered at the Caddy edge (single enforcement point, no JS bundler CSP) for defense-in-depth. Docker builds verified + compose smoke test passed. PR #19 merged (1761e53). Neo review: 🟢 GREEN (CSP correct, Docker hardened, secret hygiene clean).

### 2026-07-09T22:09:23-0600: Phase 4 — backend hardening (HMAC-signed OAuth state + input bounds)

**By:** Tank (backend), Neo (security review)

**What:** HMAC-sign the `__pa` OAuth state cookie (reused the single existing hmacSign signer derived from SESSION_SECRET + added hmacVerify; verify-before-parse; state-equality check preserved; cookie attrs unchanged). Added input-bounds validation tests (asserted existing zod limits, none weakened). 15 new backend tests (24→39 total). PR #20 merged (23fca54). Neo review: 🟢 GREEN (all 7 axes; __session signer byte-for-byte unchanged).

**Why:** HMAC integrity is additive to the existing random-state equality check. Single signer avoids parallel HMAC schemes. Verify-before-parse blocks tampered input before processing.

### 2026-07-09T22:09:23-0600: Phase 4 — supply-chain pinning (SHA-pinned Actions + Docker images)

**By:** Tank (infra), Neo (security review)

**What:** SHA-pinned all GitHub Actions across 5 workflows (checkout@v4, setup-node@v4, github-script@v7) to commit SHAs with `#v{tag}` comments. SHA-pinned Docker base images to multi-arch index digests (node:22-alpine, caddy:2-alpine). Added `docker` ecosystem to dependabot.yml so pins auto-bump. PR #21 merged (d91af04). Neo review: 🟢 GREEN (mechanical pins only, no tampering, index digests, scoped).

**Why:** Supply-chain attacks blocked at CI/build time. Dependabot watches npm + github-actions + docker for security bumps (no patch-freeze). Multi-arch index digests ensure amd64 deploy targets resolve correctly (local arch digests would fail on Railway).

### 2026-07-09T22:09:23-0600: Backend environment contract (definitive)

**By:** Tank (backend)

**What:** The definitive backend env contract (source of truth = backend/src/config.ts):
- NODE_ENV
- PORT
- PUBLIC_BASE_URL
- SQLITE_DATABASE_PATH
- SESSION_SECRET
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- AUTH_ALLOWLIST
- AUTH_RATE_LIMIT_WINDOW_MS
- AUTH_RATE_LIMIT_MAX

**Why:** The old plan's `APP_ALLOWED_HOSTS` / `CONTACT_RATE_LIMIT_*` do NOT exist in code. This is the runtime reality. Documented in DEPLOYMENT.md + .env.example.

### 2026-07-10: Pre-deploy hardening and admin workflow decisions

**By:** Scribe, from Tank/Trinity/Neo pre-deploy batch

**Context:** PRs #36-#38 shipped optional contact messages, admin message management, and pre-deploy security remediation after Neo's OWASP Web Top 10 / DDoS audit.

**Decisions:**
- **Zero-new-dependency security posture:** CORS/Origin guard is implemented manually (no `cors` package) to avoid `npm ci` breaking the shared clone's `better-sqlite3` native binding.
- **Trusted client IP contract:** Rate limiting trusts `cf-connecting-ip` only because the backend is private and Cloudflare-fronted; validate `TRUST_PROXY` in staging (Cloudflare → Railway = 2 hops, production value `2`).
- **LLM surface gate:** OWASP LLM Top 10 is N/A today because there is no AI surface; re-review is required before shipping any future LiteRT/on-device-AI demo, with scoped CSP and model output treated as untrusted.
- **Single-admin-by-design:** DELETE/PATCH admin endpoints have no per-row ownership check because there is exactly one allowlisted admin (`gasalaza`); revisit if multi-admin is added.

### 2026-07-10: LinkedIn-launch enhancement pipeline decisions

**By:** Scribe, from Trinity/Neo/Tank/Rai launch pipeline

**Context:** LinkedIn-launch enhancement pipeline shipped to `main` at 69a0a89 via PRs #41-#44.

**Decisions:**
- **Launch pipeline shipped:** PRs #41-#44 completed the SEO/Open Graph/a11y/perf pack, Built Secure section, RFC 9116 `security.txt`, Caddy serving rule, and `LAUNCH.md`.
- **Public security posture language:** Public copy stays category-level only: no exact thresholds, limits, internal values, or absolute claims; use Rai-approved softened language.
- **Disclosure contact:** `security.txt` uses `security@gasalaza.com` through Cloudflare Email Routing, user-confirmed.
- **Cloudflare Web Analytics deferred:** Only pre-approved CSP additions are `static.cloudflareinsights.com` in `script-src` and `cloudflareinsights.com` in `connect-src`, documented in `LAUNCH.md`.
- **PII discipline:** Never commit personal email addresses into the public repo.
- **Strict merge ordering:** With two open PRs, the second PR needs `gh pr update-branch` because main requires strict up-to-date protection.

## Governance
- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
