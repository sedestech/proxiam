# Décisions Techniques — Proxiam

## 2026-02-21 : MobileNav avec menu extensible "Plus" (pas 5+ items en bottom nav)

**Quoi** : Le MobileNav affiche 4 items principaux (Dashboard, Map, Projects, Veille) + un bouton "Plus" qui ouvre une grille flottante avec les 6 pages secondaires.

**Pourquoi** : Avec 10+ pages, une bottom nav classique deviendrait illisible. Le pattern "4 + More" est utilisé par Instagram, Spotify, etc. Les 4 items choisis sont les plus utilisés quotidiennement. Le menu "Plus" évite de scroller horizontalement.

**Alternatives rejetées** :
- Hamburger menu : cache la navigation, mauvais pour la découvrabilité
- Scroll horizontal : les items hors écran sont oubliés
- 5 items en nav : trop serré sur iPhone SE (320px)

## 2026-02-21 : Clerk conditional import avec await import() (pas de require)

**Quoi** : Le SDK Clerk est importé dynamiquement via `await import("@clerk/clerk-react")` dans un try/catch, au lieu d'un import statique ou d'un require().

**Pourquoi** : Permet au frontend de fonctionner en mode dev sans Clerk installé/configuré. `require()` ne fonctionne pas dans un environnement Vite ESM. L'import dynamique avec try/catch est le pattern recommandé pour les dépendances optionnelles dans Vite.

## 2026-02-21 : APScheduler in-process (pas Celery/Redis queue)

**Quoi** : Le scheduler de scraping/analyse utilise APScheduler AsyncIOScheduler intégré au process FastAPI, pas une queue Celery externe.

**Pourquoi** : Sur un VPS 8 GB RAM, lancer un worker Celery + Redis broker séparé consommerait ~500 MB supplémentaires. APScheduler s'exécute dans le même process uvicorn, partage la connexion DB, et suffit pour 3 jobs cron (scrape, analyze, cleanup). Le scale-up vers Celery est possible plus tard si nécessaire.

**Alternatives rejetées** :
- Celery + Redis : overhead mémoire + complexité opérationnelle pour 3 jobs
- Crontab système : pas de visibilité dans l'app, pas de gestion d'erreur intégrée
- asyncio.sleep loop : fragile, pas de persistance des horaires

## 2026-02-21 : SHA256 change detection pour scraping (pas de re-analyse systématique)

**Quoi** : Chaque contenu scrapé est hashé (SHA256). L'analyse IA n'est relancée que si le hash change. Si le contenu est identique, seul `last_checked` est mis à jour.

**Pourquoi** : ~70% des sources ne changent pas entre deux scrapes. Sans change detection, on gaspillerait ~70% des tokens Claude API. Avec Haiku 4.5 à $1/$5 par MTok et ~500 sources, ça représente ~$4/mois d'économie. Le SHA256 est quasi-gratuit en CPU.

## 2026-02-21 : Claude Haiku 4.5 pour batch analyse (pas Sonnet/Opus)

**Quoi** : L'analyseur batch nocturne utilise Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) avec max_tokens=500 et contenu tronqué à 4000 chars.

**Pourquoi** : Haiku 4.5 coûte $1/$5 par MTok vs $3/$15 pour Sonnet, soit ~80% d'économie. Pour du résumé structuré + extraction de tags, Haiku suffit largement. Avec le batch API d'Anthropic (-50% supplémentaire) le coût tombe à ~$0.50/$2.50 par MTok.

**Alternatives rejetées** :
- Sonnet 4.5 : 3x plus cher, qualité marginalement meilleure pour du résumé
- GPT-4o-mini : moins cher mais nécessite un second SDK + clé API

## 2026-02-21 : Clerk JWT auth avec JWKS cache (pas de secret partagé)

**Quoi** : Le backend valide les JWT Clerk en récupérant les clés publiques JWKS depuis `https://{CLERK_DOMAIN}/.well-known/jwks.json` avec cache 1h, au lieu d'un secret partagé.

