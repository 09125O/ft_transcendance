#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
MKCERT_BIN="$(bash "${ROOT_DIR}/scripts/ensure-mkcert.sh")"

if command -v certutil >/dev/null 2>&1; then
	TRUST_STORES=nss "$MKCERT_BIN" -install
	printf '[OK] CA locale mkcert installee dans le trust store navigateur\n'
	exit 0
fi

case "$(uname -s)" in
	Darwin)
		"$MKCERT_BIN" -install
		printf '[OK] CA locale mkcert installee dans le trust store macOS\n'
		;;
	*)
		printf '[WARN] certutil absent: confiance navigateur non configuree automatiquement.\n' >&2
		printf 'Le certificat local sera quand meme genere pour le stack de dev.\n' >&2
		;;
esac
