#!/bin/bash
# ═══════════════════════════════════════════
# Proxiam v3.0.0 — Deploy to VPS
# ═══════════════════════════════════════════

set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
HEALTH_URL="http://localhost:8000/health"
MAX_WAIT=120
SKIP_SEED=false
SKIP_BUILD=false
QUICK=false

# ── Parse arguments ──
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --skip-seed    Skip seed data import (if already seeded)"
    echo "  --skip-build   Skip Docker image build (use existing images)"
    echo "  --quick        Skip seed + use cached build"
    echo "  --help         Show this help"
    exit 0
}

for arg in "$@"; do
    case $arg in
        --skip-seed)  SKIP_SEED=true ;;
        --skip-build) SKIP_BUILD=true ;;
        --quick)      SKIP_SEED=true; SKIP_BUILD=true ;;
        --help)       usage ;;
        *)            echo "[ERROR] Unknown option: $arg"; usage ;;
    esac
done

echo "═══════════════════════════════════════════"
echo "  Proxiam v3.0.0 — VPS Deployment"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════"
echo ""
echo "  Options: seed=$([[ $SKIP_SEED == true ]] && echo 'SKIP' || echo 'YES') build=$([[ $SKIP_BUILD == true ]] && echo 'SKIP' || echo 'YES')"
echo ""

# ── Step 1: Check .env ──
if [ ! -f .env ]; then
    echo "[ERROR] .env file not found. Create it from .env.production.example"
    exit 1
fi

# Vérification sécurité : pas de mot de passe par défaut
if grep -q "change_me_in_production" .env 2>/dev/null; then
    echo "[ERROR] Default passwords detected in .env — change ALL 'change_me_in_production' values"
    exit 1
fi
echo "[OK] .env file found and validated"

# ── Step 2: Pull latest code ──
echo ""
echo "[1/7] Pulling latest code..."
git pull origin main
echo "[OK] Code updated"

# ── Step 3: Build Docker images ──
echo ""
if [[ $SKIP_BUILD == true ]]; then
    echo "[2/7] Skipping Docker build (--skip-build)"
else
    echo "[2/7] Building Docker images..."
    docker compose -f "$COMPOSE_FILE" build
    echo "[OK] Images built"
fi

# ── Step 4: Start infra services ──
echo ""
echo "[3/7] Starting infrastructure services..."
docker compose -f "$COMPOSE_FILE" up -d database redis meilisearch minio
echo "Waiting for services to be healthy..."
sleep 10

# Vérifier que la BDD est prête
retries=0
while ! docker compose -f "$COMPOSE_FILE" exec -T database pg_isready -U "${POSTGRES_USER:-proxiam}" > /dev/null 2>&1; do
    retries=$((retries + 1))
    if [ $retries -ge 15 ]; then
        echo "[ERROR] Database not ready after 30s"
        exit 1
    fi
    sleep 2
done
echo "[OK] Infrastructure services healthy"

# ── Step 5: Run database migrations ──
echo ""
echo "[4/7] Running database migrations..."
docker compose -f "$COMPOSE_FILE" run --rm backend alembic upgrade head
echo "[OK] Migrations applied"

# ── Step 6: Seed data ──
echo ""
if [[ $SKIP_SEED == true ]]; then
    echo "[5/7] Skipping seed (--skip-seed)"
else
    echo "[5/7] Seeding data..."

    echo "  → Importing matrice 6D (5176 items)..."
    docker compose -f "$COMPOSE_FILE" run --rm backend python -m app.seed.import_data

    echo "  → Importing postes sources (4847)..."
    docker compose -f "$COMPOSE_FILE" run --rm backend python -m app.seed.import_postes

    # Import Natura2000 si le fichier existe
    if [ -f backend/data/real/natura2000_sic.geojson ]; then
        echo "  → Importing Natura2000 SIC..."
        docker compose -f "$COMPOSE_FILE" run --rm backend python -m app.commands.import_natura2000 data/real/natura2000_sic.geojson
    fi

    if [ -f backend/data/real/natura2000_zps.geojson ]; then
        echo "  → Importing Natura2000 ZPS..."
        docker compose -f "$COMPOSE_FILE" run --rm backend python -m app.commands.import_natura2000 data/real/natura2000_zps.geojson
    fi

    # Import ODRÉ si le fichier existe
    if [ -f backend/data/real/odre_registre.csv ]; then
        echo "  → Importing ODRÉ registre..."
        docker compose -f "$COMPOSE_FILE" run --rm backend python -m app.commands.import_odre data/real/odre_registre.csv
    fi

    echo "  → Indexing Meilisearch..."
    docker compose -f "$COMPOSE_FILE" run --rm backend python -m app.seed.index_search

    echo "[OK] Data seeded and indexed"
fi

# ── Step 7: Start all services ──
echo ""
echo "[6/7] Starting all services..."
docker compose -f "$COMPOSE_FILE" up -d
echo "[OK] All services started"

# ── Step 8: Wait for health check ──
echo ""
echo "[7/7] Waiting for health check..."
elapsed=0
while [ $elapsed -lt $MAX_WAIT ]; do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        echo "[OK] Backend is healthy!"
        break
    fi
    sleep 3
    elapsed=$((elapsed + 3))
    echo "  Waiting... (${elapsed}s / ${MAX_WAIT}s)"
done

if [ $elapsed -ge $MAX_WAIT ]; then
    echo "[ERROR] Health check timed out after ${MAX_WAIT}s"
    echo ""
    echo "Diagnostic:"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "Backend logs (last 30 lines):"
    docker compose -f "$COMPOSE_FILE" logs --tail=30 backend
    exit 1
fi

# ── Final Status ──
echo ""
echo "═══════════════════════════════════════════"
echo "  Deployment Complete — $(date '+%H:%M:%S')"
echo "═══════════════════════════════════════════"
echo ""
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo "Health:  $HEALTH_URL"
echo "API:     http://localhost:8000/api/docs"
echo "App:     https://${DOMAIN:-localhost}"
echo ""
echo "Quick redeploy: $0 --quick"
echo "Rollback:       docker compose -f $COMPOSE_FILE down -v && rm -rf ~/app-proxiam/"
