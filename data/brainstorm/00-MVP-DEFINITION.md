# 🚀 DÉFINITION DU MVP — AetherNexus OS v1

> Scope exact, user stories, architecture, critères de succès et planning du Minimum Viable Product. Daté du 17 février 2026.

---

## 1. Persona principal

**Nom** : Marie Dupont, 34 ans
**Poste** : Cheffe de projet développement, IPP régional (15 personnes)
**Expérience** : 8 ans dans le développement PV sol et éolien onshore
**Portefeuille** : 120 MW en développement, 5-8 projets simultanés
**Outils actuels** : QGIS, Excel, PVsyst, Capareseau (manuellement), Google Earth, SharePoint

**Problème** :
> "Je passe 3 jours par semaine à croiser des couches SIG dans QGIS, vérifier la capacité réseau sur Capareseau, et compiler des documents réglementaires. Je rate des opportunités parce que mes concurrents sont plus rapides. Mon patron me demande de prospecter plus de sites mais je n'ai pas le temps de les analyser tous correctement."

**Besoin** : Un outil qui fait en 10 minutes ce qui prend 3 jours.

**Budget** : €300-600/mois (décision autonome), jusqu'à €1000/mois (validation direction)

---

## 2. User Stories MVP

### Epic 1 : Carte & SIG

| ID | User Story | Priorité | Effort |
|----|-----------|----------|--------|
| US-001 | En tant que développeur, je veux voir une carte interactive de la France avec les postes sources et leur capacité résiduelle afin d'identifier les zones raccordables. | Must | M |
| US-002 | En tant que développeur, je veux superposer les couches de contraintes (Natura 2000, ZNIEFF, PPR, monuments historiques, sites classés) afin d'éliminer les zones rédhibitoires. | Must | L |
| US-003 | En tant que développeur, je veux filtrer les parcelles par surface (>5 ha), pente (<15%) et zonage PLU (A, N) afin de cibler les terrains adaptés au PV sol. | Must | L |
| US-004 | En tant que développeur, je veux dessiner une zone d'intérêt sur la carte et obtenir la liste des parcelles éligibles afin de prioriser ma prospection foncière. | Should | M |
| US-005 | En tant que développeur, je veux exporter une carte PDF avec toutes les couches et une légende afin de la présenter en comité d'investissement. | Should | S |

### Epic 2 : Scoring de sites

| ID | User Story | Priorité | Effort |
|----|-----------|----------|--------|
| US-006 | En tant que développeur, je veux cliquer sur une parcelle et obtenir un score de faisabilité (0-100) basé sur 20+ critères afin de comparer objectivement les sites. | Must | XL |
| US-007 | En tant que développeur, je veux voir le détail du score par catégorie (réseau, foncier, contraintes, productible, réglementaire) afin de comprendre les forces et faiblesses du site. | Must | L |
| US-008 | En tant que développeur, je veux personnaliser les pondérations du scoring (ex : réseau x2, foncier x1) afin d'adapter l'outil à ma stratégie de développement. | Could | M |
| US-009 | En tant que développeur, je veux sauvegarder mes sites favoris dans un portefeuille afin de suivre leur évolution dans le temps. | Should | S |

### Epic 3 : Raccordement

| ID | User Story | Priorité | Effort |
|----|-----------|----------|--------|
| US-010 | En tant que développeur, je veux voir la distance au poste source le plus proche et sa capacité résiduelle afin d'estimer la faisabilité du raccordement. | Must | M |
| US-011 | En tant que développeur, je veux obtenir une estimation du coût de raccordement (quote-part S3REnR + extension) afin d'intégrer ce poste dans mon business plan. | Must | M |
| US-012 | En tant que développeur, je veux voir les files d'attente de raccordement par poste source afin d'anticiper les délais. | Should | M |

### Epic 4 : Réglementaire

| ID | User Story | Priorité | Effort |
|----|-----------|----------|--------|
| US-013 | En tant que développeur, je veux savoir en 1 clic si un site est en zone Natura 2000, ZNIEFF, PPR, périmètre ABF ou zone humide afin d'évaluer le risque réglementaire. | Must | M |
| US-014 | En tant que développeur, je veux connaître le régime d'autorisation applicable (permis de construire, ICPE, cas par cas MRAe) afin de planifier mes démarches. | Should | M |
| US-015 | En tant que développeur, je veux voir les avis MRAe des projets similaires dans la même zone afin d'anticiper les points de vigilance. | Should | L |

