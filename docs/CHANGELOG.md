# Changelog — Proxiam OS ENR

## [1.9.0] — 2026-02-21 — Sprint 18b : Mobile-First Polish

### Amélioré
- **MobileNav redesign** : 4 items principaux + bouton "Plus" extensible (grille 3 colonnes avec Knowledge, 3D, Canvas, Scoring, Admin, Settings)
- **Touch targets 44px** : tous les boutons interactifs respectent les guidelines Apple/Material (min 44x44px)
- **Admin responsive** : onglets scrollables, vue cards mobile pour la table utilisateurs, KPIs en grille 2 colonnes
- **Veille responsive** : filtres empilés sur mobile, boutons action agrandis (h-9 w-9), items sources en 2 lignes
- **AlertBell responsive** : dropdown `w-[calc(100vw-2rem)]` sur mobile, max-height viewport-based `max-h-[60vh]`
- **Header responsive** : boutons action 40px, espacement compact sur mobile
- **Dashboard responsive** : KPI cards padding compact (p-3), liens projet 48px touch area
- **CSS utilities** : `scrollbar-hide`, `safe-area-inset-bottom`, `animate-fade-in`

### Corrigé
- **Sidebar ESM** : migration `require()` → `await import()` pour compatibilité Vite ESM

### i18n
- 2 clés FR/EN ajoutées : `nav.more`, `nav.morePages`

---

## [1.8.0] — 2026-02-21 — Sprint 18 : Veille Active Bloomberg-Quality

### Ajouté
- **Scrapers mutualisés** : architecture BaseScraper + RssScraper + ApiScraper + HtmlScraper
  - SHA256 change detection (analyse IA uniquement si contenu modifié)
  - Concurrence asyncio.Semaphore(5) max 5 sources en parallèle
  - Retry avec backoff (3 tentatives)
- **Orchestrateur scraping** : dispatch automatique source → scraper selon `type_source`
  - Stockage `scraped_contents` avec hash, résumé IA, tags IA
  - Déclenchement matching alertes après scraping
- **Scheduler APScheduler** : 3 jobs cron async
  - `scrape_all` : 02:00 quotidien
  - `batch_analyze` : 03:00 quotidien (Claude Haiku 4.5 batch)
  - `cleanup_logs` : lundi 04:00 (nettoyage logs > 90 jours)
- **Batch analyzer** : analyse IA nocturne des contenus scrapés
  - Claude Haiku 4.5 ($1/$5 par MTok) — contenu tronqué 4000 chars
  - Résumé structuré + tags + impact ENR en JSON
  - Log UsageLog pour tracking coûts admin
- **Système alertes** : UserWatch (source/keyword/zone_geo/filière) + Alert
  - `alert_matcher.py` : matching keyword (ILIKE), source_id, filière, zone géo
  - Alertes créées automatiquement quand contenu matché
- **Routes veille** : 8 endpoints
  - `GET /api/veille/latest` : contenus scrapés paginés
  - `GET /api/veille/search?q=` : recherche dans contenus
  - `GET /api/alerts` : alertes utilisateur (auth)
  - `PATCH /api/alerts/{id}/read` : marquer alerte lue
  - `GET /api/watches` : veilles actives
  - `POST /api/watches` : créer une veille
  - `DELETE /api/watches/{id}` : supprimer une veille
  - `GET/POST /api/admin/scraping/*` : monitoring + déclenchement manuel
- **Frontend AlertBell** : icône cloche avec badge compteur dans Header + dropdown alertes
- **Frontend Veille** : page mise à jour avec contenus scrapés réels, filtres, bouton "Surveiller"

### Tests
- Backend : +25 tests (scrapers, batch_analyzer, alerts, scheduler)
- Frontend : +10 tests (AlertBell, Veille)

### i18n
- Clés veille/alertes FR/EN ajoutées

---

## [1.7.0] — 2026-02-21 — Sprint 17 : Auth Clerk + Multi-tenant SaaS + Admin Dashboard

### Ajouté
- **Auth Clerk JWT** : middleware backend avec JWKS cache (1h TTL)
  - `get_current_user` (optionnel), `require_user` (401), `require_admin` (403)
  - Upsert automatique User au premier login (clerk_id → User)
  - Decode RS256 avec `python-jose[cryptography]`
