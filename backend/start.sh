#!/bin/sh
set -e

# If alembic_version table doesn't exist yet (tables were created via create_all),
# stamp the DB at the revision just before our multi-platform migration
# so that only new migrations are applied.
CURRENT=$(python -m alembic current 2>/dev/null || true)
if [ -z "$CURRENT" ]; then
    echo "No alembic version found. Stamping existing schema..."
    python -m alembic stamp 7a51c5df4f29
fi

python -m alembic upgrade head

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*'
