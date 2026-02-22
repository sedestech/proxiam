#!/bin/bash
# ═══════════════════════════════════════════
# Proxiam — Backup PostgreSQL
# Usage : ./scripts/backup_db.sh
# Cron  : 0 3 * * * /root/app-proxiam/scripts/backup_db.sh
# ═══════════════════════════════════════════

set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-/root/backups/proxiam}"
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/proxiam_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting PostgreSQL backup..."

# Dump via Docker container
docker compose -f "$COMPOSE_FILE" exec -T database \
    pg_dump -U "${POSTGRES_USER:-proxiam}" "${POSTGRES_DB:-proxiam}" \
    --no-owner --no-privileges \
    | gzip > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup created: $BACKUP_FILE ($SIZE)"

# Supprimer les backups de plus de KEEP_DAYS jours
DELETED=$(find "$BACKUP_DIR" -name "proxiam_*.sql.gz" -mtime +$KEEP_DAYS -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Cleaned $DELETED old backups (>$KEEP_DAYS days)"
fi

echo "[$(date)] Backup complete. Current backups:"
ls -lh "$BACKUP_DIR/"
