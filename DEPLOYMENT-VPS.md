# Deployment Guide — $0/month VPS (Oracle Cloud A1 + Docker Compose + Caddy + Cloudflare)

> **Looking for the Railway deployment path?** See [DEPLOYMENT.md](DEPLOYMENT.md).

Same two-service topology as Railway — a **backend** (Node/Express + SQLite) and a **web** service (Caddy serving the SPA + reverse-proxying `/api/*`) — but self-hosted on a free-tier ARM VPS behind Cloudflare.

---

## 1. When to Choose VPS vs Railway

| | Railway | VPS (this guide) |
|---|---|---|
| **Cost** | ~$5–10/month (usage-based) | $0/month (Oracle Always Free / GCP free tier) |
| **Ops burden** | Managed — zero server maintenance | You own the box: updates, firewall, backups |
| **Deploy** | Git-push auto-deploy | Git-pull + `docker compose up` (manual or CI) |
| **Best for** | Fast iteration, zero-ops preference | Budget-constrained, levelsio-style single-box |

If you want managed simplicity, use Railway ([DEPLOYMENT.md](DEPLOYMENT.md)). If you want $0/month and don't mind basic server ops, continue here.

---

## 2. Oracle Cloud A1 Provisioning

Oracle Cloud Infrastructure (OCI) **Always Free** tier includes an ARM Ampere A1 VM with up to 4 OCPUs and 24 GB RAM (as of 2026). We use 2 OCPUs / 12 GB, which is more than enough.

1. Create an OCI account at https://cloud.oracle.com (credit card required for verification, never charged for Always Free resources).
2. Navigate to **Compute → Instances → Create Instance**.
3. Configure:
   - **Shape:** `VM.Standard.A1.Flex` — 2 OCPUs, 12 GB RAM
   - **Image:** Ubuntu 22.04 (aarch64)
   - **Boot volume:** 50 GB (within free tier)
   - **Networking:** assign a public IP; create or use a VCN with a public subnet
4. Add your SSH public key (Ed25519 recommended — see §8 hardening).
5. Click **Create**.

### ⚠️ "Out of host capacity" gotcha

If your region shows "Out of host capacity" for A1 shapes, try:
- A different availability domain within the same region
- A different region (Phoenix, Ashburn, and Frankfurt typically have capacity)
- Retry during off-peak hours (early morning UTC)
- Use the OCI CLI to script retry attempts

### Fallback: GCP e2-micro

If OCI capacity is unavailable, GCP offers a free `e2-micro` VM (0.25 vCPU, 1 GB RAM, `us-central1`/`us-east1`/`us-west1`). It's tighter on resources but runs this app fine. Create via:

```bash
gcloud compute instances create gabriels-landing \
  --machine-type=e2-micro \
  --zone=us-central1-a \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB
```

---

## 3. Install Docker + Create a Deploy User

SSH into the new VM:

```bash
ssh ubuntu@<VPS_IP>
```

### Create a non-root deploy user

```bash
sudo adduser --disabled-password deploy
sudo usermod -aG docker deploy
# Copy your SSH key to the deploy user
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### Install Docker Engine

```bash
# Official Docker install (Ubuntu)
curl -fsSL https://get.docker.com | sudo sh

# Verify
sudo docker run --rm hello-world

# Enable for deploy user (re-login required)
sudo usermod -aG docker deploy
```

> **Alternative: distro packages.** On the Oracle Ubuntu image you can skip the convenience script and install Docker from Ubuntu's own repositories instead:
> ```bash
> sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2
> ```
> This gives you distro-managed updates via `unattended-upgrades` at the cost of slightly older Docker versions.

---

## 4. Clone Repo + Configure Environment

```bash
# Switch to deploy user
sudo -iu deploy

# Clone to /opt
sudo mkdir -p /opt/gabriels-landing-page
sudo chown deploy:deploy /opt/gabriels-landing-page
git clone https://github.com/gasalaza/gabriels-landing-page.git /opt/gabriels-landing-page
cd /opt/gabriels-landing-page
```

### Create `.env`

```bash
cp .env.example .env
chmod 600 .env    # 🔴 Required — secrets readable only by deploy user
```

Edit `.env` with production values:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `PUBLIC_BASE_URL` | `https://gasalaza.com` |
| `SQLITE_DATABASE_PATH` | `/app/backend/data/app.db` |
| `SESSION_SECRET` | *(generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)* |
| `GITHUB_CLIENT_ID` | *(from your GitHub OAuth App)* |
| `GITHUB_CLIENT_SECRET` | *(from your GitHub OAuth App)* |
| `AUTH_ALLOWLIST` | `gasalaza` |
| `TRUST_PROXY` | `1` |
| `RESEND_API_KEY` | *(from Resend dashboard)* |
| `CONTACT_NOTIFY_TO` | *(your email)* |
| `CONTACT_NOTIFY_FROM` | `onboarding@resend.dev` *(switch to `noreply@gasalaza.com` after domain verification)* |
| `CONTACT_EMAIL_DAILY_CAP` | `50` |

