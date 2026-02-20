# Écosystème Complet Énergies Renouvelables

> Référentiel croisé SolarBrainOS + Nexus-Flow + Recherche externe
> Dernière MAJ : 2026-02-15

---

## Vue d'ensemble

| Source | Contenu |
|---|---|
| **SolarBrainOS** | 8 phases (P0→P7), 111 sous-phases, 80 compétences, 42 outils, 48 docs admin, risques, acteurs |
| **Nexus-Flow** | 11 équipes, profils métiers, inputs/outputs/livrables, 5 secteurs |
| **Recherche externe** | 120+ outils/APIs/MCP supplémentaires identifiés |

**Secteurs couverts** : Solaire (PV sol, toiture, AgriPV, FPV, spatial), Éolien (onshore, offshore, flottant), Stockage (BESS, hydrogène), Biogaz, Hybride

---

## 1. PROSPECTION & FAISABILITÉ (P0)

### Déjà dans SolarBrainOS
- QGIS, ArcGIS Pro, Géoportail, Google Earth Pro, Global Mapper (SIG)
- API Cadastre, INPN, Géorisques, Géoportail Urbanisme (APIs gratuites)
- KelFoncier, DVF, Cartofriches, CASIAS/GeoRisques (prospection foncière)
- 10 compétences : screening SIG, PLU, prospection foncière, risques naturels, Natura 2000, agrivoltaïsme...

### À ajouter (recherche externe)
| Outil | Description | API | Gratuit |
|---|---|---|---|
| **Glint Solar** | Sélection de sites PV/BESS par satellite + ML | Intégrations | Non |
| **Solargis Prospect** | 24+ couches météo/solaires, simulation PV rapide | API Solargis | Non |
| **Global Solar Atlas** | Cartes mondiales ressource solaire (World Bank) | GIS downloads | Oui (CC BY) |
| **Global Wind Atlas** | Cartes mondiales ressource vent 3km (DTU) | GIS downloads | Oui |
| **EPA RE-Powering Mapper** | 190K+ sites contaminés identifiés pour ENR (US) | Web | Oui |
| **LandGate** | Sélection de sites + valorisation foncière | Web | Non |
| **NASA POWER** | Données solaires/météo mondiales satellite (depuis 1981) | REST API | Oui |

---

## 2. ÉTUDES & DESIGN (P1)

### Déjà dans SolarBrainOS
- **Simulation solaire** : PVsyst, PVGIS, Helioscope, SAM (NREL), RatedPower, Homer, Energy Toolbase
- **Simulation éolien** : WindPRO, WAsP
- **CAD** : AutoCAD, Civil 3D, SketchUp, PVcase
- **Finance** : Excel, @Risk, Power BI
- 10 compétences ingénierie : PVsyst, câblage DC, Eurocodes, fondations, layout, modules, HTA, raccordement HTB, bilan carbone

### À ajouter (recherche externe)
| Outil | Description | API | Open Source |
|---|---|---|---|
| **pvlib-python** | Simulation PV en Python (irradiance, température, puissance) | pip install | Oui (BSD) |
| **PySAM** | Wrapper Python pour NREL SAM (PV, CSP, éolien, finance) | pip install | Oui |
| **windpowerlib** | Modélisation production éolienne en Python | pip install | Oui (MIT) |
| **Solcast API** | Irradiance solaire + prévisions PV (1-2km, DNV) | REST API | Non (gratuit chercheurs) |
| **SolarAnywhere API** | Données solaires TMY/historiques/prévisions | REST API | Non |
| **Open-Meteo** | Météo + radiation solaire + vent 120m gratuit (35j) | REST API sans clé | Oui (AGPLv3) |
| **NREL PVWatts API** | Estimation production PV raccordé réseau | REST API | Oui |
| **rdtools** | Analyse dégradation PV et perte de performance | pip install | Oui (NREL) |
| **pvanalytics** | Contrôle qualité automatisé des données PV | pip install | Oui (NREL) |

---

## 3. AUTORISATIONS & ADMINISTRATIF (P2)

### Déjà dans SolarBrainOS
- 9 documents bloquants : PC CERFA, EI, Avis MRAe, enquête publique, Loi sur l'Eau, CNPN, CDPENAF, AE, purge recours
- 8 compétences juridiques + 10 compétences environnement

### Déjà dans VeilleMarche
- Scraping 13 régions MRAe
- Matching intelligent multi-critères documents/projets
- 4847 postes sources + 105 projets ODRÉ
- API RTE Capareseau

