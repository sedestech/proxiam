#!/bin/bash
# ═══════════════════════════════════════════
# Proxiam — Téléchargement données réelles
# Sources : data.gouv.fr, ODRÉ (OpenDataSoft)
# ═══════════════════════════════════════════

set -euo pipefail

DATA_DIR="$(cd "$(dirname "$0")/../backend/data/real" && pwd)"
mkdir -p "$DATA_DIR"

echo "═══════════════════════════════════════════"
echo "  Téléchargement données réelles"
echo "  Destination : $DATA_DIR"
echo "═══════════════════════════════════════════"
echo ""

# ─── 1. Natura2000 SIC (Sites d'Importance Communautaire) ───
echo "[1/3] Natura2000 SIC (data.gouv.fr)..."
SIC_URL="https://data.geopf.fr/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=PROTECTEDAREAS.SIC&outputFormat=application/json&count=5000"
if [ ! -f "$DATA_DIR/natura2000_sic.geojson" ]; then
    curl -L --progress-bar -o "$DATA_DIR/natura2000_sic.geojson" "$SIC_URL"
    echo "[OK] Natura2000 SIC téléchargé ($(du -h "$DATA_DIR/natura2000_sic.geojson" | cut -f1))"
else
    echo "[SKIP] Natura2000 SIC déjà présent"
fi

# ─── 2. Natura2000 ZPS (Zones de Protection Spéciale) ───
echo ""
echo "[2/3] Natura2000 ZPS (data.geopf.fr)..."
ZPS_URL="https://data.geopf.fr/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=PROTECTEDAREAS.ZPS&outputFormat=application/json&count=5000"
if [ ! -f "$DATA_DIR/natura2000_zps.geojson" ]; then
    curl -L --progress-bar -o "$DATA_DIR/natura2000_zps.geojson" "$ZPS_URL"
    echo "[OK] Natura2000 ZPS téléchargé ($(du -h "$DATA_DIR/natura2000_zps.geojson" | cut -f1))"
else
    echo "[SKIP] Natura2000 ZPS déjà présent"
fi

# ─── 3. ODRÉ — Registre national des installations de production ───
echo ""
echo "[3/3] ODRÉ Registre (opendatasoft.com)..."
ODRE_URL="https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/registre-national-installation-production-stockage-electricite-agrege/exports/csv?delimiter=%3B&list_separator=%2C&quote_all=false&with_bom=true"
if [ ! -f "$DATA_DIR/odre_registre.csv" ]; then
    curl -L --progress-bar -o "$DATA_DIR/odre_registre.csv" "$ODRE_URL"
    echo "[OK] ODRÉ registre téléchargé ($(du -h "$DATA_DIR/odre_registre.csv" | cut -f1))"
else
    echo "[SKIP] ODRÉ registre déjà présent"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  Téléchargement terminé"
echo "═══════════════════════════════════════════"
echo ""
ls -lh "$DATA_DIR/"
echo ""
echo "Prochaine étape : déployer avec ./scripts/deploy.sh (l'import se fait au seed)"
