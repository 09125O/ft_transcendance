#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
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

bash scripts/check-env.sh

if [ -n "$COMPOSE_CMD" ]; then
  printf "[..] Mode detecte : docker\n"
  COMPOSE_WAIT_FLAG=""

  if $COMPOSE_CMD up --help 2>/dev/null | grep -q -- '--wait'; then
    COMPOSE_WAIT_FLAG="--wait"
  fi

  bash scripts/generate-dev-cert.sh
  $COMPOSE_CMD up --build -d $COMPOSE_WAIT_FLAG

  set -a
  . ./.env
  set +a

  printf "[OK] Stack prete\n"
  printf "Frontend : https://localhost:%s\n" "${FRONTEND_PORT}"
  printf "Backend  : https://localhost:%s/health\n" "${BACKEND_PORT}"
  printf "Base     : localhost:%s\n" "${POSTGRES_PORT}"
  printf "Commandes utiles : make logs | make test-stack | make smoke-test\n"
  exit 0
fi

printf "[..] Mode detecte : local\n"
bash scripts/setup-local-deps.sh
printf "Demarrage manuel ensuite :\n"
printf "  1. cd backend && npm run start:dev\n"
printf "  2. cd frontend && npm run dev\n"
