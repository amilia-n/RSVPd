#!/usr/bin/env bash
set -euo pipefail

# cd to repo root
cd "$(dirname "$0")/.."

echo "=================================="
echo "RSVP Test Suite"
echo "=================================="

# Cleanup function to ensure containers are removed
cleanup() {
  echo ""
  echo "Cleaning up test containers..."
  docker compose -f docker-compose.test.yml down -v 2>/dev/null || true
  docker system prune -f --filter label=com.docker.compose.project=rsvp-test 2>/dev/null || true
  echo "Cleanup complete."
}

# Always run cleanup on exit
trap cleanup EXIT

echo ""
echo "Step 1: Building test containers..."
docker compose -f docker-compose.test.yml build

echo ""
echo "Step 2: Starting test database..."
docker compose -f docker-compose.test.yml up -d test-db

echo ""
echo "Step 3: Waiting for database to be ready..."
for i in {1..30}; do
  if docker compose -f docker-compose.test.yml exec -T test-db pg_isready -U postgres >/dev/null 2>&1; then
    echo "Database is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Error: Database failed to start within 60 seconds"
    exit 1
  fi
  echo "Waiting for database... ($i/30)"
  sleep 2
done

echo ""
echo "Step 4: Initializing database schema..."
docker compose -f docker-compose.test.yml exec -T test-db psql -U postgres -d rsvp_test -f /dev/stdin < src/db/db.sql

echo ""
echo "Step 5: Seeding test database..."
# Run seed.js if it exists
if [ -f "src/db/seed.js" ]; then
  docker compose -f docker-compose.test.yml run --rm test-runner node src/db/seed.js
else
  echo "No seed.js found, skipping seed step"
fi

echo ""
echo "Step 6: Running tests..."
echo "=================================="
docker compose -f docker-compose.test.yml run --rm test-runner npm run test:run

TEST_EXIT_CODE=$?

echo ""
echo "=================================="
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Tests failed with exit code: $TEST_EXIT_CODE"
fi
echo "=================================="

exit $TEST_EXIT_CODE
