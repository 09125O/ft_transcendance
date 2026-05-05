#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

BACKUP_DIR="${BACKUP_DIR:-${ROOT_DIR}/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_FILE="${1:-${BACKUP_DIR}/quiz_db-${TIMESTAMP}.sql}"

mkdir -p "$(dirname "$OUTPUT_FILE")"

docker exec quiz_db sh -lc '
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h 127.0.0.1 \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges
' > "$OUTPUT_FILE"

printf '[OK] Backup created: %s\n' "$OUTPUT_FILE"
