# DIMENSION : JUMEAUX NUMERIQUES (Digital Twins)

> Replication numerique complete du cycle de vie d'un actif ENR, du territoire brut au demantelement.

---

## Vue d'ensemble

Le jumeau numerique est une replique virtuelle d'un actif physique, alimentee en temps reel par des donnees capteurs, meteo, SCADA et satellites. Dans le secteur ENR, il couvre l'integralite du cycle de vie : prospection territoriale, conception, construction, exploitation et demantelement.

**Proposition de valeur pour AetherNexus OS** : offrir un continuum numerique ou chaque phase alimente la suivante, sans rupture de donnees ni ressaisie.

---

## P0 — Jumeau du territoire

### Objectif
Creer une replique 3D fidele du territoire avant toute implantation, pour simuler visuellement et techniquement la faisabilite d'un projet.

### Composantes

- **Modelisation 3D du terrain**
  - MNT (Modele Numerique de Terrain) haute resolution via LiDAR aerien ou drone
  - Photogrammetrie par drone pour texture realiste
  - Integration des donnees IGN (BD TOPO, BD ALTI, RGE ALTI)
  - Resolution cible : 1m pour eolien, 25cm pour solaire au sol

- **Simulation des ombres et masques**
  - Calcul du masque lointain (horizon topographique) sur 360 degres
  - Simulation ombres portees heure par heure sur l'annee (trajectoire solaire)
  - Detection automatique des masques proches (arbres, batiments, pylones)
  - Impact sur le productible : cartographie des zones d'ombrage critique

- **Simulation visuelle d'integration paysagere**
  - Photomontages automatises depuis les points de vue sensibles
  - Zone d'influence visuelle (ZVI) calculee sur le MNT
  - Rendu realiste avec conditions meteo variables (brume, neige, soleil rasant)
  - Supports pour enquete publique et concertation

- **Analyse environnementale spatiale**
  - Superposition ZNIEFF, Natura 2000, zones humides, corridors ecologiques
  - Buffer automatique autour des habitations (500m eolien, variable solaire)
  - Carte de contraintes multi-couches avec scoring de faisabilite

### Outils et technologies
- **Logiciels** : QGIS + plugin 3D, Google Earth Engine, Cesium Ion, Mapbox GL
- **Donnees** : IGN Geoplateforme, Copernicus DEM, SRTM, cadastre DGFiP
- **Rendu** : Unreal Engine 5 (Nanite/Lumen), Unity HDRP, Blender GIS

---

## P1 — Jumeau de conception

### Objectif
Simuler et optimiser la conception technique du parc avant construction, en integrant BIM, productible et contraintes reglementaires.

### Composantes

- **Layout optimization**
  - Placement automatise des eoliennes ou tables PV sur le terrain 3D
  - Algorithmes genetiques pour maximiser le productible sous contraintes
  - Prise en compte des effets de sillage (wake effect) inter-eoliennes
  - Optimisation du cablage interne (tranchees, longueurs, pertes)
  - Respect automatique des reculs reglementaires

- **Simulation productible 3D**
  - Modele solaire : irradiance sur chaque module en tenant compte de l'inclinaison, orientation, ombrage, soiling, temperature
  - Modele eolien : distribution de vent a hauteur de moyeu, courbe de puissance, disponibilite
  - Donnees meteo : historique 20 ans (Meteodyn, Vortex, ERA5), TMY (Typical Meteorological Year)
  - Calcul P50/P75/P90 pour le financement

