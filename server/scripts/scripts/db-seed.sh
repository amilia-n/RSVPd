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

# Safety: block seeding in prod unless explicitly allowed
if [[ "${NODE_ENV:-development}" == "production" && "${ALLOW_DB_SEED_IN_PROD:-false}" != "true" ]]; then
  echo "Refusing to run db-seed in production. Set ALLOW_DB_SEED_IN_PROD=true to override."
  exit 1
fi

# Ensure psql
if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install the PostgreSQL client or run: npm run db:seed:node"
  exit 1
fi

# Connection args
if [[ -n "${DATABASE_URL:-}" ]]; then
  PSQL_CONN=("$DATABASE_URL")
else
  export PGPASSWORD="${DB_PASSWORD:-}"
  PSQL_CONN=(-h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-postgres}")
fi

if [[ -f "src/db/seed.sql" ]]; then
  echo "Applying SQL seeds: src/db/seed.sql …"
  psql -v ON_ERROR_STOP=1 "${PSQL_CONN[@]}" -f "src/db/seed.sql"
else
  echo "No src/db/seed.sql found; skipping SQL seeds."
fi

if [[ -f "src/db/seed.js" ]] && command -v node >/dev/null 2>&1; then
  echo "Running JS seeds: src/db/seed.js …"
  node "src/db/seed.js"
else
  echo "No src/db/seed.js or Node not installed; skipping JS seeds."
fi

echo "db-seed complete."
