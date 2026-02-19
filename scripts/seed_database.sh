#!/bin/bash
# ═══════════════════════════════════════════
# Proxiam — Seed Database
# Parse brainstorm .md files → PostgreSQL
# ═══════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "═══════════════════════════════════════════"
echo "  Proxiam — Database Seed"
echo "═══════════════════════════════════════════"
echo ""

# Check if database is running
if ! docker compose -f "$PROJECT_DIR/docker-compose.yml" ps database | grep -q "running"; then
    echo "Starting database..."
    docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d database
    sleep 5
fi

cd "$PROJECT_DIR/backend"

# Run parser (dry run first)
echo "Step 1: Parsing brainstorm files..."
python -m app.seed.import_data --dry

echo ""
read -p "Import to database? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Step 2: Importing to PostgreSQL..."
    python -m app.seed.import_data
else
    echo "Skipped database import."
fi

echo ""
echo "Done!"
