#!/usr/bin/env bash
# Daily backup on the VPS: database dump + uploaded files, keeps 14 days.
# cron:  15 3 * * * /opt/simmerly/deploy/backup.sh >> /var/log/simmerly-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="${BACKUP_DIR:-/opt/simmerly-backups}"; KEEP="${BACKUP_KEEP_DAYS:-14}"; TS=$(date +%Y%m%d-%H%M%S)
mkdir -p "$DEST"
docker compose exec -T db pg_dump -U simmerly --format=custom simmerly > "$DEST/db-$TS.dump"
docker compose exec -T app tar -czf - -C /data/uploads . > "$DEST/uploads-$TS.tar.gz"
find "$DEST" -type f -mtime +"$KEEP" -delete
echo "[$(date -Is)] backup ok → $DEST/db-$TS.dump"
