#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
SHELLCHECK_IMAGE="${SHELLCHECK_IMAGE:-koalaman/shellcheck-alpine:stable}"

set -- "$ROOT_DIR"/scripts/*.sh

if [ ! -e "$1" ]; then
  exit 0
fi

if command -v shellcheck >/dev/null 2>&1; then
  shellcheck "$@"
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "shellcheck is required to lint shell scripts (install shellcheck or Docker)" >&2
  exit 1
fi

docker run --rm \
  -v "$ROOT_DIR:$ROOT_DIR" \
  -w "$ROOT_DIR" \
  "$SHELLCHECK_IMAGE" \
  shellcheck "$@"
