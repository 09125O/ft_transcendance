#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

CURRENT_USER="${SUDO_USER:-${USER:-$(id -un 2>/dev/null || printf 'user')}}"

compose_available() {
  docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1
}

docker_usable() {
  docker info >/dev/null 2>&1
}

user_declared_in_docker_group() {
  if [ ! -r /etc/group ]; then
    return 1
  fi

  awk -F: -v user="$CURRENT_USER" '
    $1 == "docker" {
      split($4, members, ",")
      for (i in members) {
        if (members[i] == user) {
          found = 1
        }
      }
    }
    END { exit(found ? 0 : 1) }
  ' /etc/group
}

docker_usable_via_sg() {
  command -v sg >/dev/null 2>&1 || return 1
  user_declared_in_docker_group || return 1
  sg docker -c 'docker info >/dev/null 2>&1'
}

run_stack_up() {
  if docker_usable; then
    bash scripts/dev/stack-control.sh up
    return 0
  fi

  if docker_usable_via_sg; then
    printf '[..] Activation immediate du groupe docker via sg\n'
    sg docker -c "cd '$ROOT_DIR' && bash scripts/dev/stack-control.sh up"
    return 0
  fi

  return 1
}

if compose_available && run_stack_up; then
  exit 0
fi

printf '\n== Execution ==\n'
if compose_available; then
  printf '[KO] Docker Compose est detecte mais Docker n est pas utilisable sur ce poste.\n' >&2
  printf '[WARN] Causes probables: daemon Docker arrete, Docker Desktop non lance, ou permissions manquantes.\n'
  printf '[WARN] Si le groupe docker vient d etre modifie, ouvre une nouvelle session puis relance make.\n'
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  printf '[KO] Ni stack Docker exploitable ni runtime Node local disponible.\n' >&2
  printf '[WARN] Pour utiliser ce projet sur un nouveau poste, il faut soit:\n'
  printf '  - Docker + Docker Compose deja installes et operationnels\n'
  printf '  - ou Node + npm deja installes pour un lancement local manuel\n'
  exit 1
fi

printf '[..] Mode detecte : local\n'
CHECK_ENV_MODE=compact bash scripts/dev/check-env.sh
bash scripts/dev/setup-local-deps.sh
printf '\n== Suite ==\n'
printf '[WARN] Demarrage manuel requis\n'
printf '[WARN] PostgreSQL doit deja etre disponible localement pour que le backend fonctionne hors Docker\n'
printf '1. cd backend && npm run start:dev\n'
printf '2. cd frontend && npm run dev\n'
