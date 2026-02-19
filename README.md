# Proxiam — OS Énergie Renouvelable

**Plateforme unifiée pour le cycle de vie des projets d'énergie renouvelable en France.**

Proxiam intègre cartographie SIG, knowledge graph 6D et visualisation 3D pour remplacer les 14+ outils déconnectés utilisés par les professionnels ENR.

## Le problème

Le secteur ENR en France utilise une multitude d'outils fragmentés : PVsyst, QGIS, Excel, emails, bases Access, PDF réglementaires... Aucune plateforme ne couvre les 8 phases du cycle de vie (P0 Prospection → P7 Démantèlement) de manière intégrée.

## La solution : les 3 piliers + IA

| Pilier | Description | Technologie |
|--------|-------------|-------------|
| **Cartographie SIG** | Carte interactive multi-couches (cadastre, PLU, postes sources, contraintes) | MapLibre GL + PostGIS |
| **Knowledge Graph** | 5000+ éléments interconnectés (phases, normes, risques, outils) en graphe navigable | React Flow |
| **Visualisation 3D** | Terrain, actifs, simulation d'ombrage, digital twin progressif | React Three Fiber + Deck.gl |
| **Moteur IA** | Scoring de sites, analyse réglementaire, alertes, génération de livrables | Claude API |

## La Matrice 6D

Chaque projet traverse une matrice à 6 dimensions :

| Dimension | Volume | Description |
|-----------|--------|-------------|
| **Phases** | 1061 | P0 Prospection → P7 Démantèlement |
| **Livrables** | 975 | Documents, rapports, certificats |
| **Normes** | 943 | Standards, réglementations |
| **Risques** | 811 | Profils de risque par catégorie |
| **Sources** | 578 | API, RSS, scraping, bases de données |
| **Outils** | 500 | Logiciels, méthodes, services |
| **Compétences** | 300 | Expertises requises |
| **Total** | **5176** | Éléments interconnectés |

## Stack technique

- **Frontend** : React 18 + Vite + TypeScript + shadcn/ui + Tailwind CSS
- **Backend** : Python 3.12 + FastAPI + SQLAlchemy 2.0
- **BDD** : PostgreSQL 16 + PostGIS 3.4
- **Cache** : Redis 7
- **Search** : Meilisearch
- **Storage** : MinIO (S3)
- **AI** : Anthropic Claude API
- **Deploy** : Docker Compose → VPS Hostinger

## Quick Start

```bash
# Infrastructure
docker compose up -d database redis

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Seed data (5176 items)
cd backend
PYTHONPATH=. python3 -m app.seed.import_data
```

## API

Documentation Swagger : `http://localhost:8000/api/docs`

## Licence

Propriétaire — SedesTech
