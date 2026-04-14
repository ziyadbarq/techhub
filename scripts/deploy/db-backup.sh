#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

ACTION=""
ENV_FILE="${ROOT_DIR}/.env.local"
BACKUP_FILE=""
BACKUP_DIR="${ROOT_DIR}/local/backups/db-script"
FORCE=0
RESTORE_VERBOSE=0
DROP_SCHEMA=0
AUTO_SELECT_LATEST=1

usage() {
  cat <<'EOF'
Usage:
  ./scripts/db-backup.sh backup  [--file path] [--env-file path] [--force]
  ./scripts/db-backup.sh restore [--file path] [--env-file path] [--force] [--verbose] [--drop-schema] [--no-auto-latest]

Options:
  --file, -f       Override backup file path (default: timestamped under local/backups/db-script)
  --env-file, -e   Env file to load DATABASE_URL from (default: .env.local)
  --force, -y      Skip confirmation prompts and allow overwrite
  --verbose, -v    Show full psql output during restore (default is quiet)
  --drop-schema    Drop and recreate the public schema before restore (use on drifted DBs)
  --no-auto-latest Disable auto-selection of latest backup when --file is not provided
  --help, -h       Show this message

Notes:
  - Uses PostgreSQL client tools (pg_dump, psql)
  - Backups are plain SQL with DROP statements (--clean --if-exists)
  - Restore will drop and recreate objects in the target database
EOF
}

abort() {
  echo "Error: $1" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    abort "Required command '$1' not found. Install PostgreSQL client tools (pg_dump/psql)."
  fi
}

ensure_backup_dir() {
  mkdir -p "$BACKUP_DIR"
  chmod 700 "$BACKUP_DIR"
}

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    if [[ ! -r "$ENV_FILE" ]]; then
      abort "Env file found but not readable: $ENV_FILE"
    fi
    set -o allexport
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +o allexport
  else
    echo "Warning: Env file not found at $ENV_FILE; relying on existing environment variables."
  fi

  if [[ -z "${DATABASE_URL:-}" ]]; then
    abort "DATABASE_URL is not set. Add it to $ENV_FILE or export it before running."
  fi
}

verify_database_connection() {
  if ! psql --set ON_ERROR_STOP=1 --dbname="$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    abort "Unable to connect using DATABASE_URL. Verify credentials and network access."
  fi
}

file_size_bytes() {
  if stat -f%z "$1" >/dev/null 2>&1; then
    stat -f%z "$1"
  elif stat -c%s "$1" >/dev/null 2>&1; then
    stat -c%s "$1"
  else
    echo "unknown"
  fi
}

file_size_human() {
  local path="$1"
  du -h "$path" 2>/dev/null | awk '{print $1}' || echo "unknown"
}

file_checksum() {
  local path="$1"
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$path" | awk '{print $1}'
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" | awk '{print $1}'
  else
    echo "unavailable (install shasum/sha256sum for checksum)"
  fi
}

verify_backup_file() {
  if [[ ! -f "$BACKUP_FILE" ]]; then
    abort "Backup file was not created: $BACKUP_FILE"
  fi

  if [[ ! -s "$BACKUP_FILE" ]]; then
    abort "Backup file is empty: $BACKUP_FILE"
  fi

  if ! grep -Eq "^(CREATE TABLE|COPY [^ ]+ FROM stdin;)" "$BACKUP_FILE"; then
    echo "Warning: Backup file does not contain obvious CREATE/COPY statements. Verify manually: $BACKUP_FILE"
  fi

  local size_bytes size_h size_checksum
  size_bytes=$(file_size_bytes "$BACKUP_FILE")
  size_h=$(file_size_human "$BACKUP_FILE")
  size_checksum=$(file_checksum "$BACKUP_FILE")

  echo "Backup verification:"
  echo "  - Size: ${size_bytes} bytes (${size_h})"
  echo "  - SHA-256: ${size_checksum}"
  echo "  - Path: $BACKUP_FILE"
}

confirm_restore() {
  if [[ $FORCE -eq 1 ]]; then
    return 0
  fi

  read -r -p "Restore will drop and replace data in the target database. Continue? (y/N) " reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
  fi
}

prompt_yes_no() {
  local prompt_msg="$1"
  local default_answer="$2" # y or n
  local reply

  if [[ $FORCE -eq 1 ]]; then
    echo "Auto-selecting '${default_answer}' for: ${prompt_msg}"
    [[ "$default_answer" == "y" ]] && return 0 || return 1
  fi

  local hint="[y/N]"
  [[ "$default_answer" == "y" ]] && hint="[Y/n]"

  read -r -p "${prompt_msg} ${hint} " reply
  if [[ -z "$reply" ]]; then
    reply="$default_answer"
  fi

  [[ "$reply" =~ ^[Yy]$ ]]
}

