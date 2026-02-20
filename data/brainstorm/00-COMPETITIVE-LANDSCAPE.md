# 🏆 ANALYSE CONCURRENTIELLE — AetherNexus OS

> Cartographie des concurrents, positionnement stratégique et océans bleus identifiés. Daté du 17 février 2026.

---

## 1. Positionnement marché

**AetherNexus OS est le seul acteur visant le cycle complet P0→P7 dans un seul système.** Tous les concurrents sont positionnés sur 1-2 phases maximum. C'est à la fois une force (différenciation totale) et un risque (dispersion, complexité d'exécution).

---

## 2. Matrice concurrentielle détaillée

### 2.1 Simulation & Design (P1)

| Concurrent | Pays | Phase | Filière | Force | Faiblesse | Pricing | Taille |
|------------|------|-------|---------|-------|-----------|---------|--------|
| **PVsyst** | Suisse | P1 | PV | Standard industrie mondial, précision reconnue, bankable | Desktop only, pas de collaboration, UX datée, pas d'API | ~CHF 1,100-1,300/licence/an | Leader incontesté du marché PV mondial |
| **PVcase** | Lituanie | P1 | PV | Design 3D + AutoCAD/Civil3D, calepinage automatique | Pas de simulation énergétique propre (utilise PVsyst), jeune | €2,000-5,000/an | Croissance rapide |
| **Windpro** | Danemark (EMD) | P1 | Éolien | Standard éolien, 30+ ans d'historique, bruit, ombres | Desktop, cher, courbe d'apprentissage raide | €5,000-15,000/an | 70% du marché éolien EU |
| **openWind** | USA (UL) | P1 | Éolien | Intégré à l'écosystème UL/AWS Truepower, bankable | Moins répandu en Europe, interface complexe | Sur devis | Surtout USA/UK |
| **Homer Energy** | USA | P1 | Hybride | Microgrids, hybride PV+BESS+diesel, optimisation | Niche off-grid/microgrids, pas pour les grands parcs | €500-2,000/an | Niche |
| **Helioscope** | USA (Aurora) | P1 | PV | Web-based, rapide pour toiture, intuitif | Moins précis que PVsyst pour le sol, USA-centric | $175-500/mois | Surtout toiture USA |

### 2.2 Monitoring & Asset Management (P6)

| Concurrent | Pays | Phase | Filière | Force | Faiblesse | Pricing | Taille |
|------------|------|-------|---------|-------|-----------|---------|--------|
| **Greenbyte** (Power Factors) | Suède (racheté par Power Factors, USA, 2021) | P6 | Multi | Grande base installée, partie de Power Factors (>300 GW), plateforme Unity | Pas de P0-P5, en cours de fusion avec Drive (Power Factors) | €50-150/MW/an | >300 GW gérés (Power Factors combiné) |
| **3E (SynaptiQ)** | Belgique | P6 | Multi | Très technique, prévision irradiation propre, consulting, 25 ans d'expertise | Niche, pas de plateforme large | Sur devis | ~25 GW connectés (160 pays) |
| **Quintas Analytics** | Espagne (Séville, fondé 2008) | P6 | Multi | Gros portefeuilles, reporting investisseurs, due diligence | Consulting-heavy, pas de produit SaaS pur | Sur devis | ~10.4 GW gérés |
| **PowerHub** | Canada (Toronto, racheté par BayWa r.e. en 2019) | P6 | Multi | UX moderne, SaaS natif, API ouverte, fondé 2013 | Absorbé par BayWa r.e., profondeur technique moindre | €30-100/MW/an | ~15 GW gérés (20 pays) |
| **Clir Renewables** | Canada (Vancouver) | P6 | Éolien+PV | Analytics éolien avancé, ML pour optimisation de rendement, benchmarks 200+ GW | Peu présent en France, encore en phase de croissance | Sur devis | 200+ GW de données, ~13 GW contractés |
| **BaxEnergy** | Italie/Allemagne (racheté par Yokogawa en 2024) | P6 | Multi | Multi-filière, intégration SCADA, Yokogawa backing, fondé 2010 | UX vieillissante, lourd, intégration Yokogawa en cours | Sur devis | >140 GW monitorés (40 pays) |
| **Kaiserwetter** (Ampero/BayWa r.e.) | Allemagne (rejoint BayWa r.e. en 2021) | P6 | Multi | Digital asset management, IA, plateforme Aristoteles (renommée Ampero) | Petite taille (~470 MW), opérations vendues à WPO | Sur devis | ~470 MW gérés (avant cession) |
| **Raptor Maps** | USA | P4/P6 | PV | Inspection drone + IA, détection de défauts, leader PV | Mono-fonctionnel (inspection), pas d'asset mgmt | Pay-per-MW | ~193 GWdc inspectés (2025) |