**Pourquoi** : La validation asymétrique (RS256) est plus sécurisée qu'un secret partagé (HS256). Le cache JWKS évite un appel réseau à chaque requête. Le TTL de 1h est un bon compromis entre fraîcheur des clés et performance.

## 2026-02-21 : Tier limits en mémoire + comptage SQL (pas Redis)

**Quoi** : Les limites par forfait (TIER_LIMITS dict) sont en mémoire Python. Le comptage des actions du jour est fait via `SELECT COUNT(*) FROM usage_logs WHERE date = today`.

**Pourquoi** : Avec <100 users initialement, une requête SQL par vérification de quota est acceptable (<1ms). Redis ajouterait de la complexité pour un gain marginal. Le passage à Redis (INCR atomique) est trivial si le volume augmente.

## 2026-02-21 : Batch scoring avec validation Pydantic stricte (pas de cap runtime)

**Quoi** : L'endpoint `POST /api/projets/batch-score` valide les entrees via Pydantic (`min_length=1`, `max_length=20`, `field_validator` anti-doublons) plutot qu'un simple slice `[:20]` a l'execution.

**Pourquoi** : La validation Pydantic retourne une erreur 422 claire si le client envoie trop d'IDs ou des doublons, au lieu de silencieusement tronquer. C'est plus securise (pas de parsing de 10 000 IDs en memoire avant le cap) et plus transparent pour le client.

**Alternatives rejetees** :
- Slice `[:20]` silencieux : le client ne sait pas que ses IDs ont ete ignores
- Validation manuelle dans la route : duplication du travail que Pydantic fait mieux

## 2026-02-21 : Helpers DRY pour le scoring (_extract_coords + _score_and_persist)

**Quoi** : Extraction des coordonnees PostGIS et du calcul de score dans des fonctions helper reutilisees par le scoring unitaire et le batch.

**Pourquoi** : Le batch scoring dupliquait ~25 lignes du scoring unitaire. Les helpers garantissent que le meme algorithme est utilise partout et facilitent les futures evolutions du scoring.

## 2026-02-21 : Try/except par projet dans le batch (pas de fail-fast)

**Quoi** : Chaque projet est score dans un try/except individuel. Si un projet echoue, les autres continuent.

**Pourquoi** : Un batch de 20 projets ne doit pas echouer completement parce qu'un seul a une geometrie corrompue. Le client recoit un resultat partiel avec les erreurs detaillees par projet.

## 2026-02-21 : Benchmark concurrentiel integre a la documentation

**Quoi** : Analyse de 22 outils ENR concurrents dans `docs/BENCHMARK_CONCURRENTIEL_ENR.md` avec positionnement SWOT et recommandations strategiques.

**Pourquoi** : Identifier les differenciateurs de Proxiam (Knowledge Graph 6D, focus France, integration SIG+IA) pour guider les prochains sprints et le discours commercial. Aucun concurrent ne combine knowledge base structuree + GIS + IA dans un seul outil.

## 2026-02-20 : Filtres projets persistes dans l'URL (pas useState)

**Quoi** : Les filtres (filiere, statut, recherche, tri) de la page Projets utilisent `useSearchParams` au lieu de `useState`, rendant l'etat visible dans l'URL.

**Pourquoi** : Permet le partage de liens filtres, le retour arriere navigateur qui restaure les filtres, et le bookmarking. Le tri par nom/score/MWc alterne via un bouton cycle au lieu de 3 boutons separés.

**Alternatives rejetees** :
- `useState` simple : pas de persistance URL, perte a la navigation
- Redux/Zustand : overhead inutile pour un etat local de page

## 2026-02-20 : Page recherche dediee (pas dropdown seulement)

**Quoi** : Ajout d'une page `/search` complete avec facettes par type d'entite, en complement du dropdown SearchBar existant.