- **Modèles multi-tenant** :
  - `User` : clerk_id, email, nom, tier (free/pro/admin), active, last_login
  - `UsageLog` : action, tokens_in/out, cost_eur par utilisateur
  - `Projet.user_id` : FK vers User (filtrage par propriétaire)
- **Tier limits** : quotas par forfait
  - Free : 3 projets, 5 enrichissements/jour, 10 IA/jour, pas de PDF/batch
  - Pro : 50 projets, 100 enrichissements/jour, 200 IA/jour, PDF + batch
  - Admin : illimité
  - `check_quota()` + `log_usage()` avec comptage journalier
- **Routes admin** : 5 endpoints
  - `GET /api/admin/users` : liste utilisateurs + tier + last_login
  - `PATCH /api/admin/users/{id}` : modifier tier/active
  - `GET /api/admin/usage` : consommation globale (tokens, coûts, par action)
  - `GET /api/admin/usage/{user_id}` : consommation par utilisateur
  - `GET /api/admin/stats` : stats plateforme (nb users, projets, enrichments)
- **Frontend Clerk** :
  - `<ClerkProvider>` wrapper conditionnel (graceful fallback dev sans Clerk)
  - `<ProtectedRoute>` : redirect `/sign-in` si non connecté
  - `<SignIn>` page avec composant Clerk
  - `<UserButton>` dans Sidebar avec avatar + menu déconnexion
  - Token Bearer via `useAuth().getToken()` dans api.ts
- **Admin dashboard** : 4 onglets (overview/users/usage/services)
  - Tableau utilisateurs avec modification tier inline
  - Graphiques consommation tokens/coûts (Recharts)
  - Section monitoring scraping

### Tests
- Backend : +20 tests (auth JWT, tier_limits, admin routes)
- Frontend : +10 tests (Admin dashboard, ProtectedRoute)

### i18n
- Clés auth/admin FR/EN ajoutées

---

## [1.6.0] — 2026-02-21 — Sprint 16 : Comparaison Projets + Dashboard Top 5 + Alertes Mock

### Ajouté
- **Comparaison multi-projets** : `GET /api/projets/compare?ids=` (max 5 projets)
  - Radar chart superposé (Recharts), tableau comparatif, export CSV
  - `GET /api/projets/compare/export?ids=` : export CSV formaté
- **Dashboard Top 5** : widget classement par score des meilleurs projets
  - Navigation directe vers fiche projet
- **Alertes mock** : prototype widget alertes récentes sur Dashboard

### Tests
- Backend : +15 tests comparaison + export CSV
- Frontend : +12 tests UI comparaison

---

## [1.5.0] — 2026-02-21 — Sprint 15 : Estimation Financière + PDF

### Ajouté
- **Estimation financière** : `GET /api/projets/{id}/financial`
  - CAPEX/OPEX par filière (solaire, éolien, BESS) avec coefficients réalistes
  - LCOE (Levelized Cost of Energy) calculé
  - TRI (Taux de Rendement Interne) sur 20-25 ans
  - VAN (Valeur Actuelle Nette) avec taux d'actualisation configurable
- **Génération PDF** : `POST /api/projets/{id}/report`
  - Rapport complet : fiche projet, scoring, réglementaire, financier
  - fpdf2 avec mise en page professionnelle, graphiques intégrés
  - Téléchargement direct (Content-Disposition attachment)

### Tests
- Backend : +18 tests estimation financière + génération PDF
- Frontend : +8 tests bouton export PDF

---

## [1.4.0] — 2026-02-21 — Sprint 14 : Analyse Réglementaire Auto + Expert IA

### Ajouté
- **Analyse réglementaire** : `GET /api/projets/{id}/regulatory`
  - Matching automatique normes/contraintes selon localisation et filière
  - Score conformité par catégorie (urbanisme, environnement, réseau)
  - Recommandations IA contextualisées
- **Expert consultant IA** : assistant Claude spécialisé ENR
  - Analyse documentaire automatisée
  - Contexte projet injecté dans le prompt

### Tests
- Backend : +15 tests analyse réglementaire
- Frontend : +10 tests affichage contraintes

---

## [1.3.0] — 2026-02-21 — Sprint 13 : Enrichissement PVGIS + Contraintes + Scoring Réel

