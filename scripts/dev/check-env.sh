#!/usr/bin/env bash

set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${1:-.env}"
VALIDATED_COUNT=0
CHECK_ENV_MODE="${CHECK_ENV_MODE:-verbose}"

section() {
  if [ "$CHECK_ENV_MODE" = "compact" ]; then
    return
  fi
  printf '\n== %s ==\n' "$1"
}

ok() {
  printf '[OK] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1"
}

ko() {
  printf '[KO] %s\n' "$1" >&2
}

required_vars="
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
POSTGRES_PORT
DATABASE_URL
BACKEND_PORT
FRONTEND_PORT
JWT_SECRET
FRONTEND_ORIGIN
GAME_QUESTION_DURATION_MS
BACKUP_INTERVAL_SECONDS
BACKUP_RETENTION_COUNT
"

get_env_value() {
  var_name="$1"
  grep -E "^${var_name}=.*$" "$ENV_FILE" | head -n 1 | cut -d '=' -f 2-
}

if [ ! -f "$ENV_FILE" ]; then
  ko "Fichier absent: ${ENV_FILE}"
  printf 'Cree-le avec: make env-init\n' >&2
  exit 1
fi

invalid=0
section "Validation ${ENV_FILE}"

for var_name in $required_vars; do
  if grep -Eq "^${var_name}=.+$" "$ENV_FILE"; then
    VALIDATED_COUNT=$((VALIDATED_COUNT + 1))
  else
    ko "${var_name} manquant ou vide"
    invalid=1
  fi
done

if [ "$invalid" -ne 0 ]; then
  exit 1
fi

POSTGRES_USER_VALUE="$(get_env_value POSTGRES_USER)"
POSTGRES_PASSWORD_VALUE="$(get_env_value POSTGRES_PASSWORD)"
POSTGRES_DB_VALUE="$(get_env_value POSTGRES_DB)"
DATABASE_URL_VALUE="$(get_env_value DATABASE_URL)"
FRONTEND_PORT_VALUE="$(get_env_value FRONTEND_PORT)"
APP_PROTOCOL_VALUE="$(get_env_value APP_PROTOCOL)"
FRONTEND_ORIGIN_VALUE="$(get_env_value FRONTEND_ORIGIN)"
GAME_QUESTION_DURATION_MS_VALUE="$(get_env_value GAME_QUESTION_DURATION_MS)"
BACKUP_INTERVAL_SECONDS_VALUE="$(get_env_value BACKUP_INTERVAL_SECONDS)"
BACKUP_RETENTION_COUNT_VALUE="$(get_env_value BACKUP_RETENTION_COUNT)"
JWT_SECRET_VALUE="$(get_env_value JWT_SECRET)"

check_not_placeholder() {
  var_name="$1"
  value="$2"

  case "$value" in
    your_user|your_password|your_db|change_me)
      ko "${var_name} utilise encore une valeur d'exemple non exploitable: ${value}"
      invalid=1
      ;;
  esac
}

check_not_placeholder "POSTGRES_USER" "$POSTGRES_USER_VALUE"
check_not_placeholder "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD_VALUE"
check_not_placeholder "POSTGRES_DB" "$POSTGRES_DB_VALUE"
check_not_placeholder "DATABASE_URL" "$DATABASE_URL_VALUE"
check_not_placeholder "JWT_SECRET" "$JWT_SECRET_VALUE"

case "$DATABASE_URL_VALUE" in
  postgresql://*)
    :
    ;;
  *)
    ko "DATABASE_URL doit commencer par postgresql://"
    invalid=1
    ;;
esac

if ! printf '%s' "$DATABASE_URL_VALUE" | grep -F -q "${POSTGRES_USER_VALUE}:"; then
  ko "DATABASE_URL ne reference pas POSTGRES_USER=${POSTGRES_USER_VALUE}"
  invalid=1
fi

if ! printf '%s' "$DATABASE_URL_VALUE" | grep -F -q ":${POSTGRES_PASSWORD_VALUE}@"; then
  ko "DATABASE_URL ne reference pas POSTGRES_PASSWORD courant"
  invalid=1