### Epic 5 : Productible

| ID | User Story | Priorité | Effort |
|----|-----------|----------|--------|
| US-016 | En tant que développeur, je veux obtenir une estimation de productible PV (P50/P75) pour un site donné afin de valider la faisabilité énergétique. | Must | L |
| US-017 | En tant que développeur, je veux choisir la technologie (fixe, tracker, bifacial) et obtenir le productible ajusté afin de comparer les options. | Could | M |
| US-018 | En tant que développeur, je veux estimer le productible éolien (rose des vents, Weibull) pour un site afin de qualifier les sites multi-filière. | Could | XL |

### Epic 6 : Alertes & Veille

| ID | User Story | Priorité | Effort |
|----|-----------|----------|--------|
| US-019 | En tant que développeur, je veux recevoir une alerte email quand un nouvel avis MRAe est publié dans mes zones d'intérêt afin de surveiller la concurrence. | Must | M |
| US-020 | En tant que développeur, je veux recevoir une alerte quand la capacité d'un poste source change (augmentation ou saturation) afin de saisir les opportunités. | Should | M |
| US-021 | En tant que développeur, je veux voir un fil d'actualité des changements réglementaires ENR (décrets, arrêtés, circulaires) afin de rester informé. | Could | S |

---

## 3. Architecture MVP

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  React + Vite + TypeScript + MapLibre GL + Deck.gl  │
│  (migration depuis VeilleMarche existant)            │
└─────────────────┬───────────────────────────────────┘
                  │ REST API + WebSocket
