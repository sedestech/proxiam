#!/bin/bash
# ═══════════════════════════════════════════
# Proxiam v3.0.0 — Deploy to VPS
# ═══════════════════════════════════════════

set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
HEALTH_URL="http://localhost:8000/health"
MAX_WAIT=60

echo "═══════════════════════════════════════════"
echo "  Proxiam — VPS Deployment"
echo "═══════════════════════════════════════════"
echo ""

# ── Step 1: Check .env ──
if [ ! -f .env ]; then
    echo "[ERROR] .env file not found. Create it from .env.example"
    exit 1
fi
echo "[OK] .env file found"

# ── Step 2: Pull latest code ──
echo ""
echo "[1/5] Pulling latest code..."
git pull origin main
echo "[OK] Code updated"

# ── Step 3: Build Docker images ──
echo ""
echo "[2/5] Building Docker images..."
docker compose -f "$COMPOSE_FILE" build --no-cache
echo "[OK] Images built"

# ── Step 4: Run database migrations ──
echo ""
echo "[3/5] Running database migrations..."
docker compose -f "$COMPOSE_FILE" up -d database redis
echo "Waiting for database to be ready..."
sleep 5
docker compose -f "$COMPOSE_FILE" run --rm backend alembic upgrade head
echo "[OK] Migrations applied"

# ── Step 5: Restart all services ──
echo ""
echo "[4/5] Restarting services..."
docker compose -f "$COMPOSE_FILE" down
docker compose -f "$COMPOSE_FILE" up -d
echo "[OK] Services started"

# ── Step 6: Wait for health check ──
echo ""
echo "[5/5] Waiting for health check..."
elapsed=0
while [ $elapsed -lt $MAX_WAIT ]; do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        echo "[OK] Backend is healthy!"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo "  Waiting... (${elapsed}s / ${MAX_WAIT}s)"
done

if [ $elapsed -ge $MAX_WAIT ]; then
    echo "[WARNING] Health check timed out after ${MAX_WAIT}s"
    echo "Check logs: docker compose -f $COMPOSE_FILE logs backend"
    exit 1
fi

# ── Status ──
echo ""
echo "═══════════════════════════════════════════"
echo "  Deployment Complete"
echo "═══════════════════════════════════════════"
echo ""
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo "Health:  $HEALTH_URL"
echo "API:     http://localhost:8000/api/docs"
echo "App:     https://\${DOMAIN:-localhost}"
