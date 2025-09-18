#!/usr/bin/env bash
set -euo pipefail

echo "=== dev-entrypoint: starting dev container ==="
echo "User: $(whoami) PATH: $PATH"

cd /seqr

# Attempt to run migrations
if command -v pg_isready >/dev/null 2>&1; then
  echo "Waiting for Postgres..."
  for i in $(seq 1 10); do
    if pg_isready -d postgres -h "${POSTGRES_SERVICE_HOSTNAME:-localhost}" -U "${POSTGRES_USERNAME:-postgres}"; then
      echo "Postgres ready"
      break
    fi
    echo "Postgres not ready (attempt $i/10)"; sleep 3
  done
fi

# run migrations
echo "Running migrations (dev, non-fatal)..."
python -u manage.py migrate || echo "migrate failed (continuing for dev)"

# start frontend dev server in background if possible
if [ -f /seqr/ui/package.json ]; then
  # prefer start:dev or dev, fallback to start
  if grep -q "\"start:dev\"" /seqr/ui/package.json; then
    echo "Starting frontend: npm run start:dev (background)"
    (cd /seqr/ui && npm run start:dev) &
  elif grep -q "\"dev\"" /seqr/ui/package.json; then
    echo "Starting frontend: npm run dev (background)"
    (cd /seqr/ui && npm run dev) &
  elif grep -q "\"start\"" /seqr/ui/package.json; then
    echo "Starting frontend: npm run start (background)"
    (cd /seqr/ui && npm run start) &
  else
    echo "No recognized frontend start script; skipping frontend start"
  fi
else
  echo "No package.json found in /seqr/ui"
fi

# start backend using the same script as prod (start_server.sh), if present
if [ -x /usr/local/bin/start_server.sh ]; then
  echo "Starting backend via /usr/local/bin/start_server.sh"
  exec /usr/local/bin/start_server.sh
else
  # fallback to Django devserver
  echo "Starting Django devserver (fallback) on 0.0.0.0:8000"
  exec python -u manage.py runserver 0.0.0.0:8000
fi
