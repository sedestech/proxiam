# ROADMAP — Proxiam OS Énergie Renouvelable

> **Proxiam est LA synthèse exhaustive, professionnelle, moderne, IA-native, qualitative et ultra-sécurisée.**
> SolarBrainOS, Nexus-Flow et VeilleMarche sont des expérimentations passées servant uniquement d'inspiration.
> Toute la valeur converge dans Proxiam.

---

## Sprints livrés (0 → 19) — v0.1.0 → v2.0.0

| Sprint | Feature | Version | Tests |
|--------|---------|---------|-------|
| 0 | Fondations (Docker, PostgreSQL+PostGIS, seed 5 176 items) | v0.1.0 | — |
| 1 | Knowledge Graph 6D (React Flow, Meilisearch, 13 290 relations) | v0.2.0 | + |
| 2 | Cartographie SIG (MapLibre GL, 4 847 postes sources) | v0.3.0 | + |
| 3 | Scoring 0-100 (6 critères, radar chart, par filière) | v0.4.0 | + |
| 4 | Gestion projets (workflow P0→P7, timeline, portfolio) | v0.5.0 | + |
| 5 | Agents IA Claude (analyse, scoring, veille, génération, consultant) | v0.6.0 | + |
| 6 | Dark mode + export CSV + admin dashboard | v0.7.0 | + |
| 7 | 3D (React Three Fiber) + CRUD complet + recherche globale | v0.8.0 | + |
| 8 | Workflow Canvas (React Flow éditeur) + Notifications | v0.9.0 | + |
| 9 | Documents MinIO + Import CSV/JSON + Settings | v1.0.0 | + |
| 10 | i18n FR/EN complet (160+ clés) + Error Boundaries | v1.1.0 | + |
| 11 | Recherche facettée + Analytics + Responsive mobile | v1.2.0 | + |
| 12 | Batch scoring + Score filters + Benchmark marché | v1.3.0 | + |
| 13 | Enrichissement PVGIS (GHI/DNI/DHI) + contraintes terrain + scoring réel | v1.4.0 | + |
| 14 | Analyse réglementaire auto + expert consultant IA contextuel | v1.5.0 | + |
| 15 | Estimation financière CAPEX/OPEX/LCOE/TRI + génération PDF | v1.6.0 | + |
| 16 | Comparaison multi-projets + Dashboard Top 5 + alertes seuil | v1.7.0 | + |
| 17 | Auth Clerk JWT + Multi-tenant SaaS + Admin users/usage | v1.8.0 | + |
| 18 | Veille Bloomberg-quality (scrapers RSS/API/HTML + IA batch nuit + alertes) | v1.8.5 | + |
| 18b | Mobile-first (MobileNav redesign, touch 44px, responsive tables/cards) | v1.9.0 | + |
| 18c | Security hardening (CVE PyJWT, SSRF protection, ownership checks) | v1.9.2 | + |
| 18d | Auth hardening (auth tous endpoints write, quota enforcement, feature gating) | v1.9.4 | + |
| 19 | Data Lifecycle (Alembic, Natura2000, constantes 2026, Data Health, ODRÉ, KG refresh) | v2.0.0 | + |

**Bilan actuel** : 495+ tests (176 backend + 319 frontend), 14 pages, 5 176 items knowledge graph, 4 847 postes sources, 200+ clés i18n

---

## Sprints futurs

### Sprint 19 — Data Lifecycle + Données réelles (v2.0.0) ✓
> L'enjeu : passer de "démo impressionnante" à "plateforme avec données réelles"

- [x] **Alembic migrations** — Versionner le schéma BDD (fini les raw SQL)
- [x] **Natura 2000 import** — GeoJSON INPN (couche contraintes manquante critique)
- [x] **Constantes financières 2026** — Tarifs CRE S1 2026, coûts matériel actuels, taux actualisation
- [x] **Data Health dashboard** — Admin voit fraîcheur/qualité de chaque dataset
- [x] **Connecteur données ODRÉ** — Import projets ENR nationaux comme benchmark marché
- [x] **Refresh Knowledge Graph** — Mécanisme de mise à jour quand normes/outils changent