### 2.3 Inspection & Drones (P4/P6)

| Concurrent | Pays | Phase | Filière | Force | Faiblesse | Pricing |
|------------|------|-------|---------|-------|-----------|---------|
| **Raptor Maps** | USA | P4/P6 | PV | Leader mondial inspection PV par drone, IA de détection, ~193 GWdc analysés | PV only, pas de plateforme complète | Per-MW |
| **SkySpecs** | USA | P4/P6 | Éolien | Leader inspection éolien (pales), drones autonomes | Éolien only | Per-turbine |
| **Sitemark** | Belgique | P4/P6 | PV | Cartographie drone haute résolution, analyse thermique | Petit, niche | Per-MW |
| **Above Surveying** | Irlande | P4/P6 | PV | Inspection + analyse complète, bankable reports | Petit | Per-project |
| **Perceptual Robotics** | UK | P4/P6 | Éolien | IA embarquée pour détection fissures pales | Startup, niche | Per-turbine |

### 2.4 Trading & Agrégation

| Concurrent | Pays | Phase | Filière | Force | Faiblesse | Pricing |
|------------|------|-------|---------|-------|-----------|---------|
| **Next Kraftwerke** | Allemagne (Shell, racheté 2021) | VPP | Multi | Un des plus grands VPP européens, >10 GW agrégés (13 000+ unités), trading avancé | Pas de gestion de cycle de vie, pure trading | Revenue share |
| **Statkraft** | Norvège | Agrégation | Multi | Leader agrégation EU, >20 GW, PPA structurés | Concurrent direct des producteurs, pas de logiciel | Revenue share |
| **Flexitricity** | UK (Drax Group, acquis 2024 pour £42M) | Demand Response | Multi | Effacement, flexibilité, UK leader | Pas de production ENR | Per-MW |

### 2.5 Spécialistes niches

| Concurrent | Pays | Phase | Filière | Force | Faiblesse | Pricing |
|------------|------|-------|---------|-------|-----------|---------|
| **Innosea** | France | P1 | Offshore | Ingénierie offshore, flottant, hydrodynamique | Consulting, pas de logiciel | Sur devis |
| **Epure** | France | P2 | Multi | Expert MRAe, réglementaire, études d'impact | Petit, consulting | Sur devis |
| **Hinicio** | Belgique | P0 | H2 | Stratégie hydrogène, conseil, études de marché | Pas de logiciel | Sur devis |
| **Solen/Reuniwatt** | France | P6 | PV | Prévision de production solaire, nowcasting | Mono-fonctionnel | Per-MW |

---

## 3. Carte de positionnement

```
Profondeur technique ↑
                     │
                     │  PVsyst ●        Windpro ●
                     │      3E ●    Clir ●
                     │  Raptor Maps ●
            DEEP     │               Greenbyte/Power Factors ●
                     │  SkySpecs ●
                     │                    BaxEnergy ●
                     │  Homer ●     PowerHub ●
                     │                         Quintas ●
                     │  Helioscope ●
                     │              Kaiserwetter ●
           SHALLOW   │
                     │
                     └──────────────────────────────────→
                     NARROW (1-2 phases)    WIDE (3+ phases)

                                    ★ AetherNexus OS
                              (cible : WIDE + DEEP)
```

**Constat** : Tous les concurrents sont dans le quadrant NARROW. AetherNexus vise le quadrant WIDE + DEEP qui est actuellement **vide**. Le risque est de finir WIDE + SHALLOW au lieu de WIDE + DEEP. Note : Kaiserwetter (~470 MW) a tenté le positionnement WIDE mais avec une profondeur insuffisante, et a fini par se faire absorber par BayWa r.e.

---

## 4. Océans bleus identifiés

### 4.1 P0 — Prospection avec data (AUCUN concurrent logiciel)
Les développeurs font leur prospection dans Excel + QGIS manuellement. Il n'existe aucun SaaS de scoring automatique de sites ENR croisant 50+ couches SIG. **VeilleMarche a une avance significative** avec 4847 postes sources, scraping MRAe et analyse IA de documents.

