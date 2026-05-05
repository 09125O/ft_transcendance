#!/bin/sh

set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
STATUS_FILE="${BACKUP_STATUS_FILE:-/runtime/backup-status.json}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-3600}"
RETENTION_COUNT="${BACKUP_RETENTION_COUNT:-24}"
DB_HOST="${POSTGRES_HOST:-db}"

case "$INTERVAL_SECONDS" in
  ''|*[!0-9]*|0)
    printf '[KO] BACKUP_INTERVAL_SECONDS must be a positive integer\n' >&2
    exit 1
    ;;
esac

case "$RETENTION_COUNT" in
  ''|*[!0-9]*|0)
    printf '[KO] BACKUP_RETENTION_COUNT must be a positive integer\n' >&2
    exit 1
    ;;
esac

mkdir -p "$BACKUP_DIR" "$(dirname "$STATUS_FILE")"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

json_string_or_null() {
  if [ -n "${1:-}" ]; then
    printf '"%s"' "$(json_escape "$1")"
  else
    printf 'null'
  fi
}

write_status() {
  status_ok="$1"
  message="$2"
  checked_at="$3"
  latest_file="$4"
  last_success_at="$5"
  last_failure_at="$6"
  error_message="$7"
  tmp_file="${STATUS_FILE}.tmp"

  cat >"$tmp_file" <<EOF
{
  "ok": ${status_ok},
  "automated": true,
  "checkedAt": $(json_string_or_null "$checked_at"),
  "directory": $(json_string_or_null "$BACKUP_DIR"),
  "intervalSeconds": ${INTERVAL_SECONDS},
  "retentionCount": ${RETENTION_COUNT},
  "latestFile": $(json_string_or_null "$latest_file"),
  "lastSuccessAt": $(json_string_or_null "$last_success_at"),
  "lastFailureAt": $(json_string_or_null "$last_failure_at"),
  "message": $(json_string_or_null "$message"),
  "error": $(json_string_or_null "$error_message")
}
EOF

  mv "$tmp_file" "$STATUS_FILE"
}

prune_backups() {
  count=0

  for file in $(ls -1t "$BACKUP_DIR"/quiz_db-*.sql 2>/dev/null || true); do
    count=$((count + 1))
    if [ "$count" -gt "$RETENTION_COUNT" ]; then
      rm -f "$file"
    fi
  done
}

run_backup() {
  timestamp="$(date -u +%Y%m%d-%H%M%S)"
  checked_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  output_file="${BACKUP_DIR}/quiz_db-${timestamp}.sql"
  error_file="$(mktemp)"

  if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    >"$output_file" 2>"$error_file"; then
    rm -f "$error_file"
    prune_backups
    write_status \
      true \
      "Automated backup completed successfully." \
      "$checked_at" \
      "$(basename "$output_file")" \
      "$checked_at" \
      "" \
      ""
    printf '[OK] Automated backup created: %s\n' "$output_file"
    return 0
  fi

  error_message="$(tr '\n' ' ' <"$error_file" | sed 's/[[:space:]]\+/ /g; s/^ //; s/ $//')"
  rm -f "$error_file" "$output_file"
  write_status \
    false \
    "Automated backup failed." \
    "$checked_at" \
    "" \
    "" \
    "$checked_at" \
    "${error_message:-Backup failed without stderr output.}"
  printf '[KO] Automated backup failed: %s\n' "${error_message:-unknown error}" >&2
  return 1
}

run_backup || true

while true; do
  sleep "$INTERVAL_SECONDS"
  run_backup || true
done