### Outils externes pertinents
| Outil | Description | Pertinence |
|---|---|---|
| **ENTSO-E API** (`entsoe-py`) | Données réseau électrique européen (prix, production, flux) | Haute |
| **RTE Data API** | Données électricité France temps réel | Haute (déjà partiel dans VeilleMarche) |
| **Open Power System Data** | Données agrégées système électrique européen | Moyenne |

---

## 4. CLOSING & ACHATS (P3)

### Déjà dans SolarBrainOS
- 8 documents : BP financement, PPA/OA, EPC FIDIC, O&M, baux, PTF, assurances, financial close
- 4 compétences achats : modules/trackers, onduleurs, qualification fournisseurs, logistique import
- CRM : Salesforce, HubSpot, Pipedrive

### À ajouter (recherche externe)
| Outil | Description | API |
|---|---|---|
| **DOE REMPD** | Base données matériaux ENR par MW (origines, disponibilité) | Web (open source) |
| **IRENA Data** | Statistiques mondiales capacités ENR par pays | CSV downloads |
| **Enverus** | Analytics énergie SaaS (35K+ fournisseurs, coûts benchmark) | Lens Direct API |
| **Wood Mackenzie** | Intelligence de marché ENR et prévisions | API |

---

## 5. CONSTRUCTION (P4)

### Déjà dans SolarBrainOS
- 6 documents : PGCS, plans structures, plans électriques, DOE, test CONSUEL
- 9 compétences : VRD, EPC FIDIC, SPS, supervision, câblage, commissioning, thermographie drone, DOE, planning
- Outils : MS Project, Primavera P6

### À ajouter (recherche externe)
| Outil | Description | API |
|---|---|---|
| **Sitetracker** | Gestion projets ENR haut volume (solaire, éolien, BESS) | Oui |
| **Vitruvi** | Gestion chantier mobile + géospatial pour infra ENR | Oui |
| **Archdesk** | EPC software du devis à la livraison | Oui |
| **SolarGrade** | Gestion opérations terrain pour PV/stockage | Oui |

---

## 6. MISE EN SERVICE (P5)

### Déjà dans SolarBrainOS
- SCADA : IEC 60870-5-104, Fortinet OT, Nozomi Networks
- 5 compétences réseaux industriels : architecte SCADA, monitoring, cybersécurité OT, protocoles, intégration API

### À ajouter (recherche externe)
| Outil | Description | API |
|---|---|---|
| **Ingeteam INGESYS Smart SCADA** | Big Data + IoT + digital twin pour éolien/solaire/hydro | OPC-UA, Modbus |
| **Ignition Renewables SCADA** | Multi-sites, licences illimitées | REST, OPC-UA |
| **GreenPowerMonitor (DNV)** | GPM Horizon : monitoring global solaire/éolien/stockage | API |
| **Opoura OneView** | SCADA portfolio multi-marques/multi-types | API |

---

## 7. ASSET MANAGEMENT & EXPLOITATION (P6)

### Déjà dans SolarBrainOS
- **Monitoring** : Meteocontrol, SolarEdge, SMA Sunny Portal, Huawei FusionSolar, AlsoEnergy
- **GMAO** : Dimo Maint, CARL Source, Mobility Work, Praxedo
- 8 compétences performance : analyste PV, PR IEC 61724, maintenance préventive/corrective, APSAD D20, vérifications réglementaires, asset management, repowering
- Outils : Excel, Power BI, Python, GMAO

### À ajouter (recherche externe)
| Outil | Description | API | Spécialité |
|---|---|---|---|
| **Fluence Nispera** | APM + IA pour ENR et BESS | Oui | Prédictif |
| **Power Factors Unity** | EMS vendor-agnostic utility-scale | Oui | Multi-ENR |
| **Apollo Energy (AVEVA)** | CMS + CMMS + IA prédictive, fusion données OEM | MQTT/FTP/SCADA | Multi-marques |
| **Bazefield (Univers)** | Intelligence opérationnelle 150 GW mondial | Web/API | Fleets |
| **Clir Renewables** | IA production/santé/risque/financement éolien+solaire | Platform | IA |
| **UL Solutions RAMP** | Monitoring + analytics personnalisés | API | Utility-scale |

---

## 8. DRONES, ROBOTS & IA D'INSPECTION

### Déjà dans SolarBrainOS
- SK-CIV-007 : Thermographie Drone (IEC 62446-3, DJI, FLIR)

