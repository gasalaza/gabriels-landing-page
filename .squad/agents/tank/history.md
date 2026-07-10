# Tank — History

_Working memory. Seeded 2026-07-09 for the **gabriels-landing-page** project (fresh start — no prior history carried over)._

## Project Context

Gabriel Salazar's personal portfolio / landing page: a public React + TypeScript (Vite) site with a small private admin area (GitHub OAuth) for reading contact-form submissions. Backend is Node/Express + better-sqlite3. Deployed on Railway (Caddy web + private Node backend). Cast universe: The Matrix.

## Entries

- Phase 0 (2026-07-09T20:15:00-06:00): Scaffolded the green walking skeleton: npm workspaces, Express 5/better-sqlite3 backend, Vite React TypeScript frontend, CI, Railway/Caddy deployment files, hooks, docs, and assets; typecheck, lint, test, and build all passed.

- **Phase 1 (2026-07-09T21:45:00Z):** Built POST /api/contact public endpoint with Zod validation, honeypot defense, express-rate-limit (5/hr/IP), 16KB body cap, better-sqlite3 persistence. 9 tests written and passing. PR #11 merged; branch `feat/contact-api` deleted. Neo security review: 🟢 GREEN (all §5 defenses confirmed active, trust proxy set). Phase 4 backlog noted: catch-all error handler, listSubmissions pagination, validation bounds refinement.

- **Phase 5 (2026-07-09T22:09:23-0600):** Built Railway deploy artifacts (PR #19, merged 1761e53): Dockerfile (backend: multi-stage Alpine, non-root, better-sqlite3 native build, schema.sql runtime copy, healthcheck), Dockerfile.railway-web (Vite build → Caddy), Caddyfile.railway (full CSP + HSTS + security headers + /api proxy + SPA fallback), docker-compose.yml (local full-stack), .env.example, DEPLOYMENT.md. Verified both docker builds + compose smoke test. Neo review: 🟢 GREEN (CSP correct, Docker hardened, secret hygiene clean). **Lesson:** schema.sql is a non-TS asset — tsc doesn't copy it to dist; Docker must copy it to the runtime-resolved path. **Lesson:** Pin Docker base images to the MULTI-ARCH INDEX digest, not the local arch digest, so amd64 deploy targets resolve (local arch digests would fail on Railway).

- **Phase 4 backend hardening (2026-07-09T22:09:23-0600):** HMAC-sign the `__pa` OAuth state cookie (PR #20, merged 23fca54): reused the single existing hmacSign signer + added hmacVerify; verify-before-parse; state-equality check preserved; cookie attrs unchanged. Added input-bounds validation tests (asserted existing zod limits, none weakened). +15 backend tests (24→39). Neo review: 🟢 GREEN (all 7 axes; __session signer byte-for-byte unchanged). **Lesson:** Reuse the single hmacSign signer for any new signed cookie — don't add a parallel scheme. Verify-before-parse blocks tampered input before processing.

- **Phase 4 supply-chain pinning (2026-07-09T22:09:23-0600):** SHA-pinned all GitHub Actions across 5 workflows (PR #21, merged d91af04): checkout@v4, setup-node@v4, github-script@v7 → commit SHAs with `#v{tag}` comments. SHA-pinned Docker base images to multi-arch index digests (node:22-alpine, caddy:2-alpine). Added `docker` ecosystem to dependabot.yml so pins auto-bump. Neo review: 🟢 GREEN (mechanical pins only, no tampering, index digests, scoped). **Lesson:** Multi-arch index digests ensure amd64 deploy targets resolve correctly (local arch digests would fail on Railway).

- **Pre-deploy hardening batch (2026-07-10):** Shipped PR #36 (optional contact `message`; authenticated + CSRF-protected `DELETE /api/admin/messages/:id`; backend tests 42→47, Neo 🟢) and PR #38 (manual CORS/Origin guard, `cf-connecting-ip` client IP middleware + `TRUST_PROXY`, `CONTACT_EMAIL_DAILY_CAP`, server timeouts, event/IP-only audit logging, startup session cleanup, 25kb body cap; tests 47→54, Neo 🟡 GO). Residual ops: validate `TRUST_PROXY=2` and lock down Railway raw `*.up.railway.app` URL.

- **LinkedIn-launch infra/docs pipeline (2026-07-10):** Shipped PR #43 RFC 9116 `security.txt` plus Caddy `/.well-known/*` handle; verified live 200 `text/plain`, headers intact, and SPA fallback intact (Neo 🟢). Shipped PR #44 `LAUNCH.md` with go-live checklist, post-deploy validators, deferred Cloudflare Web Analytics CSP notes, and LinkedIn playbook; followed up by redacting a personal Gmail from the public repo.
