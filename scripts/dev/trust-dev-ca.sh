#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
MKCERT_BIN="$(bash "${ROOT_DIR}/scripts/dev/ensure-mkcert.sh")"

if command -v certutil >/dev/null 2>&1; then
	TRUST_STORES=nss "$MKCERT_BIN" -install >/dev/null 2>&1
	printf '[OK] CA locale mkcert installee\n'
	exit 0
fi

case "$(uname -s)" in
	Darwin)
		"$MKCERT_BIN" -install >/dev/null 2>&1
		printf '[OK] CA locale mkcert installee\n'
		;;
	*)
		printf '[WARN] certutil absent: confiance navigateur non configuree automatiquement.\n' >&2
		printf 'Le certificat local sera quand meme genere pour le stack de dev.\n' >&2
		;;
esac
