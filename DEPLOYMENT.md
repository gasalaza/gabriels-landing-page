# Deployment Guide — Gabriel's Landing Page

Two-service topology on Railway: a **private backend** (Node/Express + SQLite) and a **public web** service (Caddy serving the SPA + reverse-proxying `/api/*`).

---

## 1. Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Homepage URL:** `https://<your-domain>`
3. **Authorization callback URL:** `https://<your-domain>/api/admin/auth/github/callback`
4. Copy the **Client ID** and generate a **Client Secret**.

---

## 2. Railway Project Setup

Create a new Railway project from this repo. Add **two services**:

### Backend service

| Setting | Value |
|---------|-------|
| Dockerfile | `./Dockerfile` |
| Internal networking | Enabled (private) |

**Environment variables:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `PUBLIC_BASE_URL` | `https://<your-domain>` *(also drives the CORS allowlist + `/api/contact` Origin check — must match the real public origin)* |
| `SQLITE_DATABASE_PATH` | `/app/backend/data/app.db` |
| `SESSION_SECRET` | *(generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)* |
| `GITHUB_CLIENT_ID` | *(from step 1)* |
| `GITHUB_CLIENT_SECRET` | *(from step 1)* |
| `AUTH_ALLOWLIST` | `gasalaza` |
| `TRUST_PROXY` | `2` *(Cloudflare → Railway = 2 proxy hops; default is `1`. Validate the real X-Forwarded-For chain in staging — wrong value weakens rate limiting)* |
| `CONTACT_EMAIL_DAILY_CAP` | `50` *(caps Resend sends per rolling 24 h; protects the free-tier 100/day quota and prevents inbox flooding. Submissions still persist + return 201 after the cap)* |

### Web service

| Setting | Value |
|---------|-------|
| Dockerfile | `./Dockerfile.railway-web` |
| Public networking | Enabled |

**Environment variables:**

| Variable | Value |
|----------|-------|
| `PORT` | `8080` |
| `BACKEND_UPSTREAM` | `http://backend.railway.internal:3000` |

---

## 3. Attach Storage Volume

On the **backend** service:

- Add a volume named `sqlite-data` mounted at `/app/backend/data`.

---

## 4. Deploy Settings

- Enable **Wait-for-CI** on both services so deploys only trigger after the GitHub Actions "Test and build" check passes.
- Set **watch paths** to minimize unnecessary rebuilds:
  - Backend: `backend/**`, `package.json`, `package-lock.json`, `Dockerfile`
  - Web: `frontend/**`, `package.json`, `package-lock.json`, `Dockerfile.railway-web`, `Caddyfile.railway`

---

## 5. Custom Domain + DNS

On the **web** service:

1. Add your custom domain in Railway settings.
2. In your DNS provider, add:
   - `CNAME` record pointing to the Railway-provided hostname.
   - `TXT` record for domain verification (Railway provides this).
3. Railway handles TLS certificates automatically.

---

## 6. Local Testing with Docker Compose

```bash
# Copy .env.example and fill in values (real or test placeholders)
cp .env.example .env

# Build and start both services
docker compose up --build

# Visit http://localhost:8080
# - SPA loads
# - /api/health returns 200 (proxied to backend)
# - OAuth won't complete without real GitHub creds (expected)

# Tear down
docker compose down -v
```

---

## 7. Post-Deploy Smoke Test

1. Load `https://<your-domain>` — the landing page renders.
2. Submit the contact form — should succeed (check DB via admin).
3. Navigate to `/admin` → "Sign in with GitHub" → OAuth flow → admin dashboard shows messages.
4. Check response headers for CSP, HSTS, X-Frame-Options (use browser DevTools → Network tab).

---

## 8. Contact Email Notifications (Resend)

The backend optionally emails you when someone submits the contact form, using [Resend](https://resend.com) (free tier: 3,000 emails/month, 100/day).

1. Create a free Resend account at https://resend.com.
2. Create an API key in the Resend dashboard.
3. Set these env vars on the **backend** Railway service:

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | *(from step 2)* |
| `CONTACT_NOTIFY_TO` | *(your inbox, e.g. gabriel@example.com)* |
| `CONTACT_NOTIFY_FROM` | `onboarding@resend.dev` |

4. **`onboarding@resend.dev`** works immediately but can only send to your own Resend-verified email. After `gasalaza.com` DNS is live, verify the domain in Resend and switch `CONTACT_NOTIFY_FROM` to `noreply@gasalaza.com` (or similar).
5. If any of the three vars are empty/missing, email silently no-ops — the contact form still works and persists to the DB.

**Local testing:** Copy `.env.example` → `.env` at the repo root and set `RESEND_API_KEY` + `CONTACT_NOTIFY_TO`. Restart `npm run dev` — the backend auto-loads the repo-root `.env` on startup. (Production uses Railway-injected env vars instead.)

---

## 9. Secret Hygiene

- **Never** commit `.env` to the repo (it's in `.gitignore`).
- `SESSION_SECRET` lives only in Railway env vars — rotate immediately if leaked.
- GitHub OAuth Client Secret: regenerate in GitHub settings if compromised.
- SQLite data lives on the Railway volume — enable Railway's backup snapshots.
