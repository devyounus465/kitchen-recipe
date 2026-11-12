#!/usr/bin/env bash
# Usage: scripts/restore.sh backups/db-YYYYmmdd-HHMMSS.dump [backups/uploads-....tar.gz]
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
[ -f "${1:-}" ] || { echo "usage: $0 <db.dump> [uploads.tar.gz]"; exit 1; }
read -r -p "This REPLACES the current database. Type RESTORE to continue: " ok; [ "$ok" = "RESTORE" ] || exit 1
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$1"
if [ -n "${2:-}" ]; then mkdir -p "${UPLOAD_DIR:-./uploads}"; tar -xzf "$2" -C "${UPLOAD_DIR:-./uploads}"; fi
echo "restore complete"
