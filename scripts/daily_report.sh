#!/bin/bash
# ═══════════════════════════════════════════
# Proxiam — Rapport quotidien HTML
# Cron : 0 8 * * * /root/app-proxiam/scripts/daily_report.sh
# ═══════════════════════════════════════════

set -uo pipefail

COMPOSE_FILE="/root/app-proxiam/docker-compose.prod.yml"
ALERT_EMAIL="sedes.tech@gmail.com"
FROM_EMAIL="agent@proxiam.fr"
APP_DIR="/root/app-proxiam"
TODAY=$(date '+%A %d %B %Y')
DATE_SHORT=$(date '+%Y-%m-%d')

# ─── Collecte des données ───

# Services Docker
TOTAL_SERVICES=7
RUNNING=$(cd "$APP_DIR" && docker compose -f "$COMPOSE_FILE" ps --status running -q 2>/dev/null | wc -l)
SERVICES_STATUS="$RUNNING/$TOTAL_SERVICES"

# Health check API
API_START=$(date +%s%N)
API_RESPONSE=$(curl -sf http://localhost:8000/health 2>/dev/null || echo "FAIL")
API_END=$(date +%s%N)
API_MS=$(( (API_END - API_START) / 1000000 ))

if echo "$API_RESPONSE" | grep -q "ok" 2>/dev/null; then
    API_STATUS="OK (${API_MS}ms)"
    API_COLOR="#22c55e"
else
    API_STATUS="DOWN"
    API_COLOR="#ef4444"
fi

# Stats applicatives
STATS=$(curl -sf http://localhost:8000/api/stats 2>/dev/null || echo "{}")
ITEMS=$(echo "$STATS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total',0))" 2>/dev/null || echo "N/A")
PROJETS=$(echo "$STATS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('projets',0))" 2>/dev/null || echo "N/A")

# Disque
DISK_USED=$(df -h / | awk 'NR==2{print $3}')
DISK_TOTAL=$(df -h / | awk 'NR==2{print $2}')
DISK_PCT=$(df / | awk 'NR==2{print $5}' | tr -d '%')

if [ "$DISK_PCT" -lt 70 ]; then
    DISK_COLOR="#22c55e"
    DISK_LABEL="OK"
elif [ "$DISK_PCT" -lt 85 ]; then
    DISK_COLOR="#f59e0b"
    DISK_LABEL="Attention"
else
    DISK_COLOR="#ef4444"
    DISK_LABEL="Critique"
fi

# RAM
MEM_USED=$(free -m | awk '/Mem:/{print $3}')
MEM_TOTAL=$(free -m | awk '/Mem:/{print $2}')
MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))

# Erreurs Docker (24h)
ERRORS=$(cd "$APP_DIR" && docker compose -f "$COMPOSE_FILE" logs --since=24h 2>/dev/null | grep -ic "error\|exception\|traceback" || echo "0")

# Certificat SSL
SSL_EXPIRY=$(echo | openssl s_client -servername proxiam.fr -connect proxiam.fr:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "N/A")
if [ "$SSL_EXPIRY" != "N/A" ]; then
    SSL_EPOCH=$(date -d "$SSL_EXPIRY" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    SSL_DAYS=$(( (SSL_EPOCH - NOW_EPOCH) / 86400 ))
    if [ "$SSL_DAYS" -gt 30 ]; then
        SSL_COLOR="#22c55e"
    elif [ "$SSL_DAYS" -gt 14 ]; then
        SSL_COLOR="#f59e0b"
    else
        SSL_COLOR="#ef4444"
    fi
else
    SSL_DAYS="N/A"
    SSL_COLOR="#94a3b8"
fi

# Résumé global
if [ "$RUNNING" -eq "$TOTAL_SERVICES" ] && [ "$API_STATUS" != "DOWN" ] && [ "$ERRORS" -lt 10 ]; then
    GLOBAL_STATUS="Tout fonctionne normalement."
    GLOBAL_ICON="&#x1F7E2;"
    GLOBAL_COLOR="#22c55e"
elif [ "$ERRORS" -gt 50 ] || [ "$API_STATUS" = "DOWN" ]; then
    GLOBAL_STATUS="Problemes detectes — verifier les logs."
    GLOBAL_ICON="&#x1F534;"
    GLOBAL_COLOR="#ef4444"
else
    GLOBAL_STATUS="Fonctionnement degrade — quelques alertes."
    GLOBAL_ICON="&#x1F7E0;"
    GLOBAL_COLOR="#f59e0b"
fi

# ─── Génération HTML ───
HTML=$(cat <<HTMLEOF
From: $FROM_EMAIL
To: $ALERT_EMAIL
Subject: [Proxiam] Rapport quotidien — $DATE_SHORT
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 32px;color:#ffffff;">
  <h1 style="margin:0;font-size:22px;font-weight:700;">$GLOBAL_ICON Proxiam — Rapport quotidien</h1>
  <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">$TODAY</p>
</td></tr>

<!-- Résumé non-technique -->
<tr><td style="padding:24px 32px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:12px 16px;background:${GLOBAL_COLOR}15;border-left:4px solid ${GLOBAL_COLOR};border-radius:4px;">
        <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;">$GLOBAL_STATUS</p>
        <p style="margin:8px 0 0;font-size:14px;color:#64748b;">
          $ERRORS erreur(s) detectee(s) aujourd'hui.<br>
          Base de donnees : $ITEMS items, $PROJETS projets.<br>
          Espace disque : ${DISK_PCT}% utilise ($DISK_LABEL).
        </p>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Détails techniques -->
<tr><td style="padding:24px 32px;">
  <h2 style="margin:0 0 16px;font-size:16px;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">Details techniques</h2>
  <table width="100%" cellpadding="8" cellspacing="0" style="font-size:14px;">
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="color:#64748b;width:40%;">&#x1F433; Services</td>
      <td style="color:#1e293b;font-weight:600;">$SERVICES_STATUS actifs</td>
    </tr>
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="color:#64748b;">&#x1F3E5; API Health</td>
      <td style="color:${API_COLOR};font-weight:600;">$API_STATUS</td>
    </tr>
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="color:#64748b;">&#x1F4BE; Disque</td>
      <td style="color:${DISK_COLOR};font-weight:600;">${DISK_USED} / ${DISK_TOTAL} (${DISK_PCT}%)</td>
    </tr>
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="color:#64748b;">&#x1F9E0; RAM</td>
      <td style="color:#1e293b;font-weight:600;">${MEM_USED}MB / ${MEM_TOTAL}MB (${MEM_PCT}%)</td>
    </tr>
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="color:#64748b;">&#x1F534; Erreurs 24h</td>
      <td style="color:#1e293b;font-weight:600;">$ERRORS</td>
    </tr>
    <tr>
      <td style="color:#64748b;">&#x1F512; SSL proxiam.fr</td>
      <td style="color:${SSL_COLOR};font-weight:600;">Expire dans ${SSL_DAYS}j</td>
    </tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
    Proxiam v3.0.0 — srv882249.online-server.cloud — $(date -u '+%H:%M UTC')
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
HTMLEOF
)

# ─── Envoi ───
echo "$HTML" | msmtp "$ALERT_EMAIL"
echo "[$(date)] Rapport quotidien envoyé à $ALERT_EMAIL"