### Ajouté
- **Enrichissement PVGIS** : `POST /api/projets/{id}/enrich`
  - Appel API PVGIS (Commission Européenne) pour irradiance solaire
  - Données mensuelles GHI, DNI, température
  - Batch enrichissement : `POST /api/projets/batch-enrich`
- **Contraintes géographiques** : détection automatique
  - Zones Natura 2000, ZNIEFF, monuments historiques
  - Distances postes sources, axes routiers
- **Scoring réel** : algorithme 0-100 basé sur données enrichies
  - Pondération dynamique par filière
  - 6 critères : irradiance, réseau, contraintes, terrain, réglementaire, accès

### Tests
- Backend : +20 tests enrichissement + contraintes
- Frontend : +15 tests affichage données enrichies

---

## [1.3.0] — 2026-02-21 — Sprint 12 : Batch Scoring, Score Filters, Security, Benchmark

### Ajoute
- **Batch scoring** : endpoint `POST /api/projets/batch-score` (max 20 projets)
  - Validation Pydantic (min 1, max 20, pas de doublons)
  - Gestion d'erreur par projet (un echec n'arrete pas le batch)
  - Notification automatique avec resume des scores
- **Score range filters** : `GET /api/projets?score_min=X&score_max=Y`
  - Validation 0-100 sur les bornes
  - Persistence URL compatible avec le dashboard
- **Dashboard interactif** : clic sur bucket score → navigation vers Projects avec filtre
- **Batch UI** : checkboxes multi-selection + bouton Score avec compteur
  - Select all / deselect all dans le header du tableau
  - Badge filtre score avec bouton de suppression
- **Benchmark concurrentiel** : analyse de 22 outils ENR dans `docs/BENCHMARK_CONCURRENTIEL_ENR.md`
  - Positionnement unique de Proxiam (Knowledge Graph 6D + GIS + IA)

### Securite
- Refactoring DRY des helpers `_extract_coords` et `_score_and_persist`
- Validation stricte Pydantic sur BatchScoreRequest (max_length, no duplicates)
- Try/except par projet dans le batch (isolation des erreurs)
- Logging des erreurs de scoring

### i18n
- 3 cles FR/EN ajoutees : `batchScore`, `batchScoring`, `scoreRange`

### Tests
- Backend : +18 tests batch scoring + score range filters (`test_batch_scoring.py`)
- Frontend : +22 tests logique batch UI (`BatchScoring.test.ts`)
- Total : 362 tests (136 backend + 226 frontend)

---

## [1.2.0] — 2026-02-20 — Sprint 11 : Search, Filters, Analytics, Mobile

### Ajoute
- **Page recherche complete** (`/search`) : resultats pleine page avec facettes
  - Filtrage par type d'entite (7 facettes cliquables)
  - URL-persisted query params (`?q=...&types=...`)
  - Resultats avec description, code, icone typee
  - Lien "Voir tous les resultats" depuis la SearchBar
- **Dashboard analytics** : score distribution + activite recente
  - `GET /api/projets/stats/analytics` — distribution scores, performance filiere, activite
  - Graphique barres score distribution (5 buckets colores)
  - Feed activite recente avec pastilles couleur par type
- **Filtres projets avances** avec persistence URL
  - Recherche par nom/commune/departement (client-side)
  - Tri par nom, score, MWc (cycle avec bouton)
  - Dropdowns filiere/statut persistes dans l'URL (`?filiere=...&statut=...`)
  - Dark mode sur les filtres
- **Projects page mobile** : cards layout en dessous de md breakpoint
  - Header responsive avec labels caches sur mobile

### Tests
- 322 tests (118 backend + 204 frontend)
- Nouveaux : facet toggle (4), project filter (5), project sort (4)

---

## [1.1.0] — 2026-02-20 — Sprint 10 : i18n, Notifications DB, Error Boundaries, UX Documents

### Ajoute
- **i18n complet** : toutes les strings hardcodees traduites FR/EN
  - Settings : 16 cles (langue, theme, IA, BDD, search, import/export)
  - Documents : 6 cles (onglet, upload, download, suppression)
  - Import : 7 cles (titre, apercu, import, erreurs, fermer)
  - Delete confirm : 2 cles (titre, message)