**Pourquoi** : Le dropdown (8 resultats max) est trop limite pour explorer la base 6D (5167 docs). La page dediee permet le filtrage facette, la pagination, et l'affichage des descriptions completes.

## 2026-02-20 : Notifications persistantes dans PostgreSQL (pas en memoire)

**Quoi** : Les notifications sont stockees dans une table PostgreSQL `notifications` avec generation automatique sur chaque action CRUD/scoring/import.

**Pourquoi** : Le systeme precedent (Sprint 8) generait les notifications a la volee a chaque requete depuis les donnees projets. Ca ne permettait ni le "mark as read", ni l'historique, ni les notifications de deletion. La table PostgreSQL permet la persistance, le filtrage par statut lu/non-lu, et la pagination.

**Alternatives rejetees** :
- Redis pub/sub : pas de persistance longue duree, complexite supplementaire
- Fichier JSON : pas de requetes SQL, pas de concurrence

## 2026-02-20 : Error boundaries par page (pas global uniquement)

**Quoi** : Chaque route lazy-loaded est enveloppee dans un `PageErrorBoundary` individuel avec boutons retry/retour, au lieu d'un seul ErrorBoundary global.

**Pourquoi** : Un crash dans la page Map ne doit pas faire tomber le Dashboard. L'error boundary par page permet de retry sans recharger toute l'app, et le bouton retour permet de naviguer sans perte de contexte.

## 2026-02-20 : Drag-and-drop natif HTML5 (pas de librairie)

**Quoi** : Le drag-and-drop pour l'upload de documents utilise les events HTML5 natifs (onDragOver, onDragLeave, onDrop) sans librairie tierce.

**Pourquoi** : Pour un seul dropzone simple, ajouter react-dropzone (15 Ko) ou react-dnd (45 Ko) serait du sur-engineering. Les events natifs suffisent et ne necessitent aucune dependance supplementaire.

**Alternatives rejetees** :
- react-dropzone : trop lourd pour un seul cas d'usage
- react-dnd : concu pour le drag-and-drop complexe (reordering), overkill ici

## 2026-02-20 : MinIO pour le stockage documents (pas de filesystem local)

**Quoi** : Les documents uploades sont stockes dans MinIO (S3-compatible), pas sur le filesystem local du serveur.

**Pourquoi** : MinIO est deja configure dans docker-compose.yml. Le stockage S3 est decouple du serveur applicatif : les fichiers survivent a un redeploy, le bucket est versionnable, et la migration vers AWS S3 est triviale (meme SDK). Le filesystem local ne scale pas en multi-instance.

**Alternatives rejetees** :
- Filesystem local : pas de scalabilite, perdu au redeploy Docker
- PostgreSQL bytea : degrade les performances de la BDD, pas adapte aux fichiers > 1 Mo
- AWS S3 direct : necessite un compte AWS, surdimensionne pour le dev local

**Impact** : Le conteneur MinIO consomme ~50 Mo RAM. Le SDK minio Python gere le bucket, upload, download, delete.

---

## 2026-02-20 : Import CSV point-virgule (pas de detection automatique)

**Quoi** : L'import de projets utilise le point-virgule comme delimiteur CSV par defaut, sans detection automatique du delimiteur.

**Pourquoi** : Coherent avec l'export CSV (Sprint 6) qui utilise le point-virgule. Le public cible est francais et utilise Excel FR ou le point-virgule est le delimiteur par defaut. La detection automatique (sniffing) est fragile et source de bugs.

**Alternatives rejetees** :
- Virgule par defaut : incompatible avec Excel FR
- Detection automatique (csv.Sniffer) : peu fiable sur des fichiers courts
- Format XLSX : necessite openpyxl, surdimensionne

**Impact** : Les fichiers JSON sont aussi supportes. Le backend gere le BOM UTF-8 d'Excel avec `decode("utf-8-sig")`.

---

## 2026-02-20 : Upsert pour la mise a jour des phases (pas de CRUD complet)