**`TRUST_PROXY=1` (not 2):** On the VPS, the proxy chain is **Cloudflare → Caddy → Express** — only **one** trusted proxy hop (Caddy). On Railway, it's Cloudflare → Railway edge → Caddy → Express = 2 hops, hence `TRUST_PROXY=2`. Getting this right is critical: Express uses `trust proxy` to parse `X-Forwarded-For` for `req.ip`, which our rate limiter relies on via `cf-connecting-ip`. A wrong value means rate limiting keys on a proxy IP instead of the real client.

---

## 5. TLS + Cloudflare Setup

### Create a Cloudflare Origin Certificate

1. Log in to Cloudflare → select your domain → **SSL/TLS → Origin Server**.
2. Click **Create Certificate**.
3. Keep the defaults (RSA 2048 or ECDSA, 15-year validity, covers `gasalaza.com` and `*.gasalaza.com`).
4. Copy the **Origin Certificate** and **Private Key**.

### Place the certificate on the VPS

```bash
mkdir -p /opt/gabriels-landing-page/certs
# Paste the cert and key into these files:
nano /opt/gabriels-landing-page/certs/origin.pem
nano /opt/gabriels-landing-page/certs/origin.key

chmod 600 /opt/gabriels-landing-page/certs/origin.key
chmod 644 /opt/gabriels-landing-page/certs/origin.pem
```

These paths match `Caddyfile.prod`'s `tls /etc/caddy/certs/origin.pem /etc/caddy/certs/origin.key` via the `./certs:/etc/caddy/certs:ro` bind mount in `docker-compose.prod.yml`.

### Configure Cloudflare

1. **SSL/TLS mode:** Set to **Full (strict)** — Cloudflare validates the origin cert it issued.
2. **DNS:** Add an `A` record: `gasalaza.com` → `<VPS_IP>`, **Proxied** (orange cloud ☁️).
3. Add a `CNAME` for `www` → `gasalaza.com` (proxied) if desired.

### Why an Origin Certificate instead of Let's Encrypt?