### 4.2 P7 — Démantèlement / Recyclage (AUCUN concurrent)
Les premières grandes centrales PV (2010-2012) arrivent en fin de tarif d'achat. 30 000 à 50 000 tonnes de panneaux à recycler/an d'ici 2030 en France (estimation Soren/ADEME). Personne n'a d'outil structuré pour gérer le démantèlement, la traçabilité DEEE, le repowering.

### 4.3 Matrice croisée 6 dimensions (AUCUN concurrent)
Aucun outil ne lie les phases aux livrables, normes, risques, sources et outils dans une structure interrogeable. C'est le cœur de la promesse AetherNexus.

### 4.4 Multi-filière dans un seul outil (QUASI-AUCUN concurrent)
Power Factors (Greenbyte) et BaxEnergy (Yokogawa) font du multi-filière en monitoring (P6) mais personne ne le fait en développement (P0-P2). Un développeur qui fait du PV sol, de l'AgriPV et de l'éolien doit utiliser 3 outils de simulation différents.

---

## 5. Barrières à l'entrée (moat)

### 5.1 Données propriétaires VeilleMarche
- 4847 postes sources avec capacités résiduelles
- Scraping automatisé de 13 régions MRAe
- Analyse IA de documents réglementaires
- Historique de données difficilement reproductible