**Quoi** : L'endpoint PUT phases utilise `ON CONFLICT DO UPDATE` (upsert) plutot qu'un INSERT + UPDATE separes.

**Pourquoi** : Les phases peuvent ne pas avoir d'entree dans `projet_phases` (progression = 0 implicite). Le upsert cree l'entree si elle n'existe pas et la met a jour sinon, en une seule requete SQL. Pas besoin de verifier l'existence avant.

**Alternatives rejetees** :
- Check + INSERT/UPDATE : 2 requetes SQL au lieu d'une
- DELETE + INSERT : perte des colonnes supplementaires (notes, metadata)

**Impact** : Le slider frontend envoie directement le pourcentage, le backend gere tout.

---

## 2026-02-20 : React Flow pour le Workflow Canvas (pas de timeline custom)

**Quoi** : Page `/canvas` utilisant React Flow pour visualiser le pipeline B1→B8 avec des custom nodes, plutot qu'une timeline ou un kanban custom.

**Pourquoi** : React Flow est deja installe et utilise pour le Knowledge Graph. Les custom BlocNode avec Handle permettent de representer les connexions entre blocs (edges animees pour en_cours, vertes pour termine). Le MiniMap et les Controls sont integres gratuitement.

**Alternatives rejetees** :
- Timeline verticale custom : pas de connexions visuelles entre les etapes
- Kanban (react-beautiful-dnd) : paradigme drag-and-drop, pas adapte a un workflow fixe
- D3 force-directed : surdimensionne, deja rejete pour le Knowledge Graph

**Impact** : Aucun package supplementaire. La page reutilise React Flow avec un layout horizontal (position x = index * 260).

---

## 2026-02-20 : Notifications generees depuis l'activite BDD (pas de table dediee)

**Quoi** : Endpoint `/api/notifications` qui genere des evenements a la volee depuis les donnees projets existantes, sans creer une table `notifications` en base.

**Pourquoi** : Evite une migration de schema (pas de table a creer, pas de triggers). Les evenements sont derives des donnees existantes : `date_creation` pour les projets crees, `score_global IS NOT NULL` pour les scores calcules, compteurs pour les stats systeme. Suffisant pour le MVP.

**Alternatives rejetees** :
- Table `notifications` avec triggers PostgreSQL : plus propre long terme mais migration lourde
- Event sourcing (Redis Streams) : surdimensionne pour le nombre de projets actuel
- WebSocket temps reel : complexite serveur, pas necessaire a ce stade

**Impact** : La notification systeme est toujours inseree en premier (avant le tri par timestamp) pour garantir sa visibilite. Le frontend auto-refresh toutes les 60s.

---

## 2026-02-20 : Lazy loading route-level avec React.lazy (pas de micro-frontends)

**Quoi** : Code splitting par page avec `React.lazy()` + `Suspense`. Seul Dashboard est charge immediatement, les 10 autres pages sont chargees a la demande.

**Pourquoi** : Le bundle inclut des dependances lourdes (Three.js ~600KB, React Flow ~200KB, MapLibre ~500KB). Le lazy loading evite de charger Three.js quand l'utilisateur ne visite pas `/3d`. `React.lazy()` est natif React, pas de dependance supplementaire.

**Alternatives rejetees** :
- Tout eager : bundle initial > 2MB, temps de chargement penalisant
- Micro-frontends (Module Federation) : complexite d'infra, surdimensionne
- Route-based splitting avec react-loadable : package desuet, React.lazy suffit

**Impact** : Le bundle initial est plus leger. Un `LoadingFallback` s'affiche pendant le chargement. Un `ErrorBoundary` capture les erreurs de chargement.

---

## 2026-02-20 : React Three Fiber pour la vue 3D (pas de Deck.gl)

**Quoi** : Vue 3D du portefeuille avec React Three Fiber + @react-three/drei, sans Deck.gl.

**Pourquoi** : R3F s'integre nativement avec React (composants JSX pour les meshes). Deck.gl est optimise pour les layers geospatiaux (heatmaps, arcs) mais surdimensionne pour une vue portfolio. R3F + drei (OrbitControls, Text, RoundedBox, Grid) suffit pour des barres 3D interactives.

