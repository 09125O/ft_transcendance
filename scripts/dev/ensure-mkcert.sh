#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
TOOL_DIR="${ROOT_DIR}/.local/bin"
MKCERT_BIN="${TOOL_DIR}/mkcert"
GO_DIR="${ROOT_DIR}/.local/go"
GOMOD_DIR="${ROOT_DIR}/.local/gomod"

if [ -n "${MKCERT:-}" ] && [ -x "$MKCERT" ]; then
	printf '%s\n' "$MKCERT"
	exit 0
fi

if command -v mkcert >/dev/null 2>&1; then
	command -v mkcert
	exit 0
fi

if [ -x "$MKCERT_BIN" ]; then
	printf '%s\n' "$MKCERT_BIN"
	exit 0
fi

command -v go >/dev/null 2>&1 || {
	printf '[KO] mkcert est absent et Go est requis pour l installer sans sudo.\n' >&2
	printf 'Installe mkcert sur le poste ou ajoute un binaire executable dans %s\n' "$MKCERT_BIN" >&2
	exit 1
}

mkdir -p "$TOOL_DIR" "$GO_DIR" "$GOMOD_DIR"

printf '[..] mkcert absent: installation locale dans %s\n' "$MKCERT_BIN" >&2
GOBIN="$TOOL_DIR" \
GOPATH="$GO_DIR" \
GOMODCACHE="$GOMOD_DIR" \
	go install filippo.io/mkcert@v1.4.4

[ -x "$MKCERT_BIN" ] || {
	printf '[KO] Installation locale de mkcert incomplete: %s introuvable\n' "$MKCERT_BIN" >&2
	exit 1
}

printf '%s\n' "$MKCERT_BIN"