### 5.2 Base de connaissances structurée
- 5350+ éléments (phases, livrables, normes, risques, sources, outils)
- Matrice de croisement entre les 6 dimensions
- Expertise réglementaire française profonde (Code de l'urbanisme, ICPE, S3REnR, CDPENAF, Décret AgriPV)

### 5.3 Connaissance du terrain français
- Réglementation spécifique (MRAe, ABF, DREAL, CDPENAF, Loi APER 2023)
- Réseau électrique français (Enedis/RTE, quote-part S3REnR)
- Culture de concertation et d'acceptabilité sociale

### 5.4 Effet réseau potentiel (H2+)
- Plus il y a d'utilisateurs, plus les données de scoring sont précises
- Marketplace de prestataires : valeur croît avec le nombre de participants
- Benchmarking portefeuille : nécessite une masse critique de centrales

---

## 6. Menaces concurrentielles

| Menace | Probabilité | Impact | Mitigation |
|--------|------------|--------|-----------|
| Power Factors étend Greenbyte/Unity vers P0-P2 | Moyenne | Élevé | Aller plus vite, ancrage France |
| PVsyst lance un mode cloud/collaboratif | Faible | Moyen | Couvrir plus large que la simulation |
| Un GAFAM lance un outil ENR (Google/Microsoft) | Faible | Très élevé | Spécialisation métier profonde |
| Un EPC majeur développe en interne | Moyenne | Moyen | Proposition de valeur SaaS supérieure |
| Consolidation du marché (rachats) | Élevée | Variable | Se positionner comme cible d'acquisition attractive |
| Open source community build un équivalent | Faible | Moyen | Données propriétaires + UX supérieure |

---

## 7. Sources et vérifications

> Toutes les données concurrentielles ont été vérifiées par recherche web le 17 février 2026.

### Acquisitions et restructurations
| Concurrent | Acquéreur réel | Année | Source |
|------------|---------------|-------|--------|
| Greenbyte (Suède) | Power Factors (USA) | 2021 | [Power Factors & Greenbyte Combine](https://www.powerfactors.com/news/power-factors-greenbyte-combine-form-market-leader) |
| BaxEnergy (Italie/Allemagne) | Yokogawa (Japon) | 2024 | [Yokogawa Acquires BaxEnergy](https://www.yokogawa.com/news/press-releases/2024/2024-06-05/) |
| Kaiserwetter (Allemagne) | BayWa r.e. (2021), opérations cédées à WPO | 2021 | [WPO acquires Kaiserwetter operations](https://www.renewable-energy-industry.com/news/press-releases/pm-6960-wpo-acquires-kaiserwetters-german-danish-and-spanish-asset-management-operations) |
| PowerHub (Canada) | BayWa r.e. (Allemagne) | 2019 | [BayWa r.e. acquires PowerHub](https://www.baywa-re.com/en/news/details/baywa-re-acquires-powerhub) |
| Next Kraftwerke (Allemagne) | Shell | 2021 | [Shell acquires Next Kraftwerke](https://www.energy-storage.news/shell-expands-role-in-vpp-market-with-acquisition-of-german-operator-next-kraftwerke/) |

### Chiffres de portefeuille vérifiés
| Concurrent | Chiffre vérifié | Source |
|------------|----------------|--------|
| Power Factors (Greenbyte) | >300 GW gérés, 600+ clients, 18 000 sites | [Power Factors Unity Platform Launch (Oct 2024)](https://www.globenewswire.com/news-release/2024/10/10/2961359/0/en/Power-Factors-Launches-Next-Generation-AI-Powered-Asset-Performance-Management-Application-on-Unity-Platform.html) |
| 3E SynaptiQ | ~25 GW connectés dans 160 pays | [3E SynaptiQ US expansion (2024)](https://www.3e.eu/resources/news/synaptiq-by-3e-us-renewable-energy-operations-smarter-asset-performance-management) |
| Quintas Energy | ~10.4 GW gérés (ESG Report 2024) | [Quintas Energy ESG Report 2024](https://www.quintasenergy.com/hubfs/1.%20New%20Assets/Downloads/SHEQ/Quintas%20Energy%20-%20ESG%20Report%202024.pdf) |
| BaxEnergy | >140 GW monitorés dans 40 pays | [Yokogawa acquisition press release](https://www.yokogawa.com/news/press-releases/2024/2024-06-05/) |
| Kaiserwetter | ~470 MW (avant cession à WPO) | [Kaiserwetter Executive Summary](https://kaiserwetter.energy/en/company/executive-summary) |
| Raptor Maps | ~193 GWdc analysés (Global Solar Report 2025) | [Raptor Maps 2025 Global Solar Report](https://raptormaps.com/resources/2025-global-solar-report) |
| Clir Renewables | 200+ GW de données de benchmarking | [Clir Renewables Portfolio](https://www.clir.eco/clir-portfolio) |
| PowerHub (BayWa r.e.) | ~15 GW gérés dans 20 pays | [BayWa r.e. acquires PowerHub (2019)](https://www.prnewswire.com/news-releases/baywa-re-acquires-powerhub-to-accelerate-digital-transformation-of-the-industry-300910031.html) |
| Next Kraftwerke | >10 GW agrégés (>13 000 unités) | [Next Kraftwerke 10 000 MW milestone](https://www.next-kraftwerke.com/news/10000-megawatt-of-aggregated-capacity) |

### Pricing vérifié
| Concurrent | Prix vérifié | Source |
|------------|-------------|--------|
| PVsyst | CHF 1,100-1,300/licence/an (professionnel) | [PVsyst Shop](https://www.pvsyst.com/shop-prices/) |

### Pays d'origine vérifiés
| Concurrent | Pays vérifié | Détail |
|------------|-------------|--------|
| Greenbyte | Suède (Gothenburg) | Fondé 2010 par Jonas Corne |
| BaxEnergy | Italie (Acireale) / Allemagne (Hannover) | Fondé 2010, double siège |
| Quintas Energy | Espagne (Séville) | Fondé 2008, Andalousie |
| PowerHub | Canada (Toronto) | Fondé 2013, racheté BayWa r.e. 2019 |
| 3E | Belgique (Bruxelles) | Fondé ~2000, 25 ans d'expertise |
| Clir Renewables | Canada (Vancouver) | Fondé ~2017 |

### Erreurs corrigées dans cette version
| Donnée erronée | Correction | Impact |
|----------------|-----------|--------|
| Greenbyte racheté par DNV | Racheté par **Power Factors** (USA) en 2021 | Erreur d'acquéreur |
| BaxEnergy racheté par Atos | Racheté par **Yokogawa** (Japon) en 2024 | Erreur d'acquéreur |
| Kaiserwetter ~5 GW | ~**470 MW** (10x moins) | Chiffre gonflé x10 |
| PowerHub allemand | **Canadien** (Toronto) | Erreur de pays |
| Quintas irlandais, >50 GW | **Espagnol** (Séville), ~**10.4 GW** | Erreur pays + chiffre x5 |
| 3E SynaptiQ ~15 GW | ~**25 GW** connectés | Sous-estimé |
| PVsyst ~EUR 1,500 | ~**CHF 1,100-1,300** | Mauvaise devise et montant |
| Raptor Maps ~100 GW | ~**193 GWdc** | Sous-estimé |
| Clir Renewables ~20 GW | **200+ GW** données, ~13 GW contractés | Sous-estimé (données vs contrats) |
| Next Kraftwerke >15 GW | **>10 GW** agrégés | Sur-estimé |