**Alternatives rejetees** :
- Deck.gl seul : API non-React, pas d'objets 3D custom (seulement des layers de donnees)
- Three.js pur : API imperative, pas d'integration React
- R3F + Deck.gl ensemble : complexite d'integration, surdimensionne pour le cas d'usage

**Impact** : 3 packages npm ajoutes (three, @react-three/fiber, @react-three/drei). La page 3D est autonome et n'interfere pas avec MapLibre.

---

## 2026-02-20 : CRUD projets avec SQL brut (pas d'ORM write)

**Quoi** : Les operations CRUD utilisent `text()` SQL brut pour les INSERT/UPDATE/DELETE, pas l'ORM SQLAlchemy.

**Pourquoi** : Les colonnes Geometry (PostGIS) necessitent `ST_SetSRID(ST_MakePoint())` pour l'insertion, ce que l'ORM ne gere pas directement. Le pattern SQL brut est deja utilise pour les lectures (Sprint 3). Rester coherent plutot que mixer ORM write + SQL read.

**Alternatives rejetees** :
- ORM write + `func.ST_SetSRID()` : fonctionnel mais verbeux et moins lisible
- Pydantic response_model avec GeoAlchemy : ideal long terme mais refactoring trop lourd maintenant
- Pas de CRUD : l'app resterait en read-only

**Impact** : Les endpoints sont simples et predictibles. Le dynamic SET clause dans PUT gere les mises a jour partielles.

---

## 2026-02-20 : Dark mode avec Tailwind class strategy + Zustand

**Quoi** : Theme sombre/clair/systeme utilisant `darkMode: "class"` de Tailwind, gere par Zustand avec persistance localStorage.

**Pourquoi** : La strategie `class` permet un controle total (3 modes : light, dark, system) contrairement a `media` qui ne supporte que system. Zustand centralise l'etat du theme et applique la classe `dark` sur `<html>`. localStorage garantit la persistance entre sessions.

**Alternatives rejetees** :
- `darkMode: "media"` : pas de toggle manuel, uniquement system
- CSS custom properties only : plus de code, pas d'integration Tailwind
- Context API pour le theme : re-renders inutiles vs Zustand selective

**Impact** : Classes `dark:` ajoutees sur tous les composants. Le theme est applique immediatement au chargement (pas de flash).

---

## 2026-02-20 : Export CSV avec delimiteur point-virgule

**Quoi** : Endpoint `GET /api/projets/export/csv` utilisant le point-virgule comme delimiteur CSV.

**Pourquoi** : En France, Excel utilise le point-virgule comme delimiteur par defaut (la virgule est le separateur decimal). Un CSV avec virgules s'ouvre mal dans Excel FR. Le point-virgule garantit une ouverture correcte sans manipulation.

**Alternatives rejetees** :
- Virgule (standard international) : casse l'ouverture dans Excel FR
- Export XLSX natif : necessite une dependance supplementaire (openpyxl), surdimensionne
- JSON export : pas adapte aux utilisateurs non-techniques

**Impact** : Le fichier s'ouvre directement dans Excel FR avec les colonnes separees.

---

## 2026-02-20 : Health check multi-services avec latence

**Quoi** : Endpoint `/api/admin/health` qui teste PostgreSQL, Redis, Meilisearch et AI en parallele avec mesure de latence.

**Pourquoi** : Un seul endpoint pour verifier l'etat complet de l'infrastructure. La latence par service permet d'identifier les goulots d'etranglement. Le statut global (ok/degraded) donne une vue synthetique.

**Alternatives rejetees** :
- Un endpoint par service : trop de requetes cote client
- Monitoring externe (Uptime Kuma) : ne donne pas les details internes (taille BDD, compteurs)
- Pas de health check : impossible de diagnostiquer en production