resolve_backup_file() {
  if [[ -n "$BACKUP_FILE" ]]; then
    if [[ "$BACKUP_FILE" != /* ]]; then
      BACKUP_FILE="${ROOT_DIR}/${BACKUP_FILE}"
    fi
    [[ -f "$BACKUP_FILE" ]] || abort "Backup file not found: $BACKUP_FILE"
    return
  fi

  ensure_backup_dir

  if [[ $AUTO_SELECT_LATEST -eq 1 ]]; then
    local latest
    latest=$(ls -1t "${BACKUP_DIR}"/*.sql 2>/dev/null | head -n 1 || true)
    if [[ -n "$latest" && -f "$latest" ]]; then
      if prompt_yes_no "Use latest backup: $(basename "$latest")?" "y"; then
        BACKUP_FILE="$latest"
        return
      fi
    fi
  fi

  read -r -p "Enter path to backup file: " BACKUP_FILE
  [[ -z "$BACKUP_FILE" ]] && abort "No backup file provided."
  if [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_FILE="${ROOT_DIR}/${BACKUP_FILE}"
  fi
  [[ -f "$BACKUP_FILE" ]] || abort "Backup file not found: $BACKUP_FILE"
}

parse_args() {
  if [[ $# -eq 0 ]]; then
    usage
    exit 1
  fi

  while [[ $# -gt 0 ]]; do
    case "$1" in
      backup|restore)
        ACTION="$1"
        ;;
      --file|-f)
        BACKUP_FILE="${2-}"
        [[ -z "$BACKUP_FILE" ]] && abort "--file requires a path"
        shift
        ;;
      --env-file|-e)
        ENV_FILE="${2-}"
        [[ -z "$ENV_FILE" ]] && abort "--env-file requires a path"
        # Resolve relative paths against repo root
        [[ "$ENV_FILE" != /* ]] && ENV_FILE="${ROOT_DIR}/${ENV_FILE}"
        shift
        ;;
      --force|-y)
        FORCE=1
        ;;
      --verbose|-v)
        RESTORE_VERBOSE=1
        ;;
      --drop-schema)
        DROP_SCHEMA=1
        ;;
      --no-auto-latest)
        AUTO_SELECT_LATEST=0
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        abort "Unknown argument: $1"
        ;;
    esac
    shift
  done

  if [[ -z "$ACTION" ]]; then
    usage
    exit 1
  fi
}

perform_backup() {
  require_command pg_dump
  require_command psql
  ensure_backup_dir
  verify_database_connection

  if [[ -z "$BACKUP_FILE" ]]; then
    BACKUP_FILE="${BACKUP_DIR}/techhub-$(date +%Y%m%d_%H%M%S).sql"
  elif [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_FILE="${ROOT_DIR}/${BACKUP_FILE}"
  fi

  if [[ -f "$BACKUP_FILE" && $FORCE -ne 1 ]]; then
    if ! prompt_yes_no "Backup file already exists: $(basename "$BACKUP_FILE"). Overwrite?" "n"; then
      echo "Backup cancelled."
      exit 0
    fi
  fi

  echo "Creating backup at $BACKUP_FILE"
  pg_dump --clean --if-exists --no-owner --no-privileges --format=p --file="$BACKUP_FILE" "$DATABASE_URL"
  verify_backup_file
  echo "Backup complete."
}

perform_restore() {
  require_command psql
  verify_database_connection

  resolve_backup_file

  confirm_restore

  if [[ $DROP_SCHEMA -eq 0 ]]; then
    if prompt_yes_no "Drop and recreate schema 'public' before restore? (fixes drifted constraints on target DB)" "n"; then
      DROP_SCHEMA=1
    fi
  fi

  if [[ $DROP_SCHEMA -eq 1 ]]; then
    echo "Dropping and recreating schema 'public' before restore (destructive)..."
    psql --set ON_ERROR_STOP=1 --dbname="$DATABASE_URL" --command "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO CURRENT_USER;" --quiet
  fi

  local PSQL_ARGS=(--set ON_ERROR_STOP=1 --dbname="$DATABASE_URL" --file="$BACKUP_FILE" --single-transaction --set client_min_messages=warning)
  if [[ $RESTORE_VERBOSE -eq 0 ]]; then
    PSQL_ARGS+=(--quiet)
    echo "Restoring database from $BACKUP_FILE (quiet mode; errors will still display)"
  else
    echo "Restoring database from $BACKUP_FILE (verbose mode)"
  fi

  psql "${PSQL_ARGS[@]}"
  echo "Restore complete."
}

parse_args "$@"
cd "$ROOT_DIR"
load_env

case "$ACTION" in
  backup)
    perform_backup
    ;;
  restore)
    perform_restore
    ;;
  *)
    abort "Unknown action: $ACTION"
    ;;
esac
