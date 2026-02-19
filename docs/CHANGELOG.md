# Changelog — Proxiam OS ENR

## [0.1.0] — 2026-02-19 — Sprint 0 : Fondations

### Ajouté
- Pivot de l'assurance vers l'énergie renouvelable
- Structure projet complète (backend FastAPI + frontend React + Docker)
- Modèle de données PostgreSQL + PostGIS (matrice 6D + projets + postes sources)
- Parser de brainstorm : 54 fichiers .md → 5176 items structurés
  - 8 blocs, 1061 phases, 943 normes, 811 risques, 975 livrables
  - 578 sources, 500 outils, 300 compétences
- API REST complète : /phases, /normes, /risques, /outils, /sources, /competences, /projets
- API géospatiale : /postes-sources/bbox, /postes-sources/nearest
- Frontend React avec routing, sidebar (Nexus-Flow inspired), 9 pages
- Design system : palette de phases P0-P7, typographie Inter/JetBrains Mono
- i18n français/anglais (i18next)
- Mobile-first : bottom nav, responsive breakpoints
- Sécurité : headers OWASP, rate limiting, CORS, input validation
- Tests : pytest (backend) + vitest (frontend)
- Docker Compose : PostgreSQL 16 + PostGIS + Redis + Meilisearch + MinIO
- Documentation : CLAUDE.md, README.md, ARCHITECTURE.md, DECISIONS.md, API.md
- Étude ergonomique : UX_ERGONOMICS.md (design system, gamification pro, accessibilité)
- Audit sécurité : SECURITY.md (OWASP Top 10 checklist)

### Archivé
- Ancien projet assurance → repo `sedestech/assuria`
- Repo `courtage-ia` renommé `assuria`

### Infrastructure
- Nouveau repo : `sedestech/proxiam`
- Git init + push initial