### À ajouter (recherche externe)
| Outil | Description | Spécialité |
|---|---|---|
| **SkyVisor** | Edge-AI drone pour solaire (thermique) et éolien (pales) — 18-20 turbines/jour | Éolien + Solaire |
| **MapperX** | IA temps réel analyse thermique drone, détection cellule (IEC 62446) | Solaire |
| **vHive** | Flotte multi-drones autonome + IA + digital twin | Solaire |
| **Scanifly** | Design solaire 3D par drone pour installateurs | Solaire toiture |

---

## 9. STOCKAGE BESS

### Déjà dans SolarBrainOS
- SK-RD-001 : Ingénieur Stockage BESS (Homer, Energy Toolbase)
- Outils : Homer Energy, Energy Toolbase

### À ajouter (recherche externe)
| Outil | Description | API |
|---|---|---|
| **FlexGen HybridOS** | EMS BESS hardware-agnostic, multi-source/multi-site | REST API |
| **Emerson Ovation Green** | Contrôle BESS automatisé charge/décharge | OPC-UA, Modbus |
| **GridBeyond + ABB** | Optimisation BESS par IA + accès marchés énergie | API |
| **Honeywell BESS Platform** | Plateforme tout-en-un stockage (lancée sept 2025) | Platform |
| **N3uron** | Middleware BESS monitoring (Modbus, OPC-UA, MQTT, REST) | REST, MQTT |

---

## 10. ÉOLIEN ONSHORE & OFFSHORE

### Déjà dans SolarBrainOS
- WindPRO, WAsP (simulation)
- SK-DES-003/004 : Eurocodes vent/neige

### À ajouter (recherche externe)
| Outil | Description | Open Source |
|---|---|---|
| **OpenFAST** | Simulation aéroélastique éolienne (terre, offshore fixe, flottant) | Oui (NREL) |
| **FAST.Farm** | Simulation ferme éolienne multi-turbines (sillages) | Oui (NREL) |
| **DNV Bladed** | Design éolien couplé onshore/offshore/flottant | Non |
| **Vind AI** | Planification projets éolien offshore par IA | Non |
| **MoorPy** | Design systèmes d'ancrage éolien flottant | Oui (NREL) |
| **Meteodyn** | CFD simulation vent onshore/offshore | Non |
| **WIND Toolkit** | 20 ans données vent offshore + continental US | Oui (NREL) |

---

## 11. STABILISATION RÉSEAU & VPP

### Déjà dans SolarBrainOS
- RTE éCO2mix API (production temps réel)
- Compétences réseaux industriels

### À ajouter (recherche externe)
| Outil | Description | Échelle |
|---|---|---|
| **Next Kraftwerke** | Plus grande VPP Europe (13.5 GW, Shell) | GW |
| **emsys VPP** | Pionnier VPP, contrôle temps réel GW-scale | GW |
| **Virtual Peaker** | VPP/DERMS SaaS | Commercial |
| **AutoGrid** | DERMS vendor-neutral (onduleurs, stockage, EV) | Commercial |
| **Enode** | API agrégation DER pour plateformes VPP | API |
| **OpenADR** | Standard ouvert demand response | Standard |

---

## 12. JUMEAUX NUMÉRIQUES

### Déjà dans SolarBrainOS
- Concept "Jumeau Numérique" = les 11 piliers eux-mêmes

### Plateformes externes
| Outil | Description | Cas d'usage |
|---|---|---|
| **NVIDIA Omniverse + PhysicsNeMo** | DT physiques fermes éoliennes, 4000x speedup CFD | Siemens Gamesa |
| **GE Vernova Digital** | DT éoliennes, maintenance prédictive | Éolien |
| **Enlitia** | DT utility-scale ENR | Multi-ENR |
| **Ingeteam INGESYS** | DT depuis données SCADA temps réel | Multi-ENR |

---

## 13. AGRIPV, FPV, PV SPATIAL

### Déjà dans SolarBrainOS
- SK-DEV-007 : Agrivoltaïsme Décret 2024-318 (couverture 40%, rendement 90%)

