# 🎯 VISION PRODUIT CONSOLIDÉE — AetherNexus OS

> "Unifier la gestion du cycle de vie complet d'une centrale d'énergie renouvelable — de la prospection foncière au démantèlement — dans une plateforme unique, intelligente et multi-filière."

---

## Principe directeur

**"Start narrow, go deep, then expand"**

Au lieu de 5350 data points à plat, structurer en 4 horizons temporels. Commencer par résoudre UN problème critique pour UN persona, puis élargir.

---

## Horizon 1 — MVP (6 mois) : "Le Sherlock Holmes du foncier ENR"

### Client cible
Développeur ENR indépendant (IPP) en France, équipe de 5-20 personnes. Portefeuille de 50-200 MW en développement. Utilise aujourd'hui QGIS + Excel + Capareseau manuellement.

### Problème résolu
> "Je perds 60% de mon temps à chercher des sites et à croiser des données manuellement. Mes concurrents déposent les permis avant moi parce qu'ils ont plus de ressources humaines."

### Produit
Plateforme web de **scoring automatique de sites ENR**.

### Fonctionnalités MVP

| # | Fonctionnalité | Description | Base existante |
|---|---------------|-------------|---------------|
| 1 | **Carte interactive SIG** | Couches superposées : cadastre, PLU, contraintes (Natura 2000, ZNIEFF, PPR, MH), postes sources | VeilleMarche ✅ |
| 2 | **Scoring automatique de sites** | Score 0-100 basé sur 20+ critères pondérés (réseau, foncier, contraintes, productible, réglementaire) | À développer |
| 3 | **Estimation de raccordement** | Distance au poste source + capacité résiduelle + estimation de coût + délai | VeilleMarche ✅ |
| 4 | **Analyse réglementaire express** | Croisement automatique PLU + Natura 2000 + ZNIEFF + PPR + ABF en 1 clic | VeilleMarche partiel |
| 5 | **Estimation de productible rapide** | pvlib + données météo (PVGIS API, Meteonorm) sans PVsyst | À développer |
| 6 | **Alertes MRAe** | Nouveaux avis publiés, nouveaux projets dans une zone, changements réglementaires | VeilleMarche ✅ |

### Avantage
VeilleMarche couvre déjà **40-50% du MVP**. C'est le chemin le plus court vers un produit fonctionnel.

### KPI de succès H1
- 50 utilisateurs beta en 3 mois
- NPS > 40
- 3 clients payants en 6 mois
- Temps de scoring d'un site < 2 minutes (vs 3 jours manuellement)

---

## Horizon 2 — V2 (12-18 mois) : "Le copilote du développeur"

### Extension vers P1-P2 (Ingénierie + Autorisations)

| # | Fonctionnalité | Description |
|---|---------------|-------------|
| 1 | **Génération automatique de dossiers** | Permis de construire, étude d'impact, dossier MRAe via LLM (Claude API) |
| 2 | **Suivi des autorisations** | Timeline interactive, deadlines, relances automatiques, statut par autorité |
| 3 | **Analyse IA des avis MRAe** | Extraction automatique des points bloquants, recommandations, comparaison avec des projets similaires |
| 4 | **Simulation financière** | Business plan automatique avec scénarios (tarif OA/CR/PPA, CAPEX/OPEX, TRI, VAN, LCOE) |
| 5 | **Marketplace de prestataires** | Bureaux d'études, écologues, géomètres, avocats — notation, disponibilité, devis en ligne |

### KPI de succès H2
- 200 clients
- €500K ARR
- 2 filières couvertes (PV sol + éolien onshore)
- Taux de rétention M6 > 80%

---

## Horizon 3 — V3 (24-36 mois) : "L'OS de la centrale"

### Extension vers P3-P7

| # | Fonctionnalité | Description |
|---|---------------|-------------|
| 1 | **Gestion de construction** | Planning Gantt, suivi d'avancement chantier, QA/QC, HSE, reporting photo |
| 2 | **Commissioning digital** | Checklists interactives, tests automatisés, PV de réception numérique |
| 3 | **Monitoring & O&M** | Intégration SCADA (Modbus, OPC-UA), maintenance prédictive IA, performance tracking |
| 4 | **Asset Management** | Reporting investisseurs, valorisation de portefeuille, benchmarking, ESG/GRESB |
| 5 | **Démantèlement** | Traçabilité des matériaux (DEEE/Soren), planification démontage, filière recyclage, repowering |

### KPI de succès H3
- 500 clients
- €3M ARR
- 5 filières (PV sol, toiture, AgriPV, éolien, BESS)
- Expansion européenne (DE, ES, UK)

---

## Horizon X — Vision 5 ans : "La plateforme"

| Fonctionnalité | Description |
|---------------|-------------|
| **Marketplace de projets ENR** | Achat/vente de projets en développement (ready-to-build, COD) |
| **Place de marché de financement** | Crowdfunding citoyen, dette senior, bridge, equity |
| **Plateforme de données ENR** | API ouverte, data-as-a-service, benchmarking industrie |
| **Agrégation & trading** | VPP intégré, optimisation de revenus spot/PPA/services système |
| **Jumeaux numériques** | Réplica 3D temps réel de chaque centrale, simulation what-if |

---

## Stack technique envisagée

| Composant | Technologie | Justification |
|-----------|------------|---------------|
| **Frontend** | React + Vite + TypeScript | Écosystème mature, VeilleMarche existant |
| **Cartographie** | MapLibre GL JS + Deck.gl | Open source, tuiles vectorielles, haute performance |
| **Backend API** | Python FastAPI | VeilleMarche existant, idéal pour IA/data |
| **Backend temps réel** | Node.js Express + WebSocket | Alertes, notifications, collaboration |
| **BDD principale** | PostgreSQL + PostGIS | Requêtes géospatiales, VeilleMarche existant |
| **BDD temporelle** | TimescaleDB (extension PG) | Données SCADA, séries temporelles (H3) |
| **Cache** | Redis | Sessions, queues, état temps réel |
| **IA / LLM** | Claude API (Anthropic) | Analyse documentaire, génération de rapports |
| **IA / ML** | pvlib + scikit-learn + ONNX | Productible, scoring, maintenance prédictive |
| **Stockage fichiers** | MinIO (S3-compatible) | Documents, rapports, images drone |
| **Recherche** | Meilisearch | Recherche instantanée dans les normes, livrables, outils |
| **Infra** | Docker Compose → Kubernetes | VPS initial, migration cloud progressive |
| **CI/CD** | GitHub Actions | Tests automatisés, déploiement continu |
| **Monitoring** | Sentry + Uptime Kuma | Erreurs, performance, disponibilité |

### Principe technique
> Partir de VeilleMarche (FastAPI + PostgreSQL/PostGIS + React/MapLibre) et étendre. Ne pas repartir de zéro.

---

## Différenciateurs clés

| # | Différenciateur | Pourquoi c'est unique |
|---|----------------|----------------------|
| 1 | **Cycle complet P0→P7** | Aucun concurrent ne couvre plus de 2 phases |
| 2 | **Multi-filière natif** | PV, éolien, BESS, H2, AgriPV, FPV, offshore dans un seul outil |
| 3 | **Données françaises propriétaires** | 4847 postes sources, MRAe 13 régions, scoring territorial |
| 4 | **IA intégrée en natif** | Pas un add-on mais le cœur du produit (scoring, analyse docs, prédiction) |
| 5 | **6 dimensions croisées** | E↔L↔S↔R↔V↔T = la connaissance métier structurée |
| 6 | **Open + extensible** | API ouverte, marketplace de prestataires, data-as-a-service |