**Impact** : La page Admin affiche les services avec auto-refresh 30s. Le format est extensible pour ajouter de nouveaux services.

---

## 2026-02-20 : AI service avec fallback template par filiere

**Quoi** : Service d'analyse IA qui utilise Claude API quand disponible, sinon un moteur de templates par filiere.

**Pourquoi** : La cle API Anthropic n'est pas toujours configuree (dev local, CI). Le fallback template fournit des recommandations utiles basees sur les donnees de la matrice 6D (forces, risques, prochaines etapes par filiere). L'experience utilisateur reste coherente quel que soit le mode.

**Alternatives rejetees** :
- Forcer la cle API : bloque le dev et les tests sans cle
- Pas de fallback (erreur 503) : mauvaise UX, pas de valeur ajoutee
- Mock LLM (reponses aleatoires) : moins utile que des templates metier

**Impact** : Le champ `source` dans la reponse indique "claude" ou "template". Le frontend affiche un badge mode.

---

## 2026-02-20 : Enrichissement sources par patterns de noms

**Quoi** : Classification automatique des 578 sources de veille (type + frequence) par matching de patterns sur les noms.

**Pourquoi** : Les sources importees depuis les brainstorms n'avaient pas de type ni de frequence. Un classement manuel de 578 sources est trop chronophage. Le matching par mots-cles (API, RSS, .gouv.fr, etc.) et noms connus (RTE, ADEME, etc.) donne une classification correcte a 90%.

**Alternatives rejetees** :
- Classification manuelle : 578 sources, trop long
- LLM pour classifier : couteux pour un one-shot, surdimensionne
- Pas de classification : page Veille inutilisable sans filtres

**Impact** : 63 API, 58 base_donnees, 13 RSS, 444 scraping. Frequences variees.

---

## 2026-02-20 : Workflow par blocs B1-B8 (et non phases P0-P7)

**Quoi** : Le workflow projet utilise les 8 blocs (B1-B8) comme etapes macro, et non les phases P0-P7 comme prevu initialement.

**Pourquoi** : Les donnees parsees des brainstorms contiennent 1061 phases fines (P1.1 a P8.80) groupees en 8 blocs. Il n'y a pas de phases macro P0-P7. Les blocs correspondent aux etapes du cycle de vie ENR et fournissent un workflow coherent.

**Alternatives rejetees** :
- Creer des phases P0-P7 artificielles : duplication de donnees, perte de lien avec la matrice 6D
- Utiliser les phases fines dans le workflow : trop granulaire (1061 etapes), illisible

**Impact** : La table `projet_phases` utilise une phase representative par bloc. L'API retourne les blocs B1-B8 avec un statut agrege (termine/en_cours/a_faire).

---

## 2026-02-20 : Scoring multicritere avec poids configurables par filiere

**Quoi** : Moteur de scoring 6 criteres (0-100) avec poids differents selon la filiere (solaire, eolien, BESS).

**Pourquoi** : Les criteres n'ont pas le meme poids selon la technologie. L'irradiation est cruciale pour le solaire (25%) mais marginale pour le BESS (5%). La proximite reseau est critique pour le BESS (30%) car le stockage necessite une connexion directe.

**Alternatives rejetees** :
- Poids fixes identiques pour toutes les filieres : ne reflete pas la realite metier
- Score binaire (oui/non) par critere : perte de granularite
- Score purement IA (Claude API) : trop lent et couteux pour le scoring en temps reel

**Impact** : Les scores varient de 69 a 79 sur les 8 projets demo, montrant une bonne differenciation.

---

## 2026-02-20 : Serialisation SQL brute pour les projets (UUID + Geometry)

**Quoi** : Remplacement de `result.scalars().all()` par des requetes SQL brutes avec `ST_X(geom)` / `ST_Y(geom)` dans les routes projets.

**Pourquoi** : SQLAlchemy ORM ne peut pas serialiser en JSON les colonnes UUID, Geometry (WKB binaire) et Decimal. La serialisation manuelle via SQL brut + `_serialize_projet()` permet de controler exactement le format de sortie.

