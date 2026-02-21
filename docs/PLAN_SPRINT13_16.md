# Plan : Proxiam — Du navigateur de connaissances au moteur de decision

## Contexte

**Probleme** : Proxiam (v1.3.0, 12 sprints livres) est un excellent **navigateur de connaissances** (5 176 items, 4 847 postes sources, scoring 6 criteres, Knowledge Graph interactif). Mais un developpeur ENR terrain ne peut pas encore **agir** avec : le scoring utilise des heuristiques (latitude comme proxy d'irradiation, departement comme proxy d'urbanisme), il n'y a pas d'estimation de productible, pas de verification reglementaire automatique, pas de modele financier, et le Knowledge Graph est en lecture seule.

**Persona cible** : Developpeur ENR full-cycle (prospection → repowering), petites et grandes centrales, multi-technologies (solaire, eolien, BESS, hybride). Il passe aujourd'hui 3-5 jours par site a croiser manuellement Capareseau + PVGIS + Legifrance + QGIS + Excel. L'objectif : **30 minutes pour 20 sites**.

**Approche** : 4 sprints (13→16) qui transforment progressivement Proxiam en outil de screening operationnel, en s'appuyant sur des APIs gratuites (PVGIS, data.gouv.fr, IGN) et l'IA (Claude) pour automatiser les workflows P0.

---

## Sprint 13 — Enrichissement automatique des projets (2-3 semaines)

### User Story
> "En tant que developpeur ENR, quand j'importe 20 sites, je veux que Proxiam enrichisse automatiquement chaque projet avec les donnees PVGIS (irradiation), la distance reseau reelle, et les contraintes environnementales — sans que je quitte la plateforme."

### Features

