#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

if docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1; then
  bash scripts/dev/stack-control.sh up
  exit 0
fi

printf '\n== Execution ==\n'
printf '[..] Mode detecte : local\n'
CHECK_ENV_MODE=compact bash scripts/dev/check-env.sh
bash scripts/dev/setup-local-deps.sh
printf '\n== Suite ==\n'
printf '[WARN] Demarrage manuel requis\n'
printf '1. cd backend && npm run start:dev\n'
printf '2. cd frontend && npm run dev\n'
