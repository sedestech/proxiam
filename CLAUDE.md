# CLAUDE.md — Proxiam OS Énergie Renouvelable

## Projet

**Proxiam** est un Operating System de connaissance pour les actifs ENR (énergie renouvelable) en France. Il intègre 3 piliers visuels (Cartographie SIG, Knowledge Graph 6D, Visualisation 3D) et un moteur IA.

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
| Search | Meilisearch |
| Storage | MinIO (S3) |
| Auth | Clerk (Sprint 6) |
| AI | Anthropic Claude API |
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
| `GET /api/search?q=` | Recherche globale (Meilisearch) |
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
```

## Design System

- **Fond** : `bg-slate-50` (light, pro, B2B)
- **Primary** : Indigo `#6366f1`
- **Phases** : P0 blue, P1 violet, P2 emerald, P3 teal, P4 amber, P5 pink, P6 indigo, P7 slate
- **Typo** : Inter (corps), JetBrains Mono (données)
- **Icons** : Lucide React
- **Mobile** : Bottom nav + gestes carte natifs
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
- **Sprint 1** : Knowledge Engine (CRUD 6D, React Flow, Meilisearch)
- **Sprint 2** : Cartographie (MapLibre GL, MVT tiles, postes sources)
- **Sprint 3** : Site Scoring (algorithme 0-100, radar chart)
- **Sprint 4** : Gestion Projets (workflow P0→P7, timeline, portfolio)
- **Sprint 5** : Agents IA (analyse docs, scoring, veille, génération)
- **Sprint 6** : Polish & Deploy (auth, dark mode, export, VPS)

## GitHub

- Repo : `sedestech/proxiam`
- Branch principale : `main`
- Ancien projet assurance archivé dans `sedestech/assuria`

## Contraintes Machine

- **8 GB RAM** — max 2-3 containers Docker en parallèle
- Préférer le dev local (uvicorn + npm run dev) au Docker
- Fermer les services après les tests
