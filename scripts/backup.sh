#!/usr/bin/env bash
# Nightly backup: database dump + uploaded media, 14-day rotation.
# cron: 15 3 * * * /opt/simmerly/scripts/backup.sh >> /var/log/simmerly-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
DEST="${BACKUP_DIR:-./backups}"; KEEP="${BACKUP_KEEP_DAYS:-14}"; TS=$(date +%Y%m%d-%H%M%S)
mkdir -p "$DEST"
pg_dump --format=custom --no-owner "$DATABASE_URL" > "$DEST/db-$TS.dump"
tar -czf "$DEST/uploads-$TS.tar.gz" -C "${UPLOAD_DIR:-./uploads}" .
find "$DEST" -type f -mtime +"$KEEP" -delete
echo "[$(date -Is)] backup ok: $DEST/db-$TS.dump"
# Optional off-site copy: aws s3 cp "$DEST/db-$TS.dump" s3://your-bucket/simmerly/
