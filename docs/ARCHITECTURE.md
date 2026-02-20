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

## Sprint 1 — Knowledge Engine (implémenté)

### Backend
- `app/routes/graph.py` : `GET /api/knowledge/graph` — retourne nodes + edges + stats pour React Flow
- `app/services/search.py` : Service async Meilisearch (indexation + recherche multi-index)
- `app/seed/index_search.py` : Script d'indexation PostgreSQL → Meilisearch (5167 docs, 7 index)
- `app/seed/import_data.py` : Import seed avec création de 13 290 relations dans les junction tables

### Frontend
- `src/pages/Knowledge.tsx` : Page Knowledge Graph avec sidebar B1-B8, toggles d'entités, canvas React Flow, panneau de détail
- `src/components/graph/BlocNode.tsx` : Noeud custom pour les blocs (indigo, icône Boxes)
- `src/components/graph/EntityNode.tsx` : Noeud compact pour 6 types d'entités (icônes et couleurs distinctes)
- `src/hooks/useKnowledgeGraph.ts` : Hook React Query + layout hiérarchique 3 niveaux

### Relations Matrice 6D (13 290 total)
```
PhaseNorme:      2 826 relations (3 phases/norme via bloc mapping)
PhaseRisque:     2 433 relations
PhaseLivrable:   2 925 relations
PhaseOutil:      1 000 relations (round-robin sur blocs)
PhaseCompetence:   600 relations
RisqueNorme:     1 348 relations (co-occurrence par phase_code)
NormeLivrable:   2 158 relations
```

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