- **BIM (Building Information Modeling)**
  - Maquette numerique IFC des installations (poste de livraison, fondations, cablage)
  - Coordination multi-lots : genie civil, electrique, voirie
  - Detection de clashs automatique entre corps de metier
  - Export vers les outils de construction (plans d'execution, nomenclatures)

- **Simulation electrique**
  - Schema unifilaire numerique complet
  - Calcul des chutes de tension, courants de court-circuit
  - Dimensionnement onduleurs, transformateurs, protections
  - Simulation du raccordement au poste source (etude Enedis/RTE)

### Outils et technologies
- **Solaire** : PVsyst, PVcase, pvDesign (RatedPower), Helioscope
- **Eolien** : WindPRO, WAsP, OpenWind, Meteodyn WT
- **BIM** : Autodesk Revit, Bentley OpenBuildings, Tekla Structures
- **Electrique** : ETAP, DIgSILENT PowerFactory, Caneco

---

## P3 — Jumeau de chantier (BIM 4D/5D)

### Objectif
Suivre la construction en temps reel, detecter les ecarts entre le prevu et le realise, et piloter les couts.

### Composantes

- **BIM 4D — Integration du planning**
  - Association de chaque element BIM a une tache du planning (MS Project, Primavera)
  - Visualisation 3D de l'avancement par semaine ou par jalon
  - Detection automatique des retards par comparaison planning prevu vs realise
  - Simulation de scenarios de rattrapage

- **BIM 5D — Integration des couts**
  - Chaque element BIM porte son cout unitaire et ses quantites
  - Suivi budgetaire en temps reel par lot et par poste
  - Alerte sur depassements de budget par rapport au previsionnel
  - Courbe en S automatique (avancement physique vs financier)

- **Suivi par drone et photogrammetrie**
  - Survol drone hebdomadaire ou bi-hebdomadaire du chantier
  - Reconstruction 3D du chantier (point cloud) comparee au BIM de reference
  - Detection automatique des ecarts geometriques (fondations, structures, cablage)
  - Rapport photographique georefence automatise

- **IoT chantier**
  - Capteurs sur les engins (GPS, heures de fonctionnement)
  - Capteurs meteorologiques pour arrets chantier
  - Badges de presence pour suivi des effectifs
  - Capteurs de vibration sur fondations pendant battage/forage

### Outils et technologies
- **BIM 4D/5D** : Synchro Pro (Bentley), Navisworks (Autodesk), Fuzor
- **Drone** : DJI Terra, Pix4D, DroneDeploy, Propeller Aero
- **Gestion chantier** : Procore, Finalcad, BIM 360 Field

---

## P6 — Jumeau d'exploitation

### Objectif
Replique temps reel du parc en operation pour maximiser la performance, detecter les anomalies et simuler des scenarios.

### Composantes

- **Replique temps reel**
  - Ingestion continue des donnees SCADA (production, alarmes, etats)
  - Donnees meteo en temps reel (irradiance, vent, temperature)
  - Visualisation 3D du parc avec code couleur par performance
  - Dashboard temps reel accessible depuis navigateur ou tablette terrain

- **Detection d'anomalies par IA**
  - Comparaison production reelle vs production attendue (modele digital twin)
  - Detection de degradation progressive (soiling, PID, delamination, usure roulements)
  - Alertes predictives avant defaillance (remaining useful life)
  - Classification automatique des types de pannes

- **Simulation de scenarios**
  - Impact d'un remplacement d'onduleur sur le productible annuel
  - Simulation de repowering partiel (nouveaux modules, nouvelles eoliennes)
  - Effet d'un changement de strategie de nettoyage
  - Simulation financiere : impact sur le business plan a horizon 5/10/20 ans

- **Optimisation continue**
  - Reglage dynamique des angles de tracking (solaire)
  - Curtailment intelligent (bridage eolien pour bruit, faune, reseau)
  - Pilotage du stockage BESS couple au jumeau
  - Recommandations automatisees de maintenance

### Outils et technologies
- **Plateformes** : NVIDIA Omniverse, Azure Digital Twins, AWS IoT TwinMaker
- **SCADA** : Greenbyte (Powerfactors), Bazefield (DNV), QOS Energy, Meteocontrol
- **IA** : TensorFlow, PyTorch, scikit-learn, modeles de series temporelles (Prophet, LSTM)

---

## P7 — Jumeau de demantelement

### Objectif
Planifier le demantelement en s'appuyant sur le jumeau accumule pendant toute la vie du parc.

### Composantes

- **Inventaire des materiaux**
  - Quantification automatique a partir du BIM : acier, beton, cuivre, silicium, fibres composites
  - Etat de degradation estime par le jumeau d'exploitation
  - Classification par filiere de recyclage (DEEE, metaux, inertes, dangereux)
  - Estimation des couts de traitement par filiere

- **Planification du demontage**
  - Sequencement optimal des operations (depose panneaux, depose structures, arrachage cables, demolition fondations)
  - Simulation des engins necessaires (grues, pelleteuses) et des acces
  - Planning previsionnel avec jalons reglementaires
  - Estimation de la duree totale par analogie avec des chantiers similaires

- **Simulation de remise en etat**
  - Modelisation 3D de l'etat final du site apres remise en etat
  - Scenarios : remise en etat agricole, reboisement, repowering
  - Estimation des couts de remise en etat vs provisions ICPE

### Standards et normes
- Arrete du 26 aout 2011 modifie (ICPE eoliennes) : obligations de demantelement
- Arrete du 9 avril 2024 (PV au sol) : obligations de remise en etat
- Garanties financieres de demantelement (~50 000 EUR/MW eolien — approximation courante, le montant exact est calculé selon une formule dépendant de la puissance et de la hauteur de moyeu, indexée annuellement)

---

## Standards applicables aux jumeaux numeriques

| Standard | Perimetre |
|----------|-----------|
| **ISO/IEC 30173:2023** | Digital Twin — Concepts and Terminology (norme de référence directe pour les jumeaux numériques) |
| **ISO 23247** | Framework pour les jumeaux numériques dans le *manufacturing* spécifiquement (application aux ENR indirecte) |
| **IEC 62832** | Modele de donnees pour l'industrie (Digital Factory) |
| **ISO 19650** | Gestion de l'information BIM sur le cycle de vie |
| **IFC 4.3** | Format d'echange BIM ouvert (buildingSMART) |
| **CityGML** | Modelisation 3D urbaine et territoriale |
| **OGC SensorThings** | API standard pour donnees capteurs IoT |

---

## Plateformes technologiques

### NVIDIA Omniverse
- Plateforme de simulation 3D temps reel basee sur USD (Universal Scene Description)
- Rendu physiquement realiste (RTX ray tracing)
- Collaboration multi-utilisateurs sur la meme scene
- Integration IA (Isaac Sim, Metropolis) pour robotique et vision

### Bentley iTwin
- Plateforme dediee infrastructure et energie
- Integration native BIM (iModel)
- Visualisation 4D du chantier
- APIs ouvertes pour integration dans un ecosysteme plateforme

### Azure Digital Twins
- Service cloud Microsoft pour graphe de jumeaux
- Langage de requete DTDL (Digital Twins Definition Language)
- Integration native IoT Hub, Time Series Insights, Power BI
- Scalabilite cloud pour des milliers d'actifs

### Siemens Xcelerator
- Plateforme industrielle complete (conception, simulation, exploitation)
- Integration Teamcenter (PLM) + MindSphere (IoT)
- Forte presence dans le secteur eolien (Siemens Gamesa)

---

## Integration dans AetherNexus OS

### Vision
Le jumeau numerique est le **noyau central** de la plateforme. Chaque module (prospection, financement, construction, exploitation) alimente et consomme les donnees du jumeau.

### Architecture proposee
```
[Donnees terrain] --> [Jumeau P0: Territoire]
        |
        v
[Conception] --> [Jumeau P1: Design] --> [Export BIM]
        |
        v
[Construction] --> [Jumeau P3: Chantier] --> [Suivi 4D/5D]
        |
        v
[SCADA + IoT] --> [Jumeau P6: Exploitation] --> [IA predictive]
        |
        v
[Fin de vie] --> [Jumeau P7: Demantelement] --> [Inventaire materiaux]
```

### Donnees echangees entre phases
- P0 vers P1 : MNT, masques, contraintes environnementales
- P1 vers P3 : maquette BIM, nomenclatures, plans
- P3 vers P6 : BIM as-built, donnees de reception, baseline performance
- P6 vers P7 : historique de degradation, inventaire actualise, etat reel des composants

### APIs et connecteurs necessaires
- Import/export IFC (BIM)
- Connecteur SCADA (Modbus TCP, OPC-UA, MQTT)
- API meteo (Open-Meteo, Solcast, Meteomatics)
- API cartographiques (IGN, Copernicus, Sentinel)
- Connecteur drone (DJI FlightHub, Pix4D Cloud)

---

## Indicateurs cles (KPIs)

| KPI | Phase | Cible |
|-----|-------|-------|
| Precision du MNT | P0 | < 1m vertical |
| Ecart productible simule vs reel | P1 vs P6 | < 5% sur 3 ans |
| Taux de detection des ecarts chantier | P3 | > 90% |
| Temps de detection anomalie | P6 | < 1 heure |
| Precision inventaire materiaux | P7 | > 95% en masse |

---

## Risques et limites

- **Cout d'implementation** : un jumeau complet represente un investissement significatif (estimation marché : 100-500 kEUR pour un parc moyen, très variable selon le scope et la complexité — non sourcé, à adapter au cas par cas)
- **Qualite des donnees** : le jumeau vaut ce que valent ses donnees d'entree (garbage in, garbage out)
- **Competences** : peu de profils maitrisent a la fois le BIM, l'IoT et l'IA
- **Interoperabilite** : les formats proprietaires freinent l'integration entre outils
- **Cybersecurite** : le jumeau contient des donnees sensibles sur les actifs (topologie, vulnerabilites)

---

## Feuille de route d'implementation

1. **MVP** : Jumeau P6 simplifie (dashboard 3D + donnees SCADA temps reel)
2. **V1** : Ajout P0 (terrain 3D) et P1 (layout optimization)
3. **V2** : Integration BIM 4D/5D pour le chantier (P3)
4. **V3** : Jumeau complet avec continuum P0-P7 et IA predictive