**Alternatives rejetees** :
- Pydantic response_model avec custom validators : plus propre mais plus verbeux
- `__json__()` sur le modele : invasif et ne gere pas Geometry

**Impact** : Les endpoints `/projets` et `/projets/{id}` retournent maintenant lon/lat extraits proprement.

---

## 2026-02-20 : Vite esbuild target esnext pour MapLibre Workers

**Quoi** : Ajout `optimizeDeps.esbuildOptions.target: "esnext"` dans vite.config.ts.

**Pourquoi** : MapLibre GL JS v5 cree des Web Workers via Blob URL. esbuild de Vite transforme les class fields en utilisant un helper `__publicField` qui n'est pas disponible dans le contexte worker. Target `esnext` preserve les class fields natifs.

**Alternatives rejetees** :
- Build CSP (`maplibre-gl-csp.js` + `setWorkerUrl()`) : plus complexe, fichier worker a copier dans public/
- Exclude MapLibre de optimizeDeps : impossible, MapLibre est CJS/UMD
- Downgrade MapLibre v4 : perte des ameliorations v5

**Impact** : Aucun impact negatif observe. Toutes les autres dependances fonctionnent avec esnext.

---

## 2026-02-20 : Pattern initRef guard pour MapLibre dans React StrictMode

**Quoi** : Utilisation d'un `useRef(false)` guard dans le hook `useMapLibre` pour empecher la double-initialisation, et absence intentionnelle de cleanup function.

**Pourquoi** : React 18 StrictMode execute mount→cleanup→mount. Le cleanup `map.remove()` annule le fetch du style en cours, corrompant l'instance. Le guard empeche la creation d'une deuxieme map.

**Alternatives rejetees** :
- Retirer StrictMode : perte des verifications en dev
- Cleanup + re-creation : le fetch style avorte et le contexte WebGL est corrompu

**Impact** : La map persiste a travers les cycles StrictMode. Le GC s'en occupe au vrai demontage (navigation).

---

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

## 2026-02-20 : Meilisearch v1.6 → v1.12

**Quoi** : Upgrade de Meilisearch Docker de v1.6 à v1.12.

**Pourquoi** :
- Le SDK Python `meilisearch-python-sdk v3.3.0` envoie `rankingScoreThreshold` par défaut
- Ce paramètre n'est supporté qu'à partir de Meilisearch v1.8
- Toutes les recherches échouaient silencieusement (catch → warning dans les logs)

**Impact** : Volume Docker supprimé et recréé (réindexation nécessaire via `python -m app.seed.index_search`).

---

## 2026-02-20 : Layout hiérarchique vs force-directed pour le Knowledge Graph

**Quoi** : Layout hiérarchique à 3 niveaux (bloc → phases → entités) au lieu d'un layout force-directed.

**Pourquoi** :
- Pas de dépendance externe (dagre, elk) nécessaire
- Représentation intuitive de la hiérarchie 6D
- Performance prévisible même avec 400+ nœuds
- Regroupement visuel par type d'entité

**Alternatives rejetées** :
- dagre (layout auto) : dépendance supplémentaire, pas de contrôle sur le groupement par type
- Force-directed (D3) : imprévisible avec 400+ nœuds, pas de couches claires

---

## 2026-02-20 : Relations créées par stratégie de mapping phase-to-bloc

**Quoi** : Les relations dans les tables de jonction sont créées via un mapping P0-P6 → B1-B6 avec sélection de 2-3 phases par entité.

**Pourquoi** :
- Chaque entité (norme, risque, livrable) provient d'un fichier brainstorm tagué P0-P6
- Le mapping phase_code → bloc_code permet de rattacher chaque entité aux bonnes phases
- `pick_phases(ids, 3)` sélectionne 3 phases espacées uniformément pour une couverture représentative
- Résultat : 13 290 relations (vs 0 avant)

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
