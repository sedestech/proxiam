#!/bin/bash
# ═══════════════════════════════════════════
# Proxiam — Deploy to VPS
# ═══════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════"
echo "  Proxiam — VPS Deployment"
echo "═══════════════════════════════════════════"
echo ""
echo "Deployment script — à configurer quand le projet est prêt pour la production."
echo ""
echo "Prérequis :"
echo "  - VPS Hostinger avec Docker installé"
echo "  - Domaine proxiam.fr configuré"
echo "  - Caddy reverse proxy"
echo "  - .env production"
echo ""
echo "Usage futur :"
echo "  ./scripts/deploy.sh              # Full deploy"
echo "  ./scripts/deploy.sh --quick      # Quick deploy (sans backup)"
