#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Load .env
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Safety: block reset in prod unless explicitly allowed
if [[ "${NODE_ENV:-development}" == "production" && "${ALLOW_DB_RESET_IN_PROD:-false}" != "true" ]]; then
  echo "Refusing to reset database in production. Set ALLOW_DB_RESET_IN_PROD=true to override."
  exit 1
fi

# Require confirmation (set CONFIRM_RESET=yes or FORCE=1)
if [[ "${CONFIRM_RESET:-no}" != "yes" && "${FORCE:-0}" != "1" ]]; then
  echo "Safety check: set CONFIRM_RESET=yes or FORCE=1 to proceed with a destructive reset."
  exit 1
fi

# Ensure psql
if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install the PostgreSQL client."
  exit 1
fi

# Connection args
if [[ -n "${DATABASE_URL:-}" ]]; then
  PSQL_CONN=("$DATABASE_URL")
else
  export PGPASSWORD="${DB_PASSWORD:-}"
  PSQL_CONN=(-h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-postgres}")
fi

echo "Dropping and recreating schema 'public' …"
psql -v ON_ERROR_STOP=1 "${PSQL_CONN[@]}" <<'SQL'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'public') THEN
    EXECUTE 'DROP SCHEMA public CASCADE';
  END IF;
  EXECUTE 'CREATE SCHEMA public';
  EXECUTE 'GRANT ALL ON SCHEMA public TO PUBLIC';
END$$;
SQL

echo "Re-initializing (schema + seeds) …"
bash "scripts/db-init.sh"

echo "db-reset complete."
