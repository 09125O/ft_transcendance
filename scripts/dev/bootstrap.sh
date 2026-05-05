#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_CMD=""

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
fi

if [ ! -f .env ]; then
  cp .env.example .env
  printf "[OK] .env cree depuis .env.example\n"
fi

bash scripts/dev/check-env.sh

set -a
# shellcheck disable=SC1091
. ./.env
set +a

if [ -n "${APP_PROTOCOL:-}" ]; then
  :
elif printf '%s' "${FRONTEND_ORIGIN:-}" | grep -Eq '^https://'; then
  APP_PROTOCOL="https"
else
  APP_PROTOCOL="http"
fi
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-${APP_PROTOCOL}://localhost:${FRONTEND_PORT:-3000}}"
BACKEND_URL="${APP_PROTOCOL}://localhost:${BACKEND_PORT:-4000}/health"

if [ -n "$COMPOSE_CMD" ]; then
  printf "[..] Mode detecte : docker\n"
  COMPOSE_WAIT_FLAG=""

  if $COMPOSE_CMD up --help 2>/dev/null | grep -q -- '--wait'; then
    COMPOSE_WAIT_FLAG="--wait"
  fi

  if [ "$APP_PROTOCOL" = "https" ]; then
    bash scripts/dev/generate-dev-cert.sh
  else
    printf "[OK] Mode HTTP actif: generation TLS ignoree\n"
  fi
  $COMPOSE_CMD up --build -d $COMPOSE_WAIT_FLAG

  printf "[OK] Stack prete\n"
  printf "Frontend : %s\n" "${FRONTEND_ORIGIN}"
  printf "Backend  : %s\n" "${BACKEND_URL}"
  printf "Base     : localhost:%s\n" "${POSTGRES_PORT}"
  printf "Commandes utiles : make logs | make test-stack | make smoke-test\n"
  exit 0
fi

printf "[..] Mode detecte : local\n"
bash scripts/dev/setup-local-deps.sh
printf "Demarrage manuel ensuite :\n"
printf "  1. cd backend && npm run start:dev\n"
printf "  2. cd frontend && npm run dev\n"
