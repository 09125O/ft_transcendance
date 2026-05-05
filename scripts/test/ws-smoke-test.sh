#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env ]; then
	set -a
	# shellcheck disable=SC1091
	. ./.env
	set +a
fi

compose() {
	if docker compose version >/dev/null 2>&1; then
		docker compose "$@"
	elif command -v docker-compose >/dev/null 2>&1; then
		docker-compose "$@"
	else
		printf '[KO] Ni docker compose ni docker-compose n'"'"'est disponible\n' >&2
		exit 1
	fi
}

run_database_query() {
	query="$1"

	docker exec -i quiz_db sh -lc \
		"PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -h 127.0.0.1 -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -v ON_ERROR_STOP=1 -t -A -c \"$query\""
}

cleanup_ws_smoke_users() {
	run_database_query "DELETE FROM \\\"User\\\" WHERE email LIKE 'ws-smoke-%@test.com';" \
		>/dev/null 2>&1 || true
}

cleanup() {
	cleanup_ws_smoke_users
}

trap cleanup EXIT

cleanup_ws_smoke_users

if [ -n "${WS_BASE_URL:-}" ]; then
	if [ -n "${APP_PROTOCOL:-}" ]; then
		EFFECTIVE_PROTOCOL="$APP_PROTOCOL"
	elif printf '%s' "${WS_BASE_URL}" | grep -Eq '^https://'; then
		EFFECTIVE_PROTOCOL="https"
	elif printf '%s' "${FRONTEND_ORIGIN:-}" | grep -Eq '^https://'; then
		EFFECTIVE_PROTOCOL="https"
	else
		EFFECTIVE_PROTOCOL="http"
	fi

	compose exec -T -e WS_BASE_URL="$WS_BASE_URL" backend sh -lc '
		if [ "'"$EFFECTIVE_PROTOCOL"'" = "https" ] && [ -f /certs/mkcert-rootCA.pem ]; then
			NODE_EXTRA_CA_CERTS=/certs/mkcert-rootCA.pem node scripts/ws-smoke-test.mjs
		else
			node scripts/ws-smoke-test.mjs
		fi
	'
else
	compose exec -T backend sh -lc 'npm run test:ws-smoke'
fi