When the firewall is locked to Cloudflare IPs only (§6, Neo's 🔴 requirement), Let's Encrypt's HTTP-01 challenge servers cannot reach port 80 on your origin — ACME validation fails. A Cloudflare Origin Certificate is trusted only by Cloudflare's edge (which is fine since all traffic must flow through CF anyway) and eliminates the ACME dependency entirely.

Alternatives (documented in `Caddyfile.prod` comments):
- **ACME HTTP-01:** Works only if the firewall is open to the internet (not recommended).
- **ACME DNS-01:** Works with a locked firewall but requires a custom Caddy build with the `caddy-dns/cloudflare` plugin and a scoped CF API token.

---

## 6. Firewall / Origin Lockdown

> 🔴 **Required before production traffic.** This is the single most important security measure for a CF-proxied origin.

The goal: only Cloudflare can reach ports 80/443, and only your IP can reach SSH. This prevents attackers from bypassing Cloudflare (and our `cf-connecting-ip` trust model that the rate limiter depends on).

### Belt-and-suspenders: both cloud and host layers

#### Layer 1 — Oracle Cloud Security List (or GCP Firewall Rules)

In OCI Console → Networking → VCN → Security Lists → Default:

| Direction | Source | Protocol | Port | Action |
|-----------|--------|----------|------|--------|
| Ingress | `173.245.48.0/20` | TCP | 80, 443 | Allow |
| Ingress | `103.21.244.0/22` | TCP | 80, 443 | Allow |
| Ingress | `103.22.200.0/22` | TCP | 80, 443 | Allow |
| Ingress | `103.31.4.0/22` | TCP | 80, 443 | Allow |
| Ingress | `141.101.64.0/18` | TCP | 80, 443 | Allow |
| Ingress | `108.162.192.0/18` | TCP | 80, 443 | Allow |
| Ingress | `190.93.240.0/20` | TCP | 80, 443 | Allow |
| Ingress | `188.114.96.0/20` | TCP | 80, 443 | Allow |
| Ingress | `197.234.240.0/22` | TCP | 80, 443 | Allow |
| Ingress | `198.41.128.0/17` | TCP | 80, 443 | Allow |
| Ingress | `162.158.0.0/15` | TCP | 80, 443 | Allow |
| Ingress | `104.16.0.0/13` | TCP | 80, 443 | Allow |
| Ingress | `104.24.0.0/14` | TCP | 80, 443 | Allow |
| Ingress | `172.64.0.0/13` | TCP | 80, 443 | Allow |
| Ingress | `131.0.72.0/22` | TCP | 80, 443 | Allow |
| Ingress | `<YOUR_IP>/32` | TCP | 22 | Allow |
| Ingress | `0.0.0.0/0` | ALL | ALL | **Drop** (default deny) |

Full, up-to-date list: https://www.cloudflare.com/ips/

#### Layer 2 — Host firewall (ufw)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH — restrict to your IP
sudo ufw allow from <YOUR_IP>/32 to any port 22 proto tcp

# HTTP/HTTPS — Cloudflare IPs only
# (fetch current list and add each CIDR)
for cidr in $(curl -s https://www.cloudflare.com/ips-v4/); do
  sudo ufw allow from "$cidr" to any port 80,443 proto tcp
done

sudo ufw enable
sudo ufw status verbose
```

**Why both layers?** Cloud security lists can be accidentally modified via the console; host ufw survives console misconfigurations. Defense in depth.

---

## 7. Bring It Up

```bash
cd /opt/gabriels-landing-page
docker compose -f docker-compose.prod.yml up -d --build
```

Verify:
```bash
docker compose -f docker-compose.prod.yml ps    # both services "running"
docker compose -f docker-compose.prod.yml logs   # no errors
curl -sI https://gasalaza.com | head -20          # from your local machine
```

---

## 8. Hardening Checklist

### 🔴 MUST — before production traffic

- [ ] **SSH key-only auth:** disable `PasswordAuthentication` and `PermitRootLogin` in `/etc/ssh/sshd_config`; use Ed25519 keys (`ssh-keygen -t ed25519`)
- [ ] **Intrusion detection:** install fail2ban or CrowdSec on sshd
  ```bash
  sudo apt install -y fail2ban
  sudo systemctl enable --now fail2ban
  ```
- [ ] **Firewall default-deny:** 80/443 → Cloudflare IPs only, 22 → your IP, at BOTH cloud-security-list and host (ufw) layers (§6)
- [ ] **Automatic security updates:** enable unattended-upgrades with auto-reboot window
  ```bash
  sudo apt install -y unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  # Set reboot window in /etc/apt/apt.conf.d/50unattended-upgrades:
  # Unattended-Upgrade::Automatic-Reboot "true";
  # Unattended-Upgrade::Automatic-Reboot-Time "04:00";
  ```
- [ ] **`.env` permissions:** `chmod 600 .env`, owned by `deploy` user — secrets never baked into the Docker image
- [ ] **🔴 Rotate burned secrets:** the Resend API key and GitHub OAuth Client Secret were pasted in chat — treat them as compromised. Generate new ones before going live:
  - Resend: Dashboard → API Keys → revoke old, create new
  - GitHub OAuth: Settings → Developer settings → OAuth Apps → regenerate secret
- [ ] **MFA on cloud console:** enable multi-factor authentication on your Oracle Cloud / GCP account

### 🟡 SHOULD — within the first week

- [ ] **Move sshd to a high port** (e.g., 2222) or tunnel SSH via `cloudflared` to hide it from scanners
- [ ] **Dedicated deploy user:** the `deploy` user runs compose; our Dockerfile already specifies `USER node` inside the container ✅
- [ ] **SQLite file permissions:** `chmod 600` on the `.db`, `-wal`, and `-shm` files; Oracle boot volumes are AES-256 encrypted at rest by default — verify this in the OCI console under Block Storage
- [ ] **Encrypt off-box backups:** the database contains contact-form PII — use `age` or `gpg` before uploading to R2/B2 (see §9)
- [ ] **Log rotation:** configure logrotate for app + Caddy logs
  ```bash
  # /etc/logrotate.d/gabriels-landing
  /opt/gabriels-landing-page/data/logs/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
  }
  ```
- [ ] **Uptime monitoring:** set up a free monitor (UptimeRobot or Healthchecks.io) on `https://gasalaza.com/api/health`
- [ ] **Billing alert:** set a $0/$1 budget alert in OCI/GCP to catch egress-over-10TB abuse

### 🟢 NICE to have

- [ ] Don't mount the Docker socket into containers (or use rootless Docker / Podman)
- [ ] Script the full box setup via cloud-init or Ansible for nuke-and-rebuild capability
- [ ] Enable SSH session audit logging (`/var/log/auth.log` + forwarding to a log aggregator)
- [ ] Confirm Caddy's admin API stays bound to `localhost:2019` (default — don't expose it)

