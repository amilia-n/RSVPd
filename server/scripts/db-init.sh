#!/usr/bin/env bash
set -euo pipefail

# cd to repo root
cd "$(dirname "$0")/.."

# Load .env if present
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Safety: block init in prod unless explicitly allowed
if [[ "${NODE_ENV:-development}" == "production" && "${ALLOW_DB_INIT_IN_PROD:-false}" != "true" ]]; then
  echo "Refusing to run db-init in production. Set ALLOW_DB_INIT_IN_PROD=true to override."
  exit 1
fi

# Ensure psql is available
if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install the PostgreSQL client."
  exit 1
fi

# Extract database name from connection string or env vars
if [[ -n "${DATABASE_URL:-}" ]]; then
  DB_NAME_TO_CREATE=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
  # Connect to default postgres database to create our database
  PSQL_CREATE_DB_CONN=$(echo "$DATABASE_URL" | sed "s|/$DB_NAME_TO_CREATE|/postgres|")
  PSQL_CONN=("$DATABASE_URL")
else
  DB_NAME_TO_CREATE="${DB_NAME:-rsvpd}"
  export PGPASSWORD="${DB_PASSWORD:-}"
  PSQL_CREATE_DB_CONN=(-h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "postgres")
  PSQL_CONN=(-h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME_TO_CREATE}")
fi

# Create database if it doesn't exist
if [[ -n "${DATABASE_URL:-}" ]]; then
  if ! psql "$PSQL_CREATE_DB_CONN" -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME_TO_CREATE}'" | grep -q 1; then
    echo "Creating database '${DB_NAME_TO_CREATE}' ..."
    psql "$PSQL_CREATE_DB_CONN" -c "CREATE DATABASE ${DB_NAME_TO_CREATE};" || {
      echo "Error: Failed to create database '${DB_NAME_TO_CREATE}'"
      exit 1
    }
    echo "Database '${DB_NAME_TO_CREATE}' created."
  else
    echo "Database '${DB_NAME_TO_CREATE}' already exists."
  fi
else
  if ! psql "${PSQL_CREATE_DB_CONN[@]}" -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME_TO_CREATE}'" | grep -q 1; then
    echo "Creating database '${DB_NAME_TO_CREATE}' ..."
    psql "${PSQL_CREATE_DB_CONN[@]}" -c "CREATE DATABASE ${DB_NAME_TO_CREATE};" || {
      echo "Error: Failed to create database '${DB_NAME_TO_CREATE}'"
      exit 1
    }
    echo "Database '${DB_NAME_TO_CREATE}' created."
  else
    echo "Database '${DB_NAME_TO_CREATE}' already exists."
  fi
fi

echo "Applying schema: src/db/db.sql …"
if [[ -n "${DATABASE_URL:-}" ]]; then
  psql -v ON_ERROR_STOP=1 "$PSQL_CONN" -f "src/db/db.sql"
else
  psql -v ON_ERROR_STOP=1 "${PSQL_CONN[@]}" -f "src/db/db.sql"
fi

if [[ -f "src/db/seed.sql" ]]; then
  echo "Seeding base data via SQL: src/db/seed.sql …"
  if [[ -n "${DATABASE_URL:-}" ]]; then
    psql -v ON_ERROR_STOP=1 "$PSQL_CONN" -f "src/db/seed.sql"
  else
    psql -v ON_ERROR_STOP=1 "${PSQL_CONN[@]}" -f "src/db/seed.sql"
  fi
fi

if [[ -f "src/db/seed.js" ]] && command -v node >/dev/null 2>&1; then
  echo "Running logic seeds: src/db/seed.js …"
  node "src/db/seed.js"
fi

echo "db-init complete."