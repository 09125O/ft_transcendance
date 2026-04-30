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

  command -v mkcert >/dev/null 2>&1 || {
    printf "[KO] mkcert est requis pour la stack Docker locale.\n" >&2
    printf "Installe-le puis relance la meme commande: make bootstrap\n" >&2
    exit 1
  }

  mkcert -install >/dev/null 2>&1 || true
  bash scripts/generate-dev-cert.sh
  $COMPOSE_CMD up --build -d --wait

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