### Sprint 20 — Tests E2E + UX Onboarding (v2.1.0)
> Qualité production + première expérience utilisateur

- [ ] **Playwright E2E** — Parcours critiques : signup → créer projet → enrichir → scorer → comparer
- [ ] **Wizard onboarding** — Guide premier utilisateur (3 étapes)
- [ ] **Cross-pillar deep links** — Carte → Knowledge Graph → 3D (navigation fluide entre piliers)
- [ ] **Performance audit** — Lighthouse, bundle splitting, lazy loading avancé

### Sprint 21 — Import GeoJSON + Couches cartographiques (v2.2.0)
> Enrichir la carte avec les données géospatiales de référence

- [ ] **Import GeoJSON** — Drag & drop de fichiers géographiques sur la carte
- [ ] **Couches WMS/WFS** — Natura2000, ZNIEFF, cadastre, PLU comme overlays
- [ ] **Connecteur Capareseau** — Capacité réseau temps réel (API RTE)
- [ ] **Analyse spatiale** — Buffer zones, intersections contraintes, scoring géographique

### Sprint 22 — Monétisation + Collaboration (v2.3.0)
> Transformer en produit SaaS viable

- [ ] **Stripe billing** — Intégration paiement (upgrade free → pro)
- [ ] **API marketplace** — Exposer les données Proxiam via API payante
- [ ] **Collaboration multi-user** — Partage de projets, commentaires, annotations
- [ ] **Usage analytics** — Métriques business (MRR, churn, adoption features)

### Sprint 23 — Agents autonomes + ML (v2.4.0)
> Intelligence artificielle avancée

- [ ] **Data Lifecycle Agents** — 6 agents : Acquire → Validate → Enrich → Score → Monitor → Expire
- [ ] **ML prédictif** — Probabilité obtention permis, délai instruction (entraîné sur ODRÉ/MRAe)
- [ ] **Veille normative automatique** — Détection changements réglementaires, impact sur projets
- [ ] **PWA mobile** — Progressive Web App pour usage terrain

### Sprint 24 — Déploiement VPS + CI/CD + Monitoring (v3.0.0) — DERNIER
> Mise en production complète

- [ ] **VPS Hostinger** — Docker Compose production (16 GB RAM)
- [ ] **CI/CD GitHub Actions** — Build → test → deploy automatisé
- [ ] **Monitoring** — Sentry (errors), Uptime Kuma (uptime), Prometheus+Grafana (metrics)
- [ ] **Backup automatisé** — pg_dump quotidien + MinIO sync
- [ ] **CDN / cache** — Redis cache API, assets CDN
- [ ] **SSL + domaine** — HTTPS, domaine proxiam.fr/app
- [ ] **Documentation utilisateur** — Guide de prise en main, FAQ

---

## Inspiration des projets frères (historique)

> Ces projets ne sont PAS maintenus en parallèle. Ils ont servi de R&D et d'exploration.
> Tout ce qui est utile a été ou sera absorbé dans Proxiam.

| Projet | Rôle historique | Ce que Proxiam en a tiré |
|--------|-----------------|--------------------------|
| **SolarBrainOS** | Ontologie ENR P0→P7 (5 350 items, 6 dimensions) | Knowledge Graph 6D, seed 5 176 items, structure 8 blocs |
| **VeilleMarche** | Intelligence marché (4 847 postes, scrapers MRAe, ODRÉ) | Postes sources géolocalisés, patterns scraping, matching multi-critères |
| **Nexus-Flow** | POC canvas workflow (React 19, Gemini) | Inspiration pour le Canvas Sprint 8, taxonomie 5 secteurs |

---

## Métriques cibles v3.0.0

| Métrique | Cible |
|----------|-------|
| Tests totaux | 600+ (backend + frontend + E2E) |
| Couverture code | > 80% |
| Pages | 15+ |
| Clés i18n | 250+ |
| Temps réponse API | < 200ms (P95) |
| Lighthouse score | > 90 (perf + a11y) |
| Uptime | 99.5% |
| Utilisateurs beta | 10-20 professionnels ENR |
