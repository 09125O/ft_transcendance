#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

ACTION="${1:-up}"
COMPOSE_CMD=""
COMPOSE_WAIT_FLAG=""
STACK_OUTPUT_MODE="${STACK_OUTPUT_MODE:-status}"
COMPOSE_DISPLAY_CMD=""

section() {
  printf '\n== %s ==\n' "$1"
}

ok() {
  printf '[OK] %s\n' "$1"
}

info() {
  printf '[..] %s\n' "$1"
}

ko() {
  printf '[KO] %s\n' "$1" >&2
}

detect_compose() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
    COMPOSE_DISPLAY_CMD="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
    COMPOSE_DISPLAY_CMD="docker-compose"
  else
    ko "Ni docker compose ni docker-compose n'est disponible sur cette machine."
    exit 1
  fi

  if $COMPOSE_CMD up --help 2>/dev/null | grep -q -- '--wait'; then
    COMPOSE_WAIT_FLAG="--wait"
  fi
}

run_compose_quiet() {
  command_label="$1"
  shift
  log_file="$(mktemp)"

  info "$command_label"
  if ! $COMPOSE_CMD "$@" >"$log_file" 2>&1; then
    ko "$command_label"
    printf '\n'
    cat "$log_file" >&2
    rm -f "$log_file"
    exit 1
  fi

  rm -f "$log_file"
}

run_compose_with_status() {
  command_label="$1"
  shift

  info "$command_label"
  $COMPOSE_CMD "$@"
}

ensure_env_file() {
  if [ ! -f .env ]; then
    cp .env.example .env
    ok ".env cree depuis .env.example"
  fi
}

load_runtime() {
  CHECK_ENV_MODE=compact bash scripts/dev/check-env.sh .env

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
  MODE_LABEL="HTTP/LAN"

  if [ "$APP_PROTOCOL" = "https" ]; then
    MODE_LABEL="HTTPS local"
  fi
}

ensure_tls_if_needed() {
  if [ "$APP_PROTOCOL" = "https" ]; then
    info "Preparation du certificat TLS de dev"
    bash scripts/dev/generate-dev-cert.sh
  else
    ok "Mode HTTP actif: generation TLS ignoree"
  fi
}

print_summary() {
  section "Resume"
  ok "Stack prete"
  printf 'Profil    : %s\n' "$MODE_LABEL"
  printf 'Frontend  : %s\n' "$FRONTEND_ORIGIN"
  printf 'Backend   : %s\n' "$BACKEND_URL"
  printf 'Database  : localhost:%s\n' "${POSTGRES_PORT:-5432}"
  printf 'Suite     : make logs | make test-stack | make smoke-test\n'
}

case "$ACTION" in
  up|restart)
    :
    ;;
  *)
    ko "Usage: bash scripts/dev/stack-control.sh [up|restart]"
    exit 1
    ;;
esac

section "Preparation"
detect_compose
ensure_env_file
load_runtime

section "Execution"
info "Mode detecte : docker (${COMPOSE_CMD})"
info "Profil      : ${MODE_LABEL}"
ensure_tls_if_needed

if [ "$ACTION" = "restart" ]; then
  if [ "$STACK_OUTPUT_MODE" = "quiet" ]; then
    run_compose_quiet "${COMPOSE_DISPLAY_CMD} down" down --remove-orphans
  else
    run_compose_with_status "${COMPOSE_DISPLAY_CMD} down" down --remove-orphans
  fi
fi

if [ "$STACK_OUTPUT_MODE" = "quiet" ]; then
  run_compose_quiet \
    "${COMPOSE_DISPLAY_CMD} up --build -d ${COMPOSE_WAIT_FLAG}" \
    up --build --quiet-build --quiet-pull -d ${COMPOSE_WAIT_FLAG}
else
  run_compose_with_status \
    "${COMPOSE_DISPLAY_CMD} up --build -d ${COMPOSE_WAIT_FLAG}" \
    up --build --quiet-build -d ${COMPOSE_WAIT_FLAG}
fi

print_summary
