# Sécurité — Proxiam OS ENR

## Philosophie anti-vibecoding

**Chaque ligne de code est auditée. Pas de copier-coller aveugle.**

Ce document trace les mesures de sécurité implémentées et celles planifiées, pour éviter les failles classiques du vibecoding (code généré par IA sans revue).

## Mesures implémentées (Sprint 0)

### 1. Security Headers (OWASP)

Fichier : `backend/app/middleware.py`

| Header | Valeur | Protection |
|--------|--------|-----------|
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS (legacy browsers) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuite URL |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Accès hardware |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |

### 2. Rate Limiting

- **Library** : slowapi (built on limits)
- **Limite** : 100 requêtes/minute par IP
- **Scope** : toutes les routes
- **Header** : `Retry-After` en cas de dépassement

### 3. CORS

- Origines restreintes (pas `*` en production)
- Méthodes limitées : GET, POST, PUT, DELETE, PATCH
- Headers autorisés : Authorization, Content-Type, Accept, Accept-Language

### 4. Input Validation

- **Pydantic** : tous les paramètres API sont typés et validés
- **Query params** : `limit` borné (max 500), `offset` >= 0
- **Path params** : typés (int pour IDs, UUID pour projets)

### 5. SQL Injection Prevention

- **SQLAlchemy ORM** : pas de SQL brut avec input utilisateur
- **Paramètres bindés** : les requêtes PostGIS utilisent `text()` avec `:param`
- **Pas de f-string SQL** : interdit

### 6. Secrets Management

- **`.env`** : jamais commité (dans `.gitignore`)
- **`.env.example`** : template sans valeurs réelles
- **Pydantic Settings** : chargement sécurisé des variables d'environnement

## Mesures planifiées

### Sprint 1 : Meilisearch

- [ ] MEILI_MASTER_KEY en production (pas la valeur par défaut)
- [ ] Meilisearch pas exposé publiquement (proxy via FastAPI)

### Sprint 6 : Auth (Clerk)

- [ ] JWT validation sur toutes les routes protégées
- [ ] RBAC (rôles : admin, editor, viewer)
- [ ] Session expiration
- [ ] Audit trail (qui fait quoi, quand)

### Production (VPS)

- [ ] HTTPS obligatoire (Let's Encrypt via Caddy)
- [ ] Firewall : seuls ports 80/443 ouverts
- [ ] Docker secrets pour les credentials
- [ ] Backup chiffré de la BDD
- [ ] Scan de dépendances (Snyk ou pip-audit)
- [ ] Scan d'images Docker (Trivy)

## OWASP Top 10 — Checklist

| # | Risque | Statut | Mesure |
|---|--------|--------|--------|
| A01 | Broken Access Control | Planifié (Sprint 6) | Clerk RBAC |
| A02 | Cryptographic Failures | OK | HTTPS, pas de secrets en clair |
| A03 | Injection | OK | SQLAlchemy ORM, Pydantic validation |
| A04 | Insecure Design | OK | Architecture documentée, DECISIONS.md |
| A05 | Security Misconfiguration | OK | Headers OWASP, CORS restreint |
| A06 | Vulnerable Components | Planifié | pip-audit, npm audit |
| A07 | Auth Failures | Planifié (Sprint 6) | Clerk |
| A08 | Data Integrity Failures | OK | Input validation, pas de désérialization unsafe |
| A09 | Security Logging | Planifié | Audit trail |
| A10 | SSRF | N/A (pas de fetch user-provided URLs) | — |

## Tests de sécurité

```bash
# Backend : tests pytest incluant validation des inputs
cd backend && pytest

# Frontend : pas de `dangerouslySetInnerHTML`
grep -r "dangerouslySetInnerHTML" frontend/src/  # doit retourner 0 résultat

# Dépendances Python
pip-audit -r requirements.txt

# Dépendances Node
cd frontend && npm audit
```

## Règles pour le développement

1. **Jamais de SQL brut** avec des données utilisateur
2. **Jamais de `eval()`** ou `exec()` sur des inputs
3. **Jamais de `dangerouslySetInnerHTML`** sans sanitization
4. **Toujours valider** les types et bornes côté serveur (Pydantic)
5. **Toujours échapper** les données affichées dans le frontend (React le fait par défaut)
6. **Toujours utiliser** des paramètres bindés pour les requêtes raw SQL
7. **Toujours vérifier** les dépendances avant de les installer (npm info, pip show)
8. **Jamais commiter** de secrets, tokens, ou credentials