#### 1. Service d'enrichissement PVGIS (`backend/app/services/pvgis.py`) — NOUVEAU
- Appel API PVGIS (https://re.jrc.ec.europa.eu/api/v5_2/) avec lat/lon
- Recupere : GHI annuel (kWh/m2), DNI, DHI, temperature moyenne, productible estime (kWh/kWc/an)
- Cache Redis (TTL 30 jours) pour eviter les appels repetes
- Fallback : estimation par latitude si API down

```
GET https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat={lat}&lon={lon}&peakpower=1&loss=14&outputformat=json
→ Retourne : E_y (kWh/kWc/an), H(i)_y (irradiation plan incline), T2m (temperature)
```

#### 2. Service de contraintes environnementales (`backend/app/services/constraints.py`) — NOUVEAU
- Integre les datasets data.gouv.fr (telechargement one-shot, stockage PostGIS) :
  - **Natura2000** (zones ZPS + ZSC) → `ST_Intersects(projet.geom, natura2000.geom)`
  - **ZNIEFF** (type I + II) → idem
  - **Parcs naturels** → idem
- Resultat par projet : liste de contraintes avec nom de zone + type + distance

#### 3. Endpoint d'enrichissement (`backend/app/routes/projects.py`)
- `POST /api/projets/{id}/enrich` — enrichit un projet (PVGIS + reseau + contraintes)
- `POST /api/projets/batch-enrich` — enrichit jusqu'a 20 projets (pattern batch existant)
- Stocke les donnees enrichies dans le champ `metadata` JSONB du modele Projet
- Retourne : donnees PVGIS + postes proches + contraintes environnementales

#### 4. Scoring ameliore avec donnees reelles (`backend/app/services/scoring.py`)
- **Irradiation** : remplace le proxy latitude par le GHI reel PVGIS
- **Environnement** : remplace le proxy departement par les intersections Natura2000/ZNIEFF reelles
- **Reseau** : utilise deja PostGIS ST_Distance (OK, pas de changement)
- Les 3 autres criteres restent inchanges pour l'instant

#### 5. UI — Carte d'enrichissement dans ProjectDetail (`frontend/src/pages/ProjectDetail.tsx`)
- Nouveau widget "Donnees site" dans l'onglet Overview :
  - Irradiation (GHI kWh/m2/an) avec icone soleil + couleur (vert > 1400, orange > 1200, rouge < 1200)
  - Productible estime (kWh/kWc/an)
  - Temperature moyenne
  - Contraintes environnementales (badges rouge/orange/vert)
  - Postes sources proches (top 3 avec distance + capacite)
- Bouton "Enrichir" sur la page Projects (a cote de "Score")

#### 6. UI — Bouton enrichissement batch dans Projects (`frontend/src/pages/Projects.tsx`)
- Bouton "Enrichir (N)" vert a cote du bouton "Score (N)" existant
- Meme pattern : checkboxes → selection → clic → batch-enrich → invalidation cache

### Fichiers a modifier/creer

| Action | Fichier | Detail |
|--------|---------|--------|
| CREER | `backend/app/services/pvgis.py` | Client HTTP PVGIS + cache Redis |
| CREER | `backend/app/services/constraints.py` | Requetes PostGIS Natura2000/ZNIEFF |
| MODIFIER | `backend/app/routes/projects.py` | Endpoints enrich + batch-enrich |
| MODIFIER | `backend/app/services/scoring.py` | Remplacer proxies par donnees reelles |
| MODIFIER | `backend/app/models.py` | Ajouter champ `enrichment_data` JSONB si pas deja dans metadata |
| MODIFIER | `frontend/src/pages/ProjectDetail.tsx` | Widget donnees site |
| MODIFIER | `frontend/src/pages/Projects.tsx` | Bouton enrichir batch |
| MODIFIER | `frontend/src/lib/i18n.ts` | Cles FR/EN enrichissement |
| CREER | `backend/tests/test_enrichment.py` | Tests enrichissement |
| CREER | `frontend/src/pages/Enrichment.test.ts` | Tests logique enrichissement UI |

### Donnees a importer (one-shot seed)

| Dataset | Source | Format | Taille | Stockage |
|---------|--------|--------|--------|----------|
| Natura2000 ZPS+ZSC | data.gouv.fr/INPN | GeoJSON | ~50 Mo | Table PostGIS `natura2000` |
| ZNIEFF I+II | data.gouv.fr/INPN | GeoJSON | ~80 Mo | Table PostGIS `znieff` |

Script de seed : `backend/app/seed/import_constraints.py`

### Tests

- **Backend** (~15 tests) : test_pvgis_service (mock API), test_constraints_intersect, test_enrich_endpoint, test_batch_enrich, test_scoring_with_real_data
- **Frontend** (~10 tests) : test_enrichment_card_display, test_constraint_badges, test_irradiation_color, test_batch_enrich_button

### Risques

| Risque | Mitigation |
|--------|-----------|
| API PVGIS lente/down | Cache Redis 30j + fallback latitude |
| Datasets Natura2000 trop gros (RAM) | Import par batch ogr2ogr, index GiST |
| Scoring change → tests cassent | Versionner les poids, garder l'ancien algo en fallback |

---

## Sprint 14 — Analyse reglementaire automatique (2-3 semaines)

### User Story
> "Quand je clique sur un projet, je vois immediatement quelles reglementations s'appliquent (PLU, ICPE, EIE), les documents a produire, et les delais estimes."

### Features
- **Service reglementaire** : croisement filiere + puissance + localisation → regles applicables
  - ICPE : obligatoire si puissance > 250 kWc (solaire) ou > 50 m hauteur (eolien)
  - EIE : obligatoire si > 300 kWc ou zone sensible
  - Autorisation environnementale : selon Natura2000/ZNIEFF intersection
- **Onglet "Reglementaire"** dans ProjectDetail : checklist auto-generee
- **Lien Knowledge Graph contextuel** : "Voir les normes qui s'appliquent a CE projet"
  - Filtre le graph par filiere + phase + contraintes detectees
- **Timeline estimee** : delais moyens par type d'autorisation (donnees DREAL)

### Fichiers cles
- CREER : `backend/app/services/regulatory.py`
- MODIFIER : `ProjectDetail.tsx` (nouvel onglet)
- MODIFIER : `knowledge.py` (filtrage contextuel par projet)

---

## Sprint 15 — Estimation financiere rapide + rapport IA (2-3 semaines)

### User Story
> "Pour chaque projet, je vois une estimation CAPEX/OPEX/LCOE basee sur les benchmarks du marche, et l'IA me genere un resume de faisabilite exportable."

### Features
- **Modele financier simplifie** (pas un business plan complet) :
  - CAPEX : benchmark par filiere x puissance (EUR/MWc installe)
  - OPEX : % du CAPEX annuel par filiere
  - Revenus : productible x prix marche (ou tarif CRE)
  - LCOE : CAPEX/production lifetime
  - TRI simplifie : (revenus - OPEX) / CAPEX
- **Widget financier** dans ProjectDetail
- **Rapport IA ameliore** : Claude recoit les donnees enrichies (PVGIS + contraintes + finance) → genere un vrai rapport de faisabilite structure
- **Export PDF** : generation cote backend (weasyprint ou reportlab)

### Fichiers cles
- CREER : `backend/app/services/financial.py`
- MODIFIER : `backend/app/services/ai.py` (prompt enrichi)
- CREER : `backend/app/services/report.py` (generation PDF)
- MODIFIER : `ProjectDetail.tsx` (onglet Finance + bouton Export)

---

## Sprint 16 — Veille intelligente + tableau de comparaison (2-3 semaines)

### User Story
> "Je compare mes 10 meilleurs sites cote-a-cote dans un tableau interactif, et je recois des alertes quand une reglementation change ou qu'un nouveau poste source est disponible."

### Features
- **Page Comparaison** (`/compare`) : tableau interactif de N projets selectionnes
  - Colonnes : score, productible, CAPEX, LCOE, contraintes, distance reseau
  - Tri par n'importe quelle colonne
  - Export Excel (xlsx)
- **Veille active** : polling des sources (Capareseau updates, MRAe nouvelles publications)
  - Notifications in-app quand une contrainte change pour un projet suivi
- **Dashboard ameliore** : widget "Alertes veille" + "Top 5 sites" avec mini-comparaison

### Fichiers cles
- CREER : `frontend/src/pages/Compare.tsx`
- MODIFIER : `Veille.tsx` (integration alertes)
- MODIFIER : `Dashboard.tsx` (widget alertes)
- CREER : `backend/app/services/watch.py` (polling sources)

---

## Resume de la roadmap

| Sprint | Theme | Impact utilisateur |
|--------|-------|-------------------|
| **13** | Enrichissement automatique (PVGIS + contraintes + scoring reel) | "Mes 20 sites sont enrichis en 2 minutes au lieu de 2 jours" |
| **14** | Analyse reglementaire auto + Knowledge Graph contextuel | "Je sais instantanement quelles autorisations demander" |
| **15** | Estimation financiere + rapport IA + export PDF | "J'ai un mini business case exportable pour mon investisseur" |
| **16** | Comparaison + veille intelligente | "Je compare 10 sites et je suis alerte des changements" |

**Apres Sprint 16** : Proxiam passe de "knowledge browser" a "screening platform".

---

## Verification (Sprint 13)

1. **Backend** : `cd backend && pytest -v` — tous les tests passent (anciens + 15 nouveaux)
2. **Frontend** : `cd frontend && npx vitest run` — tous les tests passent (anciens + 10 nouveaux)
3. **Test fonctionnel manuel** :
   - Creer un projet avec coordonnees (lat: 43.6, lon: 3.87 — Montpellier)
   - Appeler `POST /api/projets/{id}/enrich`
   - Verifier : GHI > 1500, productible > 1300 kWh/kWc, contraintes listees
   - Appeler `POST /api/projets/{id}/score` → le score irradiation utilise le GHI reel
   - Verifier dans ProjectDetail : widget "Donnees site" affiche
4. **Test batch** : importer 5 projets CSV → batch-enrich → batch-score → verifier coherence
5. **Test de regression** : les 362 tests existants passent toujours