---

## 9. Backups

### Automated local backups

Add to the `deploy` user's crontab:

```bash
crontab -e
# Run every 6 hours
0 */6 * * * cd /opt/gabriels-landing-page && ./scripts/backup-sqlite.sh
```

The script (`scripts/backup-sqlite.sh`) uses SQLite's `.backup` command for a consistent online snapshot and prunes backups older than 30 days.

### Off-box backups (Cloudflare R2 / Backblaze B2)

Both offer 10 GB free storage. Setup:

1. Create an R2/B2 bucket.
2. Install and configure `rclone`:
   ```bash
   curl https://rclone.org/install.sh | sudo bash
   rclone config   # create a remote named "offbox"
   ```
3. **Encrypt before uploading** — the DB contains contact-form PII:
   ```bash
   age -r age1your-public-key data/backups/app-*.db > backup.age
   rclone copy backup.age offbox:gabriels-backups/
   ```
4. See commented examples in `scripts/backup-sqlite.sh` for integration.

---

## 10. Enable Auto-Deploy

> ### ⚠️ Before activating the deploy workflow
>
> These steps **cannot be completed until the Oracle/GCP instance is provisioned** and SSH-accessible:
>
> 1. **Populate GitHub Secrets** — add `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY` (the deploy user's Ed25519 private key) under **Settings → Secrets and variables → Actions** in the GitHub repo.
> 2. **Pin the VPS SSH host-key fingerprint** — SSH into the new server, retrieve its host key (`ssh-keyscan -t ed25519 <VPS_IP>`), and store the fingerprint in the workflow's `known_hosts` configuration. The deploy workflow **must** use strict host-key checking against this pinned fingerprint — never use `StrictHostKeyChecking=no`, which is vulnerable to MITM attacks.
>
> Until both are done, the workflow is intentionally dormant (`workflow_dispatch`-only with no secrets configured).

Once the VPS is running and tested:

1. Add GitHub repo secrets:
   - `VPS_HOST` — the VPS IP or hostname
   - `VPS_USER` — `deploy`
   - `VPS_SSH_KEY` — the deploy user's Ed25519 private key
2. Edit `.github/workflows/deploy-vps.yml`:
   - Change trigger from `workflow_dispatch` to `push: branches: [main]`
   - Add `needs: verify` to gate on the CI job
3. Push to main → auto-deploy fires.

---

## 11. Smoke Test

After deployment, verify (same checks as [DEPLOYMENT.md §7](DEPLOYMENT.md)):

1. **Page loads:** `https://gasalaza.com` renders the landing page.
2. **Contact form:** submit the form — should succeed (check admin dashboard / DB).
3. **OAuth:** navigate to `/admin` → "Sign in with GitHub" → complete the OAuth flow → admin dashboard shows messages.
4. **Security headers:** use browser DevTools → Network tab; verify `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `Permissions-Policy` headers are present.
5. **Rate limiting:** submit the contact form 6 times rapidly → the 6th request should return HTTP 429.

---

## 12. Differences from Railway

| Aspect | Railway | VPS |
|--------|---------|-----|
| **TLS** | Railway auto-provisions | Cloudflare Origin Certificate (manual) |
| **TRUST_PROXY** | `2` (CF → Railway → Caddy) | `1` (CF → Caddy) |
| **Compose file** | `docker-compose.yml` | `docker-compose.prod.yml` |
| **Caddyfile** | `Caddyfile.railway` (port 8080) | `Caddyfile.prod` (domain + TLS) |
| **Caddy ports** | 8080 (Railway routes externally) | 80 + 443 (direct) |
| **Storage** | Railway volume | Host bind-mount (`./data/`) |
| **Deploy** | Git-push auto-deploy | SSH + `docker compose up` (CI or manual) |
| **Backups** | Railway volume snapshots | `scripts/backup-sqlite.sh` + cron |
| **Firewall** | Railway manages infra | You manage: cloud security list + ufw |
| **Cost** | ~$5–10/month | $0/month (Always Free tier) |
