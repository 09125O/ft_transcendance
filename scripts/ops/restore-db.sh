#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

INPUT_FILE="${1:-}"

if [ -z "$INPUT_FILE" ]; then
  printf '[KO] Usage: bash scripts/ops/restore-db.sh backups/your-file.sql\n' >&2
  exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
  printf '[KO] Backup file not found: %s\n' "$INPUT_FILE" >&2
  exit 1
fi

docker exec -i quiz_db sh -lc '
  PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h 127.0.0.1 \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    -v ON_ERROR_STOP=1
' < "$INPUT_FILE"

printf '[OK] Restore completed from: %s\n' "$INPUT_FILE"
