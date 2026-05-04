#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
MKCERT_BIN="$(bash "${ROOT_DIR}/scripts/ensure-mkcert.sh")"

if command -v certutil >/dev/null 2>&1; then
	TRUST_STORES=nss "$MKCERT_BIN" -install
	printf '[OK] CA locale mkcert installee dans le trust store navigateur\n'
	exit 0
fi

printf '[KO] certutil est requis pour faire confiance a mkcert sans sudo sur Fedora.\n' >&2
printf 'Installe nss-tools ou utilise un poste 42 Fedora qui le fournit deja.\n' >&2
exit 1
