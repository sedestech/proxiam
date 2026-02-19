# Architecture — Proxiam OS ENR

## Vue d'ensemble

```
┌────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  MapLibre GL · Deck.gl · React Three Fiber (3D)             │
│  React Flow (graphe) · shadcn/ui · Recharts · Tailwind      │
├────────────────────────────────────────────────────────────┤
│                   API GATEWAY (FastAPI)                      │
│  REST + WebSocket · Auth (Clerk) · Rate Limiting            │
│  Security Headers (OWASP) · CORS                            │
├──────────┬──────────┬────────────┬─────────────────────────┤
│ Knowledge│ Project  │ Geospatial │ AI Agent                │
│ Engine   │ Manager  │ Engine     │ Orchestrator            │
│          │          │            │                         │
│ Graphe   │ Workflow │ PostGIS    │ Claude API              │
│ 6D       │ P0→P7   │ MVT Tiles  │ Scraping                │
│ Search   │ Risques  │ Scoring    │ Doc Analysis            │
├──────────┴──────────┴────────────┴─────────────────────────┤
│  PostgreSQL 16 + PostGIS 3.4  │  Redis 7  │  Meilisearch  │
│  MinIO (S3)                   │           │  (full-text)   │
└────────────────────────────────────────────────────────────┘
```

## Flux de données

1. **Brainstorm → Parser → PostgreSQL** : 54 fichiers .md → 5176 items structurés
2. **PostgreSQL → Meilisearch** : Indexation pour recherche instantanée (~50ms)
3. **PostGIS → MVT Tiles** : Tuiles vectorielles pour la carte
4. **MinIO** : Stockage documents projets (PDFs, rapports)
5. **Claude API** : Analyse de documents, scoring intelligent

## Modèle de données

### Matrice 6D (knowledge base)

Tables principales : `blocs`, `phases`, `livrables`, `normes`, `risques`, `sources_veille`, `outils`, `competences`

Tables de relations croisées : `phase_livrables`, `phase_normes`, `phase_risques`, `phase_outils`, `phase_competences`, `risque_normes`, `risque_outils`, `norme_livrables`, `outil_competences`

### Projets (instances opérationnelles)

Tables : `projets` (géolocalisés), `projet_phases`, `projet_risques`, `projet_documents`

### Infrastructure géospatiale

Table : `postes_sources` (4847 postes RTE/Enedis avec géométrie POINT 4326)

## Sécurité

- **Headers OWASP** : X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy
- **Rate limiting** : 100 req/min par IP (slowapi)
- **CORS** : Origines restreintes
- **Validation** : Pydantic schemas pour tous les inputs
- **ORM** : SQLAlchemy (pas de SQL brut user-facing)
- **Auth** : Clerk (Sprint 6)
- **Tests** : pytest (backend) + Vitest (frontend)

## Performance

- **PostgreSQL** : Index GiST sur colonnes géométriques
- **Meilisearch** : Recherche instantanée (<50ms)
- **Redis** : Cache sessions + queues
- **React Query** : Cache client-side (5min stale time)
- **MVT Tiles** : Rendu vectoriel côté client
