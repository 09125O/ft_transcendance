#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
CERT_DIR="${ROOT_DIR}/.local/certs"
CERT_FILE="${CERT_DIR}/dev-localhost.crt"
KEY_FILE="${CERT_DIR}/dev-localhost.key"
CA_FILE="${CERT_DIR}/mkcert-rootCA.pem"
LOCAL_IPV4=""
EXTRA_TLS_HOSTS="${EXTRA_TLS_HOSTS:-}"

if command -v ifconfig >/dev/null 2>&1; then
	LOCAL_IPV4="$(ifconfig en0 2>/dev/null | awk '/inet / { print $2; exit }')"
fi

MKCERT_BIN="$(bash "${ROOT_DIR}/scripts/dev/ensure-mkcert.sh")"
bash "${ROOT_DIR}/scripts/dev/trust-dev-ca.sh"

CAROOT="$("$MKCERT_BIN" -CAROOT)"
ROOT_CA_SOURCE="${CAROOT}/rootCA.pem"

[ -s "$ROOT_CA_SOURCE" ] || {
	printf '[KO] CA mkcert introuvable dans %s\n' "$CAROOT" >&2
	printf 'Lance d''abord: mkcert -install\n' >&2
	exit 1
}

mkdir -p "$CERT_DIR"
cp "$ROOT_CA_SOURCE" "$CA_FILE"

set -- localhost 127.0.0.1 ::1 frontend backend quiz_frontend quiz_backend

if [ -n "$LOCAL_IPV4" ]; then
	set -- "$@" "$LOCAL_IPV4"
fi

if [ -n "$EXTRA_TLS_HOSTS" ]; then
	for host in $EXTRA_TLS_HOSTS; do
		set -- "$@" "$host"
	done
fi

"$MKCERT_BIN" \
	-cert-file "$CERT_FILE" \
	-key-file "$KEY_FILE" \
	"$@" \
	>/dev/null 2>&1

chmod 600 "$KEY_FILE"
printf '[OK] Certificat TLS de dev genere: %s\n' "$CERT_FILE"
