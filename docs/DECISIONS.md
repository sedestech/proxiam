# Décisions Techniques — Proxiam

## 2026-02-19 : Pivot Assurance → ENR

**Quoi** : Proxiam pivote du courtage d'assurance vers l'énergie renouvelable.

**Pourquoi** : Le brainstorm de 54 fichiers (75 000 mots) a révélé un marché ENR fragmenté avec 14+ outils déconnectés. Aucun concurrent ne couvre P0→P7 dans une plateforme unifiée. L'opportunité est plus grande que l'assurance.

**Alternatives rejetées** :
- Continuer l'assurance : marché saturé, forte réglementation ACPR
- Pivot partiel (ENR comme feature) : pas assez ambitieux

**Impact** : Repo `courtage-ia` renommé `assuria`, nouveau repo `proxiam` créé.

---

## 2026-02-19 : FastAPI (Python) vs Express (Node.js) pour le backend

**Quoi** : Backend en Python FastAPI au lieu de Node.js Express.

**Pourquoi** :
- GeoAlchemy2 pour PostGIS (écosystème géospatial Python plus mature)
- Libraries AI natives (anthropic, transformers)
- Async natif avec SQLAlchemy 2.0
- OpenAPI auto-générée
- Le frontend reste en React/TypeScript (pas de changement)

**Alternatives rejetées** :
- Express + Prisma : pas de support PostGIS natif
- Django : trop monolithique pour microservices

---

## 2026-02-19 : Meilisearch vs Elasticsearch vs PostgreSQL full-text

**Quoi** : Meilisearch pour la recherche sur les 5176 éléments de la matrice 6D.

**Pourquoi** :
- ~50ms de latence (vs ~200ms PostgreSQL full-text)
- Typo-tolérant (important pour les codes réglementaires)
- Facets natifs (filtrage par type, phase, catégorie)
- Léger en RAM (~100MB vs Elasticsearch ~2GB)
- API REST simple

**Alternatives rejetées** :
- Elasticsearch : trop lourd pour 8 GB RAM
- PostgreSQL `tsvector` : latence trop élevée, pas de facets

---

## 2026-02-19 : MapLibre GL vs Leaflet vs OpenLayers

**Quoi** : MapLibre GL JS pour la cartographie.

**Pourquoi** :
- MVT (vector tiles) natif — performance avec 4847+ points
- Rendu WebGL (rotation, pitch, 3D terrain)
- Open source (fork de Mapbox GL)
- Compatible Deck.gl pour les couches 3D
- Déjà utilisé dans VeilleMarche (réutilisation du savoir-faire)

**Alternatives rejetées** :
- Leaflet : pas de WebGL, pas de MVT natif
- OpenLayers : API plus complexe, communauté plus petite
- Mapbox GL : licence commerciale restrictive

---

## 2026-02-19 : React Flow vs D3 force-directed vs Cytoscape.js

**Quoi** : React Flow pour le Knowledge Graph 6D.

**Pourquoi** :
- Composants React natifs (intégration seamless)
- Noeuds custom avec JSX
- Performance OK jusqu'à ~5000 noeuds
- Minimap, contrôles, sélection intégrés
- Nexus-Flow utilise déjà un paradigme canvas similaire

**Alternatives rejetées** :
- D3 force : pas de composants React, API impérative
- Cytoscape.js : API séparée du React tree

---

## 2026-02-19 : i18next pour l'internationalisation

**Quoi** : i18next + react-i18next pour FR/EN.

**Pourquoi** :
- Standard de facto en React
- Détection automatique de la langue navigateur
- Lazy loading des traductions possible
- Pluralisation et interpolation natives

---

## 2026-02-19 : Zustand vs Redux vs Context

**Quoi** : Zustand pour le state management global.

**Pourquoi** :
- API minimale (create + hook)
- Pas de boilerplate (vs Redux toolkit)
- Performance (selective re-renders)
- Compatible React Query (données serveur via RQ, UI state via Zustand)

**Alternatives rejetées** :
- Redux Toolkit : trop de boilerplate pour la taille du projet
- Context API : re-renders excessifs sur state global