fi

if ! printf '%s' "$DATABASE_URL_VALUE" | grep -F -q "/${POSTGRES_DB_VALUE}"; then
  ko "DATABASE_URL ne reference pas POSTGRES_DB=${POSTGRES_DB_VALUE}"
  invalid=1
fi

if [ -z "$APP_PROTOCOL_VALUE" ]; then
  case "$FRONTEND_ORIGIN_VALUE" in
    https://*)
      APP_PROTOCOL_VALUE="https"
      ;;
    *)
      APP_PROTOCOL_VALUE="http"
      ;;
  esac
fi

case "$APP_PROTOCOL_VALUE" in
  http|https)
    :
    ;;
  *)
    ko 'APP_PROTOCOL doit etre "http" ou "https"'
    invalid=1
    ;;
esac

case "$FRONTEND_ORIGIN_VALUE" in
  "${APP_PROTOCOL_VALUE}://"*)
    :
    ;;
  *)
    ko "FRONTEND_ORIGIN doit commencer par ${APP_PROTOCOL_VALUE}://"
    invalid=1
    ;;
esac

if ! printf '%s' "$FRONTEND_ORIGIN_VALUE" | grep -F -q ":${FRONTEND_PORT_VALUE}"; then
  ko "FRONTEND_ORIGIN ne reference pas FRONTEND_PORT=${FRONTEND_PORT_VALUE}"
  invalid=1
fi

case "$GAME_QUESTION_DURATION_MS_VALUE" in
  ''|*[!0-9]*)
    ko "GAME_QUESTION_DURATION_MS doit etre un entier positif en millisecondes"
    invalid=1
    ;;
  0)
    ko "GAME_QUESTION_DURATION_MS doit etre strictement positif"
    invalid=1
    ;;
esac

case "$BACKUP_INTERVAL_SECONDS_VALUE" in
  ''|*[!0-9]*)
    ko "BACKUP_INTERVAL_SECONDS doit etre un entier positif en secondes"
    invalid=1
    ;;
  0)
    ko "BACKUP_INTERVAL_SECONDS doit etre strictement positif"
    invalid=1
    ;;
esac

case "$BACKUP_RETENTION_COUNT_VALUE" in
  ''|*[!0-9]*)
    ko "BACKUP_RETENTION_COUNT doit etre un entier positif"
    invalid=1
    ;;
  0)
    ko "BACKUP_RETENTION_COUNT doit etre strictement positif"
    invalid=1
    ;;
esac

if [ "$invalid" -ne 0 ]; then
  exit 1
fi

section "Resume"
if [ "$CHECK_ENV_MODE" = "compact" ]; then
  printf '[OK] %s | %s | frontend=%s | question=%sms | backups=%ss/%s\n' \
    "$ENV_FILE" \
    "$APP_PROTOCOL_VALUE" \
    "$FRONTEND_ORIGIN_VALUE" \
    "$GAME_QUESTION_DURATION_MS_VALUE" \
    "$BACKUP_INTERVAL_SECONDS_VALUE" \
    "$BACKUP_RETENTION_COUNT_VALUE"
else
  ok "Configuration ${ENV_FILE} valide (${VALIDATED_COUNT} variables requises)"
  printf 'Mode      : %s\n' "$APP_PROTOCOL_VALUE"
  printf 'Frontend  : %s\n' "$FRONTEND_ORIGIN_VALUE"
  printf 'Question  : %sms\n' "$GAME_QUESTION_DURATION_MS_VALUE"
  printf 'Backups   : every %ss, retention %s\n' "$BACKUP_INTERVAL_SECONDS_VALUE" "$BACKUP_RETENTION_COUNT_VALUE"

  if [ "$APP_PROTOCOL_VALUE" = "https" ]; then
    warn "Mode HTTPS local: certificat de dev requis"
  else
    warn "Mode HTTP/LAN: adapte aux tests multi-postes"
  fi
fi