- **Notifications persistantes** : table PostgreSQL `notifications`
  - `GET /api/notifications` — liste avec pagination, filtres unread
  - `PUT /api/notifications/{id}/read` — marquer comme lu
  - `PUT /api/notifications/read-all` — marquer tous comme lus
  - Generation automatique sur : creation/modification/suppression projet, scoring, import
  - Seed initial des notifications existantes
- **Error boundaries par page** : composant `PageErrorBoundary` avec retry/retour
  - Chaque route lazy-loaded enveloppee individuellement
  - `QueryError` component reutilisable (message + bouton retry)
  - Ajoute sur Projects, Admin, Veille pages
- **Documents UX ameliore** : drag-drop, icons, progress
  - Zone drag-and-drop sur l'onglet Documents
  - Icones par type de fichier (PDF rouge, image bleu, Excel vert, Word bleu)
  - Barre de progression pendant l'upload
  - Tri par date (plus recent en premier)
  - Compteur de documents dans l'onglet
  - Fonction `formatSize` propre (o/Ko/Mo)

### Infrastructure
- Table `notifications` avec index created_at DESC et read
- `create_notification()` reutilisable depuis n'importe quelle route

### Tests
- 296 tests (105 backend + 191 frontend)
- Nouveaux : test_notifications_db.py (8), Settings.test.ts (17)
- Mis a jour : test_notifications.py (9 → structure DB)

---

## [1.0.0] — 2026-02-20 — Sprint 9 : Documents, Import, Settings & Phase Management

### Ajoute
- **Gestion documents** : upload MinIO S3, stockage metadata PostgreSQL
  - `POST /api/documents/upload` — upload multipart (max 50 Mo)
  - `GET /api/documents` — liste avec filtres projet/categorie
  - `GET /api/documents/{id}/download` — telechargement avec Content-Disposition
  - `DELETE /api/documents/{id}` — suppression MinIO + PostgreSQL
  - Onglet "Documents" dans la page Detail Projet : upload, liste, download, suppression
  - Table `documents` avec FK `projet_id`, index, categories
- **Import projets** : CSV (point-virgule) et JSON
  - `POST /api/projets/import` — import bulk (max 500 lignes)
  - Modal import dans la page Projets : picker fichier, preview tableau, validation, resultat
  - Support BOM UTF-8 (Excel), colonnes mappees automatiquement
  - Affichage erreurs par ligne (nom manquant, etc.)
- **Settings fonctionnel** : page parametres entierement connectee
  - Statistiques BDD en temps reel (compteurs par table)
  - Reindexation Meilisearch depuis l'interface (`POST /api/search/reindex`)
  - Boutons Import/Export connectes aux vrais endpoints
  - Liens directs vers la page Projets pour l'import
- **Phases editables** : modification du pourcentage de completion
  - `PUT /api/projets/{id}/phases/{bloc_code}?completion_pct=N` — upsert avec statut auto
  - Slider range (pas de 5%) sur chaque bloc dans l'onglet Phases
  - Statut auto-calcule : 0% = a_faire, 1-99% = en_cours, 100% = termine

### Infrastructure
- MinIO S3 demarre (port 9000/9001), bucket `proxiam-docs`
- Table `documents` creee avec index sur projet_id
- Sidebar version mise a jour : v1.0.0 — Sprint 9
- Totaux tests : 98 backend + 174 frontend = 272 tests
- Backend version dans /health : 1.0.0

---

## [0.9.0] — 2026-02-20 — Sprint 8 : Workflow Canvas, Notifications & Performance

### Ajoute
- **Workflow Canvas** (`/canvas`) : pipeline B1→B8 avec React Flow
  - Custom BlocNode : badge statut (termine/en_cours/a_faire), barre de progression coloree
  - 8 noeuds connectes en sequence avec edges animees (en_cours) ou vertes (termine)
  - Selecteur de projet avec dropdown et icones filiere
  - Barre de stats : X/8 termines, Y en cours, pourcentage global
  - Fond quadrille, MiniMap, Controls, zoom/pan
