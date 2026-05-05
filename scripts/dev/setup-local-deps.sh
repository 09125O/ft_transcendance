#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

command -v node >/dev/null 2>&1 || {
  printf "[KO] node est requis pour l'installation locale.\n" >&2
  exit 1
}

command -v npm >/dev/null 2>&1 || {
  printf "[KO] npm est requis pour l'installation locale.\n" >&2
  exit 1
}

printf "[..] Installation des dependances backend\n"
(cd backend && npm run deps:sync && npm run prisma:generate)

printf "[..] Installation des dependances frontend\n"
(cd frontend && npm run deps:sync)

printf "[OK] Dependances locales installees\n"
printf "Optionnel : make setup-local-browsers\n"