### Outils spécifiques
| Outil | Description | Maturité |
|---|---|---|
| **Glint Solar AgriPV** | Modélisation hauteur/espacement/azimut double usage | Commercial |
| **Feedgy Solar** | Monitoring et optimisation agrivoltaïque | Commercial |
| **Fraunhofer ISE "Zenit"** | Prévision rendement FPV selon design et environnement | Recherche |
| **MARIN DIFFRAC** | Simulation hydrodynamique pour FPV (amarrage) | Commercial |
| **Space Solar Cassiopeia** | SBSP 1.8km array, transmission wireless 360° | R&D |
| **Aetherflux** | Data centers orbitaux solaires (Q1 2027) | R&D |

---

## 14. REPOWERING & RECYCLAGE (P7)

### Déjà dans SolarBrainOS
- SK-PER-008 : Repowering Studies (analyse potentiel upgrade 15-20 ans)
- SK-JUR-008 : Démantèlement (garanties financières, décret 2021-1096)

### Outils externes
| Outil | Type | Description |
|---|---|---|
| **WindWISDEM** | Repowering | Repowering logiciel éolien sans remplacement composants |
| **PV Cycle** | Recyclage PV | Organisme européen recyclage PV (WEEE) |
| **SOLARCYCLE** | Recyclage PV | Extraction 95% valeur panneaux (silicium, CdTe) |
| **Redwood Materials** | Recyclage batteries | Recyclage direct Li-ion (Li, Ni, Co) |
| **Li-Cycle** | Recyclage batteries | Scaling recyclage direct |
| **Umicore** | Recyclage batteries | 7000 MT/an industriel (Cu, Co, Ni) |
| **Veolia / Carbon Rivers** | Recyclage éolien | Pyrolyse pales composites |

---

## 15. ACTUALITÉS & INTELLIGENCE MARCHÉ

| Outil | Description | API |
|---|---|---|
| **New Project Media** | News ENR temps réel, projets, financement/M&A | Abonnement |
| **RenewableUK EnergyPulse** | Données éolien/marine/stockage/hydrogène (500+ membres) | Abonnement |
| **Orennia** | Analytics géospatial + IA pour investissement ENR | Platform |
| **APITube Green Energy** | Flux actualités ENR temps réel pour intégration apps | REST API |
| **NewsAPI.ai** | API news IA avec filtre secteur énergie | REST API |

---

## 16. MCP SERVERS ÉNERGIE

| MCP Server | Données | Couverture | Open Source |
|---|---|---|---|
| **MCP Energy Hub** (karthikravva) | EIA API + SQLite, 8 outils | US | Oui |
| **EIA MCP Server** (zen-tradings) | Électricité, ventes, gaz US | US | Oui |
| **MCP Energy Server** (ebarros23) | Données EIA complètes | US | Oui |

**GAP MAJEUR identifié** : Aucun MCP serveur pour les données européennes (ENTSO-E, RTE). C'est une opportunité pour VeilleMarche.

---

## 17. PYTHON OPEN SOURCE ENR

| Librairie | Usage | License |
|---|---|---|
| **pvlib** | Simulation performance PV | BSD |
| **windpowerlib** | Modélisation production éolienne | MIT |
| **PyPSA** | Optimisation système électrique avec ENR | MIT |
| **pandapower** | Analyse réseaux distribution/transport | BSD |
| **oemof** | Framework modélisation énergie ouverte | MIT |
| **OpenFAST** | Simulation aéroélastique éoliennes | Apache 2.0 |
| **rdtools** | Dégradation et perte performance PV | NREL |
| **pvanalytics** | Contrôle qualité données PV | NREL |
| **entsoe-py** | Client Python ENTSO-E | MIT |
| **PySAM** | Wrapper SAM (PV, CSP, éolien, finance) | NREL |
| **feedinlib** | Calcul injection réseau ENR | MIT |
| **atlite** | Conversion données météo en série temporelle ENR | MIT |

**Repos curatés** :
- [awesome-energy-models](https://github.com/rebase-energy/awesome-energy-models)
- [awesome-sustainable-technology](https://github.com/OpenEnergyPlatform/awesome-sustainable-technology)
- [openpvtools](https://openpvtools.readthedocs.io/en/latest/tools.html)

---

## Statistiques

| Métrique | Valeur |
|---|---|
| Outils/APIs/MCP identifiés (total) | **160+** |
| Déjà dans SolarBrainOS | 42 outils + 80 compétences |
| Nouveaux identifiés | 120+ |
| MCP Servers énergie | 3 (tous US) |
| Librairies Python open source | 15+ |
| APIs gratuites données énergie | 8 (EIA, ENTSO-E, RTE, NREL, NASA POWER, Global Solar/Wind Atlas, Open-Meteo) |
