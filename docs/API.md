# API Documentation — Proxiam

Base URL : `http://localhost:8000`
Swagger UI : `http://localhost:8000/api/docs`
ReDoc : `http://localhost:8000/api/redoc`

## Endpoints

### Health & Stats

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Status API + database |
| GET | `/api/stats` | Compteurs par entité (phases, normes, risques, etc.) |

### Knowledge Engine (Matrice 6D)

| Method | Route | Params | Description |
|--------|-------|--------|-------------|
| GET | `/api/blocs` | — | Liste des 8 blocs |
| GET | `/api/phases` | `bloc`, `filiere`, `limit`, `offset` | Liste des phases |
| GET | `/api/phases/{id}` | — | Détail d'une phase |
| GET | `/api/phases/{id}/normes` | — | Normes liées à une phase |
| GET | `/api/phases/{id}/risques` | — | Risques liés à une phase |
| GET | `/api/phases/{id}/livrables` | — | Livrables liés à une phase |
| GET | `/api/phases/{id}/outils` | — | Outils liés à une phase |
| GET | `/api/normes` | `phase`, `organisme`, `perimetre`, `limit`, `offset` | Liste des normes |
| GET | `/api/normes/{id}` | — | Détail d'une norme |
| GET | `/api/risques` | `categorie`, `severite_min`, `limit`, `offset` | Liste des risques |
| GET | `/api/risques/{id}` | — | Détail d'un risque |
| GET | `/api/risques/{id}/outils` | — | Outils de mitigation d'un risque |
| GET | `/api/outils` | `licence`, `limit`, `offset` | Liste des outils |
| GET | `/api/outils/{id}` | — | Détail d'un outil |
| GET | `/api/sources` | `type`, `limit`, `offset` | Liste des sources de veille |
| GET | `/api/competences` | `pole`, `limit`, `offset` | Liste des compétences |

### Projets

| Method | Route | Params | Description |
|--------|-------|--------|-------------|
| GET | `/api/projets` | `filiere`, `statut`, `region`, `score_min`, `score_max`, `limit`, `offset` | Liste des projets (filtres combinables) |
| GET | `/api/projets/{id}` | — | Détail d'un projet |
| POST | `/api/projets` | Body JSON | Créer un projet |
| PUT | `/api/projets/{id}` | Body JSON | Modifier un projet |
| DELETE | `/api/projets/{id}` | — | Supprimer un projet (cascade) |
| GET | `/api/projets/{id}/phases` | — | Phases B1-B8 avec progression |
| PUT | `/api/projets/{id}/phases/{bloc}` | `completion_pct` (0-100) | Mettre à jour la progression d'un bloc |
| GET | `/api/projets/stats/summary` | — | KPIs portefeuille (total, MWc, score moyen) |
| GET | `/api/projets/stats/analytics` | — | Distribution scores, performance filière, activité |
| GET | `/api/projets/export/csv` | — | Export CSV (délimiteur ;) |
| POST | `/api/projets/import` | Fichier CSV/JSON (multipart) | Import bulk (max 500 lignes) |
| POST | `/api/projets/{id}/score` | — | Calcul du score 0-100 (Sprint 3) |
| GET | `/api/projets/{id}/score` | — | Récupérer le dernier score calculé |
| POST | `/api/projets/batch-score` | Body: `{"projet_ids": [...]}` (max 20) | Scoring batch — Sprint 12 |
| GET | `/api/scoring/weights` | — | Configuration des poids par filière |

### Géospatial

| Method | Route | Params | Description |
|--------|-------|--------|-------------|
| GET | `/api/postes-sources` | `gestionnaire`, `limit`, `offset` | Liste des postes sources |
| GET | `/api/postes-sources/bbox` | `west`, `south`, `east`, `north` | Postes dans un rectangle |
| GET | `/api/postes-sources/nearest` | `lon`, `lat`, `limit` | Postes les plus proches |

### Recherche

| Method | Route | Params | Description |
|--------|-------|--------|-------------|
| GET | `/api/search` | `q` (min 2 chars), `limit` | Recherche globale Meilisearch |

## Rate Limiting

- 100 requêtes/minute par IP
- Header `Retry-After` en cas de dépassement

## Authentification

Sprint 6 — Clerk JWT Bearer token dans le header `Authorization`.
