# CLAUDE.md — Proxiam OS Énergie Renouvelable

## Projet

**Proxiam** est un Operating System complet pour les actifs ENR (énergie renouvelable) en France. C'est une plateforme d'action, de réflexion, de configuration, de test et de formation pour TOUS les métiers ENR : prospecteur, juriste, ingénieur études solaire, foncier, environnemental, génie électrique SCADA, grid, batterie, génie civil, géophysique, construction, maintenance, intervention, performance, suivi de dossier, gestionnaire de centrale, optimisation financière, qualité fournisseur, qualité matériel, R&D.

Il intègre 3 piliers visuels (Cartographie SIG, Knowledge Graph 6D, Visualisation 3D), un moteur IA, une veille qualité Bloomberg/Palantir, et un système multi-tenant SaaS.

## Architecture

```
Frontend (React 18 + Vite + TypeScript)
  → MapLibre GL · React Flow · React Three Fiber · shadcn/ui · Tailwind
API Gateway (Python FastAPI)
  → REST + WebSocket · Auth (Clerk) · Rate Limiting · Security Headers
Services
  → Knowledge Engine (6D matrix) · Project Manager · Geospatial Engine · AI Orchestrator
Data
  → PostgreSQL 16 + PostGIS 3.4 · Redis 7 · Meilisearch · MinIO
```

## Quick Start

```bash
# Infrastructure (limiter à 2-3 services max — 8 GB RAM)
docker compose up -d database redis

# Backend (dev local sans Docker recommandé)
cd backend
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --reload --port 8000

# Frontend (dev local)
cd frontend
npm install
npm run dev

# Health check
curl http://localhost:8000/health
curl http://localhost:8000/api/stats
```

## Seed Data

```bash
# Parser dry run (pas besoin de BDD)
cd backend && PYTHONPATH=. python3 -m app.seed.import_data --dry

# Import complet (BDD PostgreSQL requise)
PYTHONPATH=. python3 -m app.seed.import_data
```

**Données parsées** : 5176 items (8 blocs, 1061 phases, 943 normes, 811 risques, 975 livrables, 578 sources, 500 outils, 300 compétences)

## Commandes

| Commande | Description |
|----------|-------------|
| `docker compose up -d database` | Démarrer PostgreSQL + PostGIS |
| `docker compose up -d redis` | Démarrer Redis |
| `docker compose up -d meilisearch` | Démarrer Meilisearch |
| `npm run dev` (frontend/) | Démarrer le frontend React |
| `uvicorn app.main:app --reload` (backend/) | Démarrer l'API FastAPI |
| `npm run test` (frontend/) | Tests Vitest |
| `pytest` (backend/) | Tests pytest |
| `npm run lint` (frontend/) | ESLint |
| `python -m app.seed.index_search` (backend/) | Indexer dans Meilisearch |
| `alembic upgrade head` (backend/) | Appliquer les migrations BDD |
| `alembic revision --autogenerate -m "desc"` (backend/) | Créer une migration |
| `python -m app.commands.import_natura2000 file.geojson` (backend/) | Import zones Natura 2000 |
| `python -m app.commands.import_odre file.csv` (backend/) | Import projets ODRÉ |

## Stack

| Couche | Techno |
|--------|--------|
| Frontend | React 18, Vite, TypeScript, shadcn/ui, Tailwind CSS |
| Carte | MapLibre GL JS |
| 3D | React Three Fiber, Deck.gl |
| Graphe | React Flow |
| Charts | Recharts (Nivo en Sprint 1+) |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, GeoAlchemy2 |
| BDD | PostgreSQL 16 + PostGIS 3.4 |
| Cache | Redis 7 |
| Search | Meilisearch v1.12 |
| Storage | MinIO (S3) |
| Auth | Clerk (Sprint 17) |
| AI | Anthropic Claude API |
| PDF | fpdf2 (génération rapports) |
| i18n | i18next (FR/EN) |

## API Endpoints

