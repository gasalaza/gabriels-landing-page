#!/usr/bin/env bash
set -euo pipefail

# backup-sqlite.sh — Online SQLite backup + local rotation
#
# Usage:
#   ./scripts/backup-sqlite.sh [DB_PATH] [BACKUP_DIR]
#
# Defaults match the docker-compose.prod.yml bind-mount paths.
# Add to deploy user's crontab:
#   0 */6 * * * /opt/gabriels-landing-page/scripts/backup-sqlite.sh

DB="${1:-./data/app.db}"
BACKUP_DIR="${2:-./data/backups}"

if [ ! -f "$DB" ]; then
  echo "ERROR: Database not found at $DB" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

DEST="$BACKUP_DIR/app-$(date +%Y%m%d-%H%M%S).db"

# Use SQLite's .backup command for a consistent online snapshot
sqlite3 "$DB" ".backup '$DEST'"

echo "Backup created: $DEST ($(du -h "$DEST" | cut -f1))"

# Prune local backups older than 30 days
find "$BACKUP_DIR" -name 'app-*.db' -mtime +30 -delete

echo "Pruned backups older than 30 days."

# ─── Off-box copy (uncomment after configuring rclone) ──────────────
# Requires `rclone config` with a remote named "offbox" pointing to
# Cloudflare R2 (10 GB free) or Backblaze B2 (10 GB free).
#
# IMPORTANT: The database contains contact-form PII. Encrypt before
# uploading off-box:
#   age -r age1... "$DEST" > "${DEST}.age"
#   rclone copy "${DEST}.age" offbox:gabriels-backups/
#   rm "${DEST}.age"
#
# Or with GPG:
#   gpg --symmetric --cipher-algo AES256 -o "${DEST}.gpg" "$DEST"
#   rclone copy "${DEST}.gpg" offbox:gabriels-backups/
#   rm "${DEST}.gpg"