- **Notifications** : systeme d'evenements depuis l'activite BDD
  - `GET /api/notifications` — genere 3 types : project_created, score_calculated, system
  - Notification system toujours en premiere position (statistiques BDD)
  - Parametres : `?limit=N` (max 50), compteur unread, total
  - `NotificationDropdown.tsx` dans le Header : cloche avec badge non-lus
  - Dropdown avec icones par type (FolderKanban, Target, Server)
  - Timestamps relatifs (a l'instant, il y a Xmin/h/j)
  - Auto-refresh toutes les 60s via React Query
- **Lazy loading** : code splitting route-level avec React.lazy()
  - Dashboard charge immediatement, 10 autres pages chargees a la demande
  - `LoadingFallback.tsx` : icone Zap + animation pulse + texte "Chargement..."
  - `ErrorBoundary.tsx` : composant React class avec capture d'erreurs et bouton Recharger

### Corrige
- Notification system : le type "system" etait tronque par le tri timestamp — desormais toujours inclus en premier

### Infrastructure
- Sidebar version mise a jour : v0.9.0 — Sprint 8
- Totaux tests : 77 backend + 155 frontend = 232 tests
- Backend version dans /health : 0.9.0

---

## [0.8.0] — 2026-02-20 — Sprint 7 : Search, 3D & CRUD

### Ajoute
- **Recherche globale** : barre de recherche Meilisearch dans le Header
  - Debounce 300ms, 5167 documents indexes sur 7 types d'entites
  - Dropdown avec badges type colores (Phase, Norme, Risque, Livrable, Outil, Source, Competence)
  - Navigation clavier (fleches haut/bas, Entree, Echap)
  - Clic sur un resultat navigue vers le Knowledge Graph
  - Bouton X pour effacer, fermeture au clic exterieur
- **Vue 3D** (`/3d`) : visualisation React Three Fiber du portefeuille
  - Barres 3D par projet : hauteur = MWc, couleur = filiere, intensite = score
  - Grille auto-adaptative (disposition en matrice)
  - OrbitControls : rotation, zoom, pan avec limites
  - Panneau info au clic : nom, commune, MWc, filiere, statut, score
  - Eclairage dual (directionnel + ambiant + accent violet)
  - Legende filieres et bouton Reset
- **CRUD Projets** : creation, modification, suppression
  - `POST /api/projets` — creation avec tous les champs + geom optionnel
  - `PUT /api/projets/{id}` — mise a jour partielle (seuls les champs envoyes sont modifies)
  - `DELETE /api/projets/{id}` — suppression cascade (projet_phases, projet_risques, projet_documents)
  - Bouton "Creer" sur la page Projets ouvrant un formulaire modal
  - Boutons "Modifier" / "Supprimer" sur la page Detail Projet
  - Formulaire modal reutilisable (`ProjectForm.tsx`) : 10 champs, validation nom requis
  - Dialog de confirmation pour la suppression

### Infrastructure
- Dependances 3D installees : three, @react-three/fiber, @react-three/drei
- Sidebar version mise a jour : v0.8.0 — Sprint 7
- Totaux tests : 68 backend + 137 frontend = 205 tests
- Backend version dans /health : 0.8.0

---

## [0.7.0] — 2026-02-20 — Sprint 6 : Polish & Deploy

### Ajoute
- **Dark mode** : theme clair/sombre/systeme avec persistance localStorage
  - Cycle via bouton header (Sun/Moon) : light → dark → system → light
  - Listener `prefers-color-scheme` pour le mode systeme
  - Zustand store avec `applyTheme()` + localStorage key `proxiam-theme`
  - Classes `dark:` sur tous les composants (Layout, Header, Sidebar, Dashboard, Admin, Settings, Projects)
  - Styles sombres sur `.card`, scrollbar, `.mobile-nav`
- **Dashboard enrichi** : remplacement du placeholder par des vraies donnees
  - PieChart Recharts pour la repartition par statut (5 couleurs)
  - BarChart horizontal pour la repartition par filiere
  - KPIs portfolio : score moyen, puissance totale MWc, postes sources
  - Liste des 5 projets recents avec liens vers le detail
  - Couverture Matrice 6D : 7 barres de progression (phases, livrables, normes, risques, sources, outils, competences)
- **Export CSV** : `GET /api/projets/export/csv`
  - StreamingResponse avec delimiteur point-virgule (convention francaise)
  - 13 colonnes : nom, filiere, statut, puissance, surface, commune, departement, region, score, lon, lat, created_at, updated_at
  - Content-Disposition header pour le telechargement (`proxiam-projets.csv`)
  - Bouton Download dans la page Projets
- **Page Admin** : supervision des services en temps reel
  - `GET /api/admin/health` : check PostgreSQL, Redis, Meilisearch, AI
  - PostgreSQL : version, taille BDD, latence, compteurs (projets, phases, normes, risques)
  - Redis : ping, memoire utilisee
  - Meilisearch : health, nombre d'index
  - AI : mode (claude/template), disponibilite
  - Auto-refresh toutes les 30s, bouton Refresh manuel
  - Bandeau global OK/degrade avec compteur services

### Infrastructure
- Sidebar version mise a jour : v0.7.0 — Sprint 6
- Totaux tests : 57 backend + 101 frontend = 158 tests
- Backend version dans /health : 0.7.0

---

## [0.6.0] — 2026-02-20 — Sprint 5 : Agents IA & Veille

### Ajoute
- **Service IA** (`app/services/ai.py`) : analyse de projet avec Claude API
  - Fallback template quand pas de cle API (mode template avec recommandations par filiere)
  - Analyse complete : resume, forces, risques, prochaines etapes, insights scoring
  - Recommendations specifiques par filiere (solaire_sol, eolien_onshore, bess)
  - `_score_insight()` : interpretation humaine des criteres de scoring (high/medium/low)
- **API IA** :
  - `POST /api/projets/{id}/analyze` — analyse IA complete (score + phases + recommandations)
  - `GET /api/ai/status` — mode disponible (claude/template) et message
- **Page Veille** (`/veille`) : 578 sources de donnees ENR indexees
  - 4 cards type cliquables (API, RSS, Scraping, Base de donnees) avec compteurs
  - Recherche full-text sur nom, code, URL
  - Filtres par type et gratuit/payant
  - Liste de sources avec icone type, badge frequence, lien externe
  - Enrichissement automatique des sources (type et frequence par patterns de noms)
- **Onglet IA dans Detail Projet** : 4eme onglet "IA" dans la page projet
  - Bouton "Lancer l'analyse IA" avec animation spinner
  - Affichage resume, forces (check vert), risques (warning ambre)
  - Prochaines etapes numerotees
  - Insights scoring avec jauge coloree par critere
  - Badge source (Claude IA / Mode template)
- **Enrichissement sources** : script `enrich_sources.py` — classification des 578 sources
  - 63 API, 58 base_donnees, 13 RSS, 444 scraping
  - Frequences variees : temps_reel, quotidien, hebdo, mensuel, annuel
- **i18n Sprint 5** : 30+ cles FR/EN (veille.*, ai.*)
- **Tests Sprint 5** : 14 tests backend (pytest) + 37 tests frontend (Vitest)

### Infrastructure
- Sidebar version mise a jour : v0.6.0 — Sprint 5
- Totaux tests : 46 backend + 87 frontend = 133 tests

---

## [0.5.0] — 2026-02-20 — Sprint 4 : Gestion Projets

### Ajoute
- **Page Projets** (`/projects`) : tableau portefeuille complet
  - Tableau responsive avec colonnes : nom, filiere (icone), localisation, MWc, score, statut
  - Filtres par filiere (solaire/eolien/BESS) et statut (prospection→exploitation)
  - 4 KPI en haut : total projets, puissance totale MWc, score moyen, nombre filieres
  - Badges colores par statut, cercles colores par score
  - Liens cliquables vers detail projet
- **Page Detail Projet** (`/projects/:id`) : vue complete avec 3 onglets
  - **Onglet Vue d'ensemble** : barre de progression globale, jauge score, infos projet
  - **Onglet Phases** : workflow vertical B1→B8 avec icones (termine/en_cours/a_faire), barres de progression par bloc
  - **Onglet Score** : radar chart Recharts + barres de criteres (reutilise le composant Scoring)
- **API Projets enrichie** :
  - `GET /api/projets/{id}/phases` — progression bloc par bloc (B1-B8) avec statut et completion_pct
  - `GET /api/projets/stats/summary` — stats portefeuille (total, par statut, score moyen, MWc total)
  - `GET /api/projets/{id}` retourne 404 au lieu de null quand projet inconnu
- **Seed projet_phases** : script `seed_projet_phases.py` — 35 progressions liees aux 8 projets demo
  - Prospection : B1 60%, B2 20%
  - Ingenierie : B1-B2 100%, B3 30%, B4 10%
  - Construction : B1-B4 100%, B5 80%, B6 40%, B7 10%
  - Exploitation : B1-B7 100%, B8 20%
- **i18n projets** : 17 cles FR/EN (projects.subtitle, projects.tabOverview, projects.progression, etc.)
- **Tests Sprint 4** : 10 tests backend (pytest httpx) + 16 tests frontend (Vitest)

### Corrige
- **Projets 404** : `GET /api/projets/{id}` retournait `null` — maintenant HTTPException 404
- **TypeScript unused import** : `filiereLabel` supprime dans Projects.tsx

### Infrastructure
- Sidebar version mise a jour : v0.5.0 — Sprint 4

---

## [0.4.0] — 2026-02-20 — Sprint 3 : Site Scoring

### Ajoute
- **Moteur de scoring 6 criteres** : algorithme 0-100 avec poids configurables par filiere
  - proximite_reseau : distance au poste source le plus proche (PostGIS ST_Distance)
  - urbanisme : compatibilite PLU/RNU (simule par departement/surface)
  - environnement : sensibilite environnementale (simule par departement/filiere)
  - irradiation : ressource solaire/eolienne (basee sur latitude + filiere)
  - accessibilite : accessibilite du site (basee sur surface/puissance)
  - risques : score inverse des risques lies au projet (table projet_risques)
- **Poids par filiere** : solaire_sol (irradiation 25%, reseau 25%), eolien_onshore (env 20%, urba 20%), bess (reseau 30%, risques 25%)
- **API Scoring** :
  - `POST /api/projets/{id}/score` — calcul + persistance du score global
  - `GET /api/projets/{id}/score` — recuperation du dernier score
  - `GET /api/scoring/weights` — configuration des poids par filiere
- **API Projets corrigee** : serialisation UUID/Geometry/Decimal, coordonnees lon/lat
- **Page Scoring frontend** : `/scoring` avec 3 panneaux
  - Jauge circulaire SVG animee (score global 0-100, couleur adaptative)
  - Radar chart Recharts (6 axes, tooltip, remplissage indigo)
  - Barres de progression par critere (couleur, poids, valeur)
  - Selecteur de projet avec dropdown (icones filiere, badges score)
  - Infos projet (commune, region, puissance, surface, statut)
- **Seed 8 projets demo** : script `seed_projets.py`
  - 4 solaire (Crau, Landes, Herault, Alpes), 2 eolien (Beauce, Picardie), 2 BESS (Fos, Dunkerque)
  - Coordonnees reelles, departements, filieres, puissances
- **Navigation** : lien Scoring dans la sidebar (icone Target)
- **i18n scoring** : 25+ cles FR/EN (scoring.title, scoring.criteria, scoring.radarTitle, etc.)
- **Tests Sprint 3** : 10 tests backend (pytest httpx) + 17 tests frontend (Vitest)

### Corrige
- **Serialisation projets** : UUID, Geometry, Decimal n'etaient pas serializables en JSON — passage a des requetes SQL brutes avec ST_X/ST_Y pour les coordonnees

### Infrastructure
- Sidebar version mise a jour : v0.4.0 — Sprint 3

---

## [0.3.0] — 2026-02-20 — Sprint 2 : Cartographie MapLibre GL

### Ajoute
- **Carte interactive MapLibre GL JS v5.18.0** : page `/map` avec basemap CARTO Positron
  - 2 723 postes sources affiches en cercles colores par gestionnaire (RTE bleu, Enedis vert, ELD orange)
  - Popup au clic : nom, gestionnaire, tension, puissance, capacite disponible
  - Rayon des cercles adaptatif selon le zoom (interpolation lineaire)
  - Curseur pointer au survol des postes
- **Sidebar carte** : panneau lateral avec filtres et statistiques
  - Toggle visibilite du layer (Eye/EyeOff)
  - Filtres par gestionnaire (RTE, Enedis, ELD, Autre) avec checkboxes
  - Compteur de postes affiches en temps reel
  - Barre mobile avec compteur (responsive)
- **API GeoJSON** : `GET /api/postes-sources/geojson`
  - Filtres : gestionnaire, tension_min/max, capacite_min, limit
  - Format GeoJSON FeatureCollection conforme
  - Support `format=geojson` sur `/postes-sources/bbox`
- **Hook usePosteSources** : React Query avec staleTime 10 min
- **Seed postes sources** : script `import_postes.py` — 2 723 postes (490 RTE, 2 030 Enedis, 203 ELD)
- **i18n carte** : 20+ cles FR/EN (map.title, map.layers, map.filterByGestionnaire, etc.)
- **Document bonnes pratiques** : `docs/BEST_PRACTICES_DEV.md` avec erreurs et correctifs
- **Recherche postes** : champ de recherche par nom dans la sidebar avec effacement
- **Poste le plus proche** : mode clic sur carte → appel API nearest → 5 resultats avec distance en km
  - Fly-to au clic sur un resultat, marqueur rouge au point clique, bouton annuler
- **Tests Sprint 2** : 10 tests backend (pytest httpx) + 12 tests frontend (Vitest)
- **Compatibilite Python 3.9** : remplacement `str | None` → `Optional[str]` dans tous les routes/services

### Corrige
- **MapLibre Worker crash** : `__publicField is not defined` — esbuild de Vite transformait les class fields, cassant le Blob Worker. Fix : `optimizeDeps.esbuildOptions.target: "esnext"` dans vite.config.ts
- **React StrictMode double-mount** : pattern `initRef` guard pour empecher la double-creation de la map
- **Erreurs silencieuses MapLibre** : ajout `map.on("error", ...)` pour capturer les erreurs du dispatcher

### Infrastructure
- `vite.config.ts` : ajout `optimizeDeps.esbuildOptions.target: "esnext"`
- Nettoyage cache Vite obligatoire apres modification config

---

## [0.2.0] — 2026-02-20 — Sprint 1 : Knowledge Engine

### Ajouté
- **Knowledge Graph (React Flow)** : visualisation interactive de la matrice 6D
  - Composants custom : BlocNode, EntityNode (phase, norme, risque, livrable, outil, compétence)
  - Hook `useKnowledgeGraph` avec layout hiérarchique à 3 niveaux (bloc → phases → entités)
  - Sidebar : sélecteur de blocs B1-B8, toggles d'entités avec icônes
  - Panneau de détail animé (Framer Motion) au clic sur un nœud
  - Stats badges (nodes/edges), MiniMap, Controls, zoom
  - Vue mobile simplifiée (liste de blocs)
- **API Graph** : `GET /api/knowledge/graph?bloc=B1&entity_types=normes,risques&limit=50`
  - Retourne nodes + edges + stats pour React Flow
  - Filtrage par bloc et types d'entités
  - 5 types d'entités supportés avec relations croisées
- **Meilisearch v1.12** : recherche full-text sur 5167 documents
  - Service async (`app/services/search.py`) avec indexation et recherche
  - 7 index configurés avec attributs searchable/filterable/sortable
  - Script d'indexation : `python -m app.seed.index_search`
  - Endpoint : `GET /api/search?q=solaire&types=normes&limit=20`
  - Facettes par type d'entité dans les résultats
- **Relations (junction tables)** : 13 290 relations créées
  - Phase↔Norme, Phase↔Risque, Phase↔Livrable (3 phases par entité via bloc)
  - Phase↔Outil, Phase↔Compétence (round-robin sur les blocs)
  - Risque↔Norme, Norme↔Livrable (co-occurrence par phase_code)
- **i18n Knowledge** : ~30 clés FR/EN pour la page Knowledge Graph
- **Tests Sprint 1** : 8 tests d'intégration backend + 5 tests frontend Vitest

### Corrigé
- Import seed : tables de jonction étaient vides, maintenant 13 290 relations
- Modèle Norme : ajout colonne `description` manquante
- Doublon S-340 dans les normes : déduplication dans le parser
- Meilisearch v1.6 → v1.12 : SDK envoyait `rankingScoreThreshold` non supporté
- Knowledge.tsx : `useMemo` → `useEffect` pour sync React Flow (boucle infinie)
- Hook API : double prefix `/api/api/` corrigé en `/knowledge/graph`

### Infrastructure
- Docker Compose : Meilisearch `v1.6` → `v1.12`
- Python 3.12 venv créé (`backend/venv/`)

---

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
