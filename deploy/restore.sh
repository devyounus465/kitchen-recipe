#!/usr/bin/env bash
# Usage: deploy/restore.sh /opt/simmerly-backups/db-XXXX.dump [/opt/simmerly-backups/uploads-XXXX.tar.gz]
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f "${1:-}" ] || { echo "usage: $0 <db.dump> [uploads.tar.gz]"; exit 1; }
read -r -p "This REPLACES the live database. Type RESTORE to continue: " ok; [ "$ok" = "RESTORE" ] || exit 1
docker compose exec -T db pg_restore -U simmerly -d simmerly --clean --if-exists --no-owner < "$1"
[ -n "${2:-}" ] && docker compose exec -T app tar -xzf - -C /data/uploads < "$2"
echo "restore complete"