┌─────────────────▼───────────────────────────────────┐
│                    BACKEND                           │
│  Python FastAPI (depuis VeilleMarche)                │
│  ├── /api/sites       — CRUD sites, scoring         │
│  ├── /api/map         — Tuiles MVT, couches SIG     │
│  ├── /api/grid        — Postes sources, raccordement│
│  ├── /api/regulatory  — Contraintes, MRAe           │
│  ├── /api/yield       — Productible (pvlib)         │
│  ├── /api/alerts      — Alertes, notifications      │
│  └── /api/auth        — Authentification (Clerk)    │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                  DATA LAYER                          │
│  PostgreSQL + PostGIS (depuis VeilleMarche)          │
│  ├── postes_sources (4847 enregistrements)           │
│  ├── parcelles_cadastre (via API IGN)                │
│  ├── contraintes_env (Natura 2000, ZNIEFF, PPR)     │
│  ├── avis_mrae (scraping 13 régions)                │
│  ├── sites_scoring (utilisateur)                     │
│  └── users, subscriptions                            │
│                                                      │
│  Redis — cache, sessions, queues alertes             │
│  MinIO — documents MRAe, exports PDF                 │
└──────────────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│               SOURCES EXTERNES                       │
│  RTE Capareseau API, IGN Géoplateforme API,         │
│  PVGIS API, cadastre.gouv.fr, INPN, Géorisques,    │
│  MRAe (scraping), Enedis Open Data, ODRÉ            │
└──────────────────────────────────────────────────────┘
```

---

## 4. Scope IN / Scope OUT

| ✅ IN (MVP v1) | ❌ OUT (V2+) |
|----------------|-------------|
| Carte interactive France métropolitaine | Carte DOM-TOM et international |
| Couches SIG : cadastre, PLU, Natura 2000, ZNIEFF, PPR, MH, postes sources | Couches dynamiques personnalisables |
| Scoring de sites PV sol (20 critères) | Scoring éolien, BESS, AgriPV, FPV |
| Estimation raccordement (distance + capacité + coût) | Simulation détaillée de réseau (PowerFactory) |
| Analyse réglementaire basique (zones, régime) | Génération automatique de dossiers |
| Productible PV estimé (pvlib, PVGIS) | Productible bankable (rapport P50/P75/P90 certifié) |
| Alertes MRAe par email | Alertes multi-canal (Slack, SMS, webhook) |
| Export PDF carte de synthèse | Export SIG (Shapefile, GeoJSON, KML) |
| Authentification (Clerk) | SSO entreprise (SAML, OIDC) |
| 1 plan payant (Professional) | Multi-plans, facturation au MW |
| Portefeuille de sites sauvegardés | Gestion de projet complète (Gantt, tâches) |
| Interface web responsive | Application mobile native |
| Support email | Support téléphone, chat live, CSM dédié |
| Données France uniquement | Données européennes |
| PV sol uniquement | Éolien, toiture, AgriPV, BESS, H2 |

---

## 5. Critères de succès

| Critère | Cible | Méthode de mesure |
|---------|-------|------------------|
| Utilisateurs beta | 50 en 3 mois | Compteur Clerk |
| Clients payants | 3 en 6 mois | Stripe |
| Temps de scoring | < 2 minutes | Monitoring API |
| NPS | > 40 | Enquête in-app |
| Rétention M3 | > 60% | Cohorte analytics |
| Uptime | > 99.5% | Uptime Kuma |
| Temps de chargement carte | < 3 secondes | Sentry Performance |
| Score Lighthouse | > 80 | CI/CD automatisé |

---

## 6. Risques MVP

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|-----------|
| **Données IGN/Capareseau indisponibles** | Moyenne | Élevé | Cache local, mise à jour asynchrone, fallback OpenStreetMap |
| **Scoring trop simpliste** (utilisateurs déçus) | Moyenne | Élevé | Pondérations personnalisables, feedback loop, itération rapide |
| **Précision productible insuffisante** (vs PVsyst) | Élevée | Moyen | Positionner comme pré-étude (pas bankable), disclaimers clairs |
| **Cycle de vente trop long** | Élevée | Élevé | Freemium, onboarding self-service, démonstrations live |
| **RGPD / données cadastrales** | Faible | Moyen | Audit juridique, DPO, données publiques uniquement |
| **Performance carte avec 50+ couches** | Moyenne | Moyen | Tuiles vectorielles MVT, chargement progressif, cache Redis |
| **Concurrence d'un acteur établi** (DNV, PVsyst cloud) | Faible | Élevé | Aller vite, niche France, profondeur P0 |
| **Migration VeilleMarche complexe** | Moyenne | Moyen | Refactoring progressif, pas de big bang |
| **Scraping MRAe bloqué** | Moyenne | Moyen | Diversifier les sources, API officielles quand disponibles |
| **Manque de feedback utilisateur** | Moyenne | Élevé | 10 interviews avant M2, beta fermée avec feedback obligatoire |

---

## 7. Planning indicatif

| Mois | Sprint | Livrables | Dépendances |
|------|--------|-----------|-------------|
| **M1** | Setup & Migration | Repo unifié, migration VeilleMarche, auth Clerk, CI/CD GitHub Actions | Accès APIs (IGN, PVGIS) |
| **M2** | Carte & Couches | Carte MapLibre avec postes sources + cadastre + 5 couches contraintes, filtres basiques | Données PostGIS migrées |
| **M3** | Scoring & Raccordement | Algorithme de scoring (20 critères), estimation raccordement, fiche site détaillée | Modèle de scoring validé |
| **M4** | Réglementaire & Productible | Analyse réglementaire express, estimation productible pvlib, export PDF | API PVGIS intégrée |
| **M5** | Alertes & Onboarding | Alertes MRAe email, portefeuille de sites, onboarding guidé, landing page | Stripe intégré |
| **M6** | Beta & Itération | Beta fermée (50 users), collecte feedback, corrections, premiers clients payants | 50 beta testers recrutés |

### Jalons clés

| Jalon | Date | Critère de validation |
|-------|------|----------------------|
| **Alpha interne** | Fin M2 | Carte fonctionnelle avec 3 couches minimum |
| **Beta fermée** | Fin M4 | Scoring + raccordement + productible fonctionnels |
| **Beta ouverte** | Fin M5 | 50 utilisateurs inscrits, onboarding complet |
| **Premier client payant** | M6 | Au moins 1 abonnement Professional actif |
| **Product-Market Fit signal** | M6+ | NPS > 40 ET rétention M3 > 60% |