| Route | Description |
|-------|-------------|
| `GET /health` | Status API + BDD |
| `GET /api/stats` | Compteurs par entité |
| `GET /api/phases` | Liste des phases (filtres: bloc, filière) |
| `GET /api/phases/{id}/normes` | Normes liées à une phase |
| `GET /api/phases/{id}/risques` | Risques liés à une phase |
| `GET /api/phases/{id}/livrables` | Livrables liés à une phase |
| `GET /api/normes` | Liste des normes |
| `GET /api/risques` | Liste des risques |
| `GET /api/outils` | Liste des outils |
| `GET /api/sources` | Liste des sources de veille |
| `GET /api/competences` | Liste des compétences |
| `GET /api/projets` | Liste des projets |
| `GET /api/postes-sources/bbox` | Postes sources par bounding box |
| `GET /api/postes-sources/nearest` | Postes sources les plus proches |
| `POST /api/projets/{id}/score` | Calcul du score 0-100 |
| `POST /api/projets/batch-score` | Scoring batch (N projets) |
| `POST /api/projets/{id}/enrich` | Enrichissement PVGIS + contraintes |
| `POST /api/projets/batch-enrich` | Enrichissement batch (N projets) |
| `GET /api/projets/{id}/regulatory` | Analyse réglementaire auto |
| `GET /api/projets/{id}/financial` | Estimation financière CAPEX/OPEX/TRI |
| `POST /api/projets/{id}/report` | Génération rapport PDF |
| `GET /api/projets/compare?ids=` | Comparaison multi-projets |
| `GET /api/projets/compare/export?ids=` | Export CSV comparaison |
| `GET /api/knowledge/graph` | Knowledge Graph (nodes+edges pour React Flow) |
| `GET /api/search?q=` | Recherche globale (Meilisearch, 5167 docs, 7 index) |
| `GET /api/admin/users` | Liste utilisateurs (admin) |
| `PATCH /api/admin/users/{id}` | Modifier tier/active (admin) |
| `GET /api/admin/usage` | Consommation globale (admin) |
| `GET /api/admin/usage/{user_id}` | Consommation par utilisateur (admin) |
| `GET /api/admin/stats` | Stats plateforme (admin) |
| `GET /api/veille/latest` | Derniers contenus scrapes |
| `GET /api/veille/search?q=` | Recherche contenus scrapes |
| `GET /api/alerts` | Alertes utilisateur (auth) |
| `PATCH /api/alerts/{id}/read` | Marquer alerte lue (auth) |
| `GET /api/watches` | Mes veilles actives (auth) |
| `POST /api/watches` | Creer une veille (auth) |
| `DELETE /api/watches/{id}` | Supprimer une veille (auth) |
| `GET /api/admin/scraping/status` | Statut scraping (admin) |
| `POST /api/admin/scraping/run` | Lancer scraping manuel (admin) |
| `GET /api/admin/data-health` | Statut fraîcheur/qualité datasets (admin) |
| `POST /api/admin/knowledge/refresh` | Re-import matrice 6D (admin) |
| Swagger | `GET /api/docs` |

## Data Model — Matrice 6D

```
Phases (1061) ←→ Blocs (8)
Livrables (975) ←→ Phases
Normes (943) ←→ Phases, Risques
Risques (811) ←→ Phases, Outils
Sources (578) ←→ (standalone)
Outils (500) ←→ Phases, Risques, Compétences
Compétences (300) ←→ Phases, Outils

Projets ← instances opérationnelles traversant la matrice
Postes Sources (4847) ← infrastructure réseau géolocalisée
Natura2000 ← zones protégées INPN (import GeoJSON)
DataSourceStatus ← suivi fraîcheur/qualité datasets
```

## Design System

- **Fond** : `bg-slate-50` (light, pro, B2B)
- **Primary** : Indigo `#6366f1`
- **Phases** : P0 blue, P1 violet, P2 emerald, P3 teal, P4 amber, P5 pink, P6 indigo, P7 slate
- **Typo** : Inter (corps), JetBrains Mono (données)
- **Icons** : Lucide React
- **Mobile** : Bottom nav + "Plus" expandable menu + gestes carte natifs + 44px min touch targets
- **Animations** : ease-out, jamais de bounce

