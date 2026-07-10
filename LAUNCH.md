# Launch Guide — gasalaza.com

Practical go-live checklist and LinkedIn launch playbook. For the actual Railway deploy steps, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 1. Pre-launch checklist

Do these **before** sharing the URL publicly.

### Secrets & credentials

- [ ] **Rotate `RESEND_API_KEY`** — the key was pasted during setup; treat it as compromised. Go to [Resend dashboard](https://resend.com) → API Keys → revoke the old one → create a new key → update in Railway backend env vars.
- [ ] **Rotate the GitHub OAuth client secret** — same reason. GitHub → Settings → Developer settings → OAuth Apps → your app → generate a new client secret → update `GITHUB_CLIENT_SECRET` in Railway.

### Email & DNS

- [ ] **Verify `gasalaza.com` in Resend** — currently sending from `onboarding@resend.dev`, which only delivers to your own Resend-verified email and looks unprofessional. Fix:
  1. Resend dashboard → Domains → Add `gasalaza.com`.
  2. Add the 3 DNS records Resend provides: **SPF** (TXT, `include:send.resend.com`), **DKIM** (CNAME), and **DMARC** (TXT, e.g. `v=DMARC1; p=quarantine; rua=mailto:dmarc@gasalaza.com`).
  3. Wait for verification (usually minutes, occasionally up to 48 h for DNS propagation).
  4. Update Railway env: `CONTACT_NOTIFY_FROM=noreply@gasalaza.com` (or similar `@gasalaza.com` sender).
  5. Your daily cap of 50 is well within Resend's free-tier limit (100/day, 3,000/month).

- [ ] **Set up Cloudflare Email Routing for `security@gasalaza.com`** — the site ships a `/.well-known/security.txt` listing this address as the security contact. Without a routing rule, disclosure emails bounce.
  1. Cloudflare dashboard → Email → Email Routing → Routing rules.
  2. Add a rule: `security@gasalaza.com` → forward to `gabrielsalazar3092@gmail.com`.
  3. Takes ~2 minutes. Free on all Cloudflare plans.

### Railway configuration

- [ ] **Set production env vars** on the backend service (see [DEPLOYMENT.md §2](DEPLOYMENT.md#2-railway-project-setup) for the full table):
  - `PUBLIC_BASE_URL=https://gasalaza.com` — this also drives the CORS allowlist + `/api/contact` Origin check. Must be the exact public origin.
  - `TRUST_PROXY=2` — Cloudflare → Railway = 2 proxy hops. Validate the `X-Forwarded-For` chain in staging first (see [DEPLOYMENT.md §2](DEPLOYMENT.md#2-railway-project-setup)).
  - `CONTACT_EMAIL_DAILY_CAP=50` (default).
  - `AUTH_RATE_LIMIT_MAX=5` (default; tighten if desired).
- [ ] **Restrict the raw Railway URL** — disable the `*.up.railway.app` domain on the web service once the custom domain is live. Without this, an attacker can bypass Cloudflare and spoof rate-limit headers. See [DEPLOYMENT.md §5a](DEPLOYMENT.md#5a-️-restrict-the-raw-railway-url-required).
- [ ] **Set a Railway spend alert** — Project Settings → Usage → set a soft alert at ~$8/mo. Railway Hobby has no hard spending cap; this is your early warning if something loops.
- [ ] **Enable Railway volume snapshots** — your SQLite database (contact submissions, admin sessions) lives on a single volume. Enable automatic snapshots so you have a backup if the volume fails.

---

## 2. Deploy

Follow [DEPLOYMENT.md](DEPLOYMENT.md) for the full Railway two-service setup. The short version:

1. Push to `main` (or merge a PR).
2. Railway auto-builds the Docker images (Wait-for-CI ensures the GitHub Actions "Test and build" check passes first).
3. Backend starts on private networking; Caddy serves the SPA publicly and proxies `/api/*` to the backend.

---

## 3. Post-deploy validation

Run these checks after the first deploy and confirm the expected results.

### Security scanners

- [ ] [securityheaders.com](https://securityheaders.com/?q=https://gasalaza.com) → expect **A+** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy are all set via Caddyfile)
- [ ] [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory) → expect **A+**
- [ ] [SSL Labs](https://www.ssllabs.com/ssltest/) → expect **A+** (Cloudflare handles TLS)

### Functional checks

- [ ] `https://gasalaza.com` loads — SPA renders, no console errors
- [ ] `https://gasalaza.com/.well-known/security.txt` → HTTP 200, `Content-Type: text/plain`, shows `security@gasalaza.com`
- [ ] Submit the contact form → confirm the email actually arrives in your inbox (not spam)
- [ ] Navigate to `/admin` → "Sign in with GitHub" → OAuth completes through the real `gasalaza.com` callback URL → admin dashboard loads and shows the test submission
- [ ] Check rate limiting works: the 6th rapid contact submission within 1 hour gets a 429

### Social previews

- [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) → confirm og-image (1200×630), title, and description render correctly
- [ ] [opengraph.xyz](https://opengraph.xyz) → same check, quick visual
- [ ] Twitter/X Card Validator → confirm card renders

---

## 4. Cloudflare Web Analytics (optional — add later)

We deliberately deferred this to avoid loosening CSP before launch. To enable privacy-friendly, cookieless analytics:

1. Cloudflare dashboard → Web Analytics → Add site → copy the beacon token.
2. Add the beacon script to `frontend/index.html`:
   ```html
   <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
   ```
3. Update CSP in `Caddyfile.railway` — add **exactly** these two origins (pre-approved by Neo):
   - `https://static.cloudflareinsights.com` to `script-src`
   - `https://cloudflareinsights.com` to `connect-src`

**This is the only CSP change approved for analytics.** Do not add any other origins without a security review.

Cloudflare Web Analytics is free on all plans, uses no cookies, and is GDPR-friendly. It provides page views, referrers, countries, browsers, and Core Web Vitals.

---

## 5. LinkedIn launch playbook

### Angle: security as a differentiator

You're a Software Engineer who built a portfolio site like production infrastructure — hardened headers, HMAC-signed cookies, rate limiting, audit logging, responsible-disclosure policy. That's unusual for a portfolio and it's *verifiable*. Invite people to check:

> "Run securityheaders.com on my site."

A verifiable claim + a light challenge = shareable content. Keep it factual — the site's "Built Secure" section already states the security posture honestly. Don't overclaim.

### Mechanics

- **Link placement:** Put the URL in the **first comment**, not the post body. LinkedIn throttles reach on posts with outbound links in the body.
- **Timing:** Tuesday–Thursday, 7–9 AM in your target audience's timezone.
- **First hour:** Reply to every comment quickly — early engagement drives LinkedIn's distribution algorithm.
- **Format:** Short personal hook > why you built it > the verifiable angle. One or two lines about the "why" beat a feature list every time.
- **Hashtags:** 3–5 relevant ones at the end (e.g. `#webdev #security #portfolio #opensource`). Don't overdo it.

---

## 6. Optional post-launch backlog

These are future improvements — pointers only, not blockers for launch:

- **Custom-designed og-image** — replace the current generic image with a branded, designed version for stronger social previews.
- **On-device AI demo (LiteRT.js)** — would need a scoped CSP exception; discuss with Neo before implementing.
- **DB migration system** — before any schema change to the SQLite database, add a lightweight migration tool (e.g. a numbered SQL migration runner) to avoid manual `ALTER TABLE` in production.
- **Privacy note on the contact form** — add a one-liner below the form: *"Your info is stored securely and only used to respond to your inquiry. It's never shared or sold."*
- **Error monitoring** — Sentry free tier (5K errors/month) or similar, to catch unhandled exceptions in production.
