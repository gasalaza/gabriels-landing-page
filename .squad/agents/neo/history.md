# Neo — History

_Working memory. Seeded 2026-07-09 for the **gabriels-landing-page** project (fresh start — no prior history carried over)._

## Project Context

Gabriel Salazar's personal portfolio / landing page: a public React + TypeScript (Vite) site with a small private admin area (GitHub OAuth) for reading contact-form submissions. Backend is Node/Express + better-sqlite3. Deployed on Railway (Caddy web + private Node backend). Cast universe: The Matrix.

## Entries

- Phase 0 (2026-07-09T20:15:00-06:00): Frontend walking skeleton is in place with Vite React TypeScript rendering Gabriel Salazar’s site name and a passing RTL test.

- **Phase 1 review (2026-07-09T21:45:00Z):** Reviewed Tank's POST /api/contact endpoint (PR #11) against §5 baseline. Confirmed all four defenses active: validation (Zod), honeypot (CSS hidden), rate limit (5/hr/IP), 16KB cap, trust proxy. 🟢 GREEN. Phase 4 findings: catch-all error handler, listSubmissions pagination, validation bounds. Approved PR #11 for merge.

- **Phase 2 review (2026-07-09T21:45:00Z):** Reviewed Trinity's client-side contact form wiring (PR #12). Confirmed no XSS sinks, honeypot correct, relative fetch, no secrets in bundle. 🟢 GREEN. CSP header verification deferred to Phase 4. Approved PR #12 for merge.

- **Phase 5 review (2026-07-09T22:09:23-0600):** Reviewed Tank's Railway deploy artifacts (PR #19) against §5 baseline. Confirmed CSP correct (script-src 'self' no unsafe-inline; style-src allows 'unsafe-inline' for React inline styles + Google Fonts; img-src allows GitHub avatars; connect-src 'self'), Docker hardened (multi-stage, non-root, healthcheck), secret hygiene clean (.env.example has placeholders only). 🟢 GREEN. Approved PR #19 for merge (1761e53).

- **Phase 4 backend hardening review (2026-07-09T22:09:23-0600):** Reviewed Tank's HMAC-signed OAuth state cookie (PR #20) against all 7 axes. Confirmed HMAC integrity (reused single SESSION_SECRET-based signer, verify-before-parse, state-equality check preserved), cookie attrs unchanged, __session signer byte-for-byte unchanged, input-bounds validation tests added (asserted existing zod limits, none weakened). 🟢 GREEN. Approved PR #20 for merge (23fca54).

- **Phase 4 supply-chain pinning review (2026-07-09T22:09:23-0600):** Reviewed Tank's SHA-pinned GitHub Actions + Docker images (PR #21). Confirmed mechanical pins only (no tampering), multi-arch index digests used (node:22-alpine, caddy:2-alpine), Dependabot docker ecosystem added, scoped to CI/build. 🟢 GREEN. Approved PR #21 for merge (d91af04).

- **Pre-deploy security audit + re-gates (2026-07-10):** Audited OWASP Web Top 10, OWASP LLM Top 10, and DDoS posture. Baseline strong (11 🟢); OWASP LLM N/A (no AI surface); found 3 🔴 + 4 🟡. Re-gated PR #36 🟢, PR #37 🟢, and PR #38 🟡 GO after CORS/Origin, trusted-IP rate limiting, daily cap, timeouts, audit logging, session cleanup, and body-limit remediation. Future LiteRT/on-device-AI demo requires fresh LLM/CSP review.