## Sécurité

- Security headers OWASP (X-Content-Type-Options, X-Frame-Options, CSP, HSTS)
- Rate limiting (slowapi, 100 req/min par IP)
- CORS restreint aux origines configurées
- Input validation Pydantic
- SQL injection : SQLAlchemy ORM (pas de raw SQL user-facing)
- Tests de sécurité : pytest + scanning dépendances

## Tests

```bash
# Backend
cd backend && pytest                    # Tous les tests
cd backend && pytest --cov              # Avec couverture
cd backend && pytest -v tests/test_health.py  # Test spécifique

# Frontend
cd frontend && npm run test             # Vitest
cd frontend && npm run test:coverage    # Couverture
```

## Roadmap

- **Sprint 0** : Fondations (structure, Docker, schema, seed) ✓
- **Sprint 1** : Knowledge Engine (Graph API, React Flow, Meilisearch) ✓
- **Sprint 2** : Cartographie (MapLibre GL, MVT tiles, postes sources) ✓
- **Sprint 3** : Site Scoring (algorithme 0-100, radar chart) ✓
- **Sprint 4** : Gestion Projets (workflow P0→P7, timeline, portfolio) ✓
- **Sprint 5** : Agents IA (analyse docs, scoring, veille, génération) ✓
- **Sprint 6** : Polish (dark mode, export CSV, admin) ✓
- **Sprint 7** : 3D (R3F) + CRUD + recherche globale ✓
- **Sprint 8** : Workflow Canvas + Notifications ✓
- **Sprint 9** : Documents MinIO + Import CSV/JSON + Settings ✓
- **Sprint 10** : i18n complet FR/EN + Error Boundaries ✓
- **Sprint 11** : Page recherche facettée + Analytics + Mobile ✓
- **Sprint 12** : Batch scoring + Score filters + Benchmark marché ✓
- **Sprint 13** : Enrichissement PVGIS + contraintes + scoring réel ✓
- **Sprint 14** : Analyse réglementaire auto + expert consultant IA ✓
- **Sprint 15** : Estimation financière CAPEX/OPEX/LCOE/TRI + PDF ✓
- **Sprint 16** : Comparaison projets + Dashboard Top 5 + alertes ✓
- **Sprint 17** : Auth Clerk + Multi-tenant SaaS + Admin dashboard ✓
- **Sprint 18** : Veille active Bloomberg-quality (scrapers + IA batch + alertes) ✓
- **Sprint 18b** : Mobile-first polish (MobileNav redesign, touch targets 44px, responsive tables/cards) ✓
- **Sprint 18c** : Security hardening (CVE python-jose→PyJWT, auth on all write endpoints, SSRF protection, ownership checks) ✓
- **Sprint 19** : Data lifecycle — Natura2000 + Alembic migrations + constantes financières 2026 + Data Health dashboard ✓
- **Sprint 20** : Tests E2E Playwright + UX onboarding wizard + cross-pillar deep links
- **Sprint 21** : Import GeoJSON + couches cartographiques enrichies (ZNIEFF, cadastre, PLU via WMS/WFS)
- **Sprint 22** : Stripe billing + API marketplace + collaboration multi-user
- **Sprint 23** : Data Lifecycle Agents autonomes + ML prédictif (entraîné sur données ODRÉ/MRAe)
- **Sprint 24** : Déploiement VPS + CI/CD GitHub Actions + monitoring Sentry/Uptime Kuma (DERNIER)

## GitHub

- Repo : `sedestech/proxiam`
- Branch principale : `main`
- Ancien projet assurance archivé dans `sedestech/assuria`

## Contraintes Machine

- **8 GB RAM** — max 2-3 containers Docker en parallèle
- Préférer le dev local (uvicorn + npm run dev) au Docker
- Fermer les services après les tests
