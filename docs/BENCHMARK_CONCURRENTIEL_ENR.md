# Benchmark Concurrentiel -- Proxiam OS ENR

**Date** : 21 fevrier 2026
**Auteur** : Analyse automatisee Claude Code
**Objectif** : Positionner Proxiam dans l'ecosysteme logiciel des energies renouvelables

---

## Table des matieres

1. [Resume executif](#1-resume-executif)
2. [Categorie 1 -- Logiciels de conception et simulation ENR](#2-categorie-1--logiciels-de-conception-et-simulation-enr)
3. [Categorie 2 -- Gestion d'actifs et management de projets ENR](#3-categorie-2--gestion-dactifs-et-management-de-projets-enr)
4. [Categorie 3 -- Outils GIS et donnees meteorologiques](#4-categorie-3--outils-gis-et-donnees-meteorologiques)
5. [Categorie 4 -- Outils specifiques France](#5-categorie-4--outils-specifiques-france)
6. [Categorie 5 -- Plateformes d'intelligence et knowledge management](#6-categorie-5--plateformes-dintelligence-et-knowledge-management)
7. [Matrice comparative synthetique](#7-matrice-comparative-synthetique)
8. [Positionnement unique de Proxiam](#8-positionnement-unique-de-proxiam)
9. [Analyse SWOT Proxiam](#9-analyse-swot-proxiam)
10. [Conclusion et recommandations strategiques](#10-conclusion-et-recommandations-strategiques)

---

## 1. Resume executif

Le marche des logiciels ENR est **fortement fragmente**. Aucun acteur ne couvre l'ensemble de la chaine de valeur du developpement de projets renouvelables en France. Les professionnels doivent jongler entre :

- **5 a 10 outils** pour la conception, la simulation, le GIS, la reglementation, la gestion de projet
- **Des donnees eparpillees** sur des portails publics (ODRE, Capareseau, eCO2mix, ADEME)
- **Aucune base de connaissances structuree** reliant normes, risques, livrables, competences et outils

**Proxiam se positionne comme le premier OS de connaissance integre pour les professionnels ENR en France**, combinant SIG + Knowledge Graph 6D + 3D + IA dans une plateforme unifiee.

---

## 2. Categorie 1 -- Logiciels de conception et simulation ENR

### 2.1 PVsyst

| Critere | Detail |
|---------|--------|
| **Editeur** | PVsyst SA (Suisse) |
| **Ce qu'il fait** | Simulation photovoltaique de reference. Modelisation energetique (grid-connected, standalone, pompage), analyse d'ombrage, simulation bifaciale, trackers, evaluation economique (CAPEX, OPEX, LCOE, NPV, ROI). Base de donnees meteorologiques integree (Meteonorm 8.2, PVGIS-TMY, Solcast, SolarGIS). |
| **Tarification** | ~600 CHF/an (~560 EUR/an) par licence |
| **Cible** | Ingenieurs PV, bureaux d'etudes, developpeurs solaires |
| **Limites** | Solaire uniquement. Pas de GIS integre. Pas de gestion de projet ni de base de connaissances reglementaires. Interface desktop Windows. Courbe d'apprentissage elevee. |
| **Ce que Proxiam apporte en plus** | Couverture multi-filiere (solaire + eolien + BESS). Knowledge Graph reliant la simulation au cadre reglementaire. Cartographie SIG des postes sources et de l'infrastructure reseau. Interface web moderne. |

### 2.2 Aurora Solar

| Critere | Detail |
|---------|--------|
| **Editeur** | Aurora Solar Inc. (USA) |
| **Ce qu'il fait** | Plateforme cloud end-to-end pour installateurs solaires : modelisation 3D avec detection IA des toitures, ombrage 8760h, conception automatisee des panneaux, design electrique, analyse financiere, generation de propositions commerciales avec e-signature. |
| **Tarification** | Basic 159 $/mois/user, Premium 259 $/mois/user, Enterprise sur devis |
| **Cible** | Installateurs solaires residentiels et petits C&I |
| **Limites** | Focalise USA. Pas de conformite reglementaire francaise. Pas de knowledge base structuree. Pas d'eolien ni BESS. Cher pour les petites structures. |
| **Ce que Proxiam apporte en plus** | Focus marche francais et reglementation locale. Multi-filiere. Base de connaissances 6D (normes, risques, livrables). Scoring de sites avec donnees Capareseau. |

### 2.3 HOMER Energy (UL Solutions)

| Critere | Detail |
|---------|--------|
| **Editeur** | UL Solutions / NREL (USA) |
| **Ce qu'il fait** | Optimisation de microgrids hybrides. Simulation multi-sources (solaire, eolien, diesel, hydro, stockage). Analyse de sensibilite, optimisation cout/energie, calcul LCOE. HOMER Pro (microgrids), HOMER Grid (behind-the-meter), HOMER Front (utility-scale stockage). |
| **Tarification** | Essai gratuit 21 jours, licences annuelles (prix sur demande, estimes ~3000-5000 $/an) |
| **Cible** | Concepteurs de microgrids, ingenieurs systemes hybrides, 250 000+ utilisateurs dans 190+ pays |
| **Limites** | Focalise optimisation energetique, pas de GIS avance ni cartographie. Pas de gestion de projet, pas de reglementation francaise. Interface technique, pas pensee pour le developpement de projets. |
| **Ce que Proxiam apporte en plus** | Vision projet complete (pas seulement simulation). GIS + postes sources + infrastructure reseau. Cadre reglementaire francais integre. IA pour l'analyse documentaire. |

### 2.4 HelioScope (Aurora Solar)

| Critere | Detail |
|---------|--------|
| **Editeur** | Aurora Solar (rachete, USA) |
| **Ce qu'il fait** | Plateforme web de conception solaire C&I. Layout 3D sur imagerie satellite, modelisation electrique, ombrage avance, rapports 8760 points, BOM, export CAD. Bibliotheque 45 000 composants. |
| **Tarification** | ~79-95 $/mois/user, essai 14 jours |
| **Cible** | Installateurs et ingenieurs solaires C&I |
| **Limites** | Limite a 5 MW, pas de batch processing pour mega-projets (>15 MW). LIDAR en beta, couverture regionale limitee. Pas de stockage/hybride. Lag sur >10 000 modules. |
| **Ce que Proxiam apporte en plus** | Approche knowledge-first (pas seulement design). Multi-filiere. Vision developpement de projet (pas seulement installation). Donnees reseau francais. |

### 2.5 RETScreen (Canada)

| Critere | Detail |
|---------|--------|
| **Editeur** | Gouvernement du Canada / Ressources naturelles Canada |
| **Ce qu'il fait** | Analyse technico-financiere de projets d'energies renouvelables et d'efficacite energetique. Benchmark, faisabilite (5 etapes : energie, cout, emissions, finance, sensibilite), gestion de portfolios multi-sites. Disponible en 37 langues. |
| **Tarification** | Gratuit (mode Viewer), 672 USD/an (mode Professionnel) |
| **Cible** | Decision-makers, gestionnaires d'installations, 750 000+ utilisateurs mondiaux |
| **Limites** | Generaliste energie (pas specifique ENR developement). Pas de GIS ni cartographie. Pas de knowledge base structuree. Pas de focus reglementaire francais. Interface datee. |
| **Ce que Proxiam apporte en plus** | Specifique au developpement de projets ENR. GIS + postes sources. Knowledge Graph 6D. IA generative. Reglementation francaise. |

### 2.6 OpenSolar

| Critere | Detail |
|---------|--------|
| **Editeur** | OpenSolar (Australie/USA) |
| **Ce qu'il fait** | Design solaire AI-powered gratuit. Modelisation 3D, propositions commerciales, CRM integre, financement, gestion de workflow. OpenSolar 3.0 = premier "OS solaire" gratuit avec IA. 28 000+ installateurs dans 185+ pays. |
| **Tarification** | **Gratuit** (monetise via partenariats hardware/finance) |
| **Cible** | Installateurs solaires residentiels |
| **Limites** | Focalise installation residentielle, pas de developpement de projets utility-scale. Pas de reglementation francaise. Pas d'eolien/BESS. Pas de knowledge base. |
| **Ce que Proxiam apporte en plus** | Cible differente (developpeurs de projets, pas installateurs). Multi-filiere. Knowledge Graph. Cartographie infrastructure reseau France. |

### 2.7 SolarEdge Designer

| Critere | Detail |
|---------|--------|
| **Editeur** | SolarEdge Technologies (Israel) |
| **Ce qu'il fait** | Outil gratuit de conception solaire avec imagerie satellite HD, detection IA des toitures, stringing automatique, simulation energetique, analyse financiere, ROI, export DXF. Lie a l'ecosysteme SolarEdge (onduleurs, optimiseurs). |
| **Tarification** | **Gratuit** (lock-in ecosysteme SolarEdge) |
| **Cible** | Installateurs utilisant du materiel SolarEdge |
| **Limites** | Lock-in constructeur. Solaire residentiel/C&I uniquement. Pas de gestion de projets ni de reglementation. Pas de donnees reseau. |
| **Ce que Proxiam apporte en plus** | Agnostique constructeur. Vision knowledge + projet. Multi-filiere. Reglementation francaise. |

### 2.8 RatedPower / pvDesign (Enverus)

| Critere | Detail |
|---------|--------|
| **Editeur** | RatedPower, filiale Enverus (Espagne/USA) |
| **Ce qu'il fait** | Conception cloud de centrales solaires utility-scale (>1 MW). Design automatise en secondes, simulation energetique, generation de 300+ pages de documentation technique (BoQ, layout, SLD), analyse geospatiale integree. 1 300+ utilisateurs, 55 TW+ simules dans 160+ pays. |
| **Tarification** | Basic / Advanced / Enterprise (prix sur devis, utilisateurs et projets illimites) |
| **Cible** | Developpeurs et EPCistes solaires utility-scale |
| **Limites** | Solaire utility-scale uniquement. Pas de knowledge base structuree. Documentation technique generee mais pas de base de connaissances reglementaires. Pas de focus francais. |
| **Ce que Proxiam apporte en plus** | Multi-filiere. Knowledge Graph 6D avec normes, risques, livrables lies aux phases. Focus reglementaire francais. Scoring de sites integre aux donnees reseau. |

---

## 3. Categorie 2 -- Gestion d'actifs et management de projets ENR

### 3.1 Greenbyte / Power Factors (Envision Digital)

| Critere | Detail |
|---------|--------|
| **Editeur** | Power Factors / Envision Digital (Suede/Chine) |
| **Ce qu'il fait** | Gestion d'actifs ENR en exploitation. Monitoring SCADA temps reel, maintenance predictive, dashboards personnalisables, reporting investisseur, alarmes configurables, API ouverte. Meilleure UX du marche selon les reviews. |
| **Tarification** | SaaS, "Starter" au prix par actif (prix sur devis) |
| **Cible** | Operateurs et investisseurs ENR (actifs en exploitation) |
| **Limites** | Post-construction uniquement. Pas de phase de developpement de projet. Pas de knowledge base ni reglementation. Pas de GIS pour le prospecting. |
| **Ce que Proxiam apporte en plus** | Couverture du cycle complet P0-P7 (pas seulement exploitation). Knowledge Graph 6D. Prospecting + scoring de sites. Reglementation francaise. |

### 3.2 Bazefield (Envision Digital / Univers)

| Critere | Detail |
|---------|--------|
| **Editeur** | Bazefield / Univers (Norvege) |
| **Ce qu'il fait** | Monitoring et controle d'actifs ENR en exploitation. Visualisation portfolio temps reel, controle a distance (onduleurs, turbines, sous-stations), previsions meteo, machine learning, gestion de site (contacts, ordres de travail, acces). 25+ GW geres. |
| **Tarification** | SaaS (prix sur devis) |
| **Cible** | Operateurs de parcs eoliens et solaires |
| **Limites** | Exploitation uniquement. Pas de developpement de projet. Pas de reglementation. Pas de knowledge base. |
| **Ce que Proxiam apporte en plus** | Memes avantages que vs. Greenbyte. Couverture complete du cycle de vie du projet. |

### 3.3 PowerHub

| Critere | Detail |
|---------|--------|
| **Editeur** | PowerHub (Canada) |
| **Ce qu'il fait** | Gestion d'actifs ENR cloud. Centralisation des informations projet, suivi de performance et sante financiere, workflows automatises, reporting portfolio, conformite, connexion avec systemes de monitoring et ERP. 4000+ projets, 15+ GW. |
| **Tarification** | Sur devis |
| **Cible** | Asset managers, IPP, gestionnaires de portfolios ENR |
| **Limites** | Gestion d'actifs existants, pas de phase de developpement. Pas de GIS ni prospecting. Pas de knowledge base structuree. Pas specifique France. |
| **Ce que Proxiam apporte en plus** | Phase de developpement de projet complete. GIS + scoring. Knowledge Graph 6D. Reglementation francaise. |

### 3.4 Solarplaza

| Critere | Detail |
|---------|--------|
| **Editeur** | Solarplaza (Pays-Bas) |
| **Ce qu'il fait** | Plateforme de networking et evenements pour le secteur solaire. Conferences (summits) dans le monde entier. Gestion financiere IPP, O&M (audits, maintenance, monitoring). Hub de connaissances et mise en reseau. |
| **Tarification** | Billets evenements + services O&M (prix sur devis) |
| **Cible** | Professionnels solaires (developpeurs, investisseurs, policy makers) |
| **Limites** | Plateforme de networking, pas un outil de travail quotidien. Pas de GIS, pas de knowledge base structuree, pas de scoring. |
| **Ce que Proxiam apporte en plus** | Outil operationnel quotidien (pas seulement networking). Knowledge Graph actionnable. GIS + scoring. Gratuit a terme. |

---

## 4. Categorie 3 -- Outils GIS et donnees meteorologiques

### 4.1 Global Solar Atlas (Banque Mondiale / Solargis)

| Critere | Detail |
|---------|--------|
| **Editeur** | ESMAP / Banque Mondiale + Solargis |
| **Ce qu'il fait** | Cartes mondiales d'irradiation solaire (GHI, DNI, DIF) et potentiel PV. Resolution ~250 m. Calculateur de rendement PV. Donnees satellite 1994-2024. Interface web gratuite. |
| **Tarification** | **Gratuit** |
| **Cible** | Tous publics, pre-faisabilite mondiale |
| **Limites** | Solaire uniquement. Pas de donnees eolien. Pas de donnees infrastructure reseau. Pas de reglementation. Outil de consultation, pas de gestion de projet. |
| **Ce que Proxiam apporte en plus** | Multi-filiere. Donnees reseau (postes sources). Knowledge Graph. Scoring multi-criteres. Gestion de projets. |

### 4.2 SolarGIS / Solargis

| Critere | Detail |
|---------|--------|
| **Editeur** | Solargis s.r.o. (Slovaquie) |
| **Ce qu'il fait** | Donnees solaires haute resolution (satellite). Prospect (pre-faisabilite, cartes, comparaison de sites), Evaluate 2.0 (design 3D de centrales PV, simulation avancee, documentation technique), Monitor (suivi de performance), Forecast (previsions de production). |
| **Tarification** | Gratuit (basic), 1 800 EUR/an (Basic pro), 3 600 EUR/an (Professional) |
| **Cible** | Developpeurs, investisseurs, EPCistes solaires |
| **Limites** | Solaire uniquement. Pas de knowledge base reglementaire. Pas de gestion de projet avancee. Focus donnees meteorologiques et simulation. |
| **Ce que Proxiam apporte en plus** | Multi-filiere. Knowledge Graph 6D. Reglementation francaise integree. Donnees reseau electrique francais. IA generative. |

### 4.3 PVGIS (Commission Europeenne / JRC)

| Critere | Detail |
|---------|--------|
| **Editeur** | Joint Research Centre, Commission Europeenne |
| **Ce qu'il fait** | Estimation de production PV par localisation (grid-connected, off-grid, tracking). Donnees d'irradiation et temperature pour l'Europe et au-dela. Gratuit, sans inscription. PVGIS 6 prevue mi-2025. |
| **Tarification** | **Gratuit** |
| **Cible** | Tous publics, bureaux d'etudes, chercheurs |
| **Limites** | Solaire PV uniquement. Pas de donnees eolien. Pas de GIS interactif avance. Pas de donnees reseau. Outil de consultation ponctuelle. |
| **Ce que Proxiam apporte en plus** | Plateforme complete (pas seulement un calculateur). Multi-filiere. GIS interactif. Knowledge Graph. Scoring. Gestion de projets. |

### 4.4 WindPRO (EMD International)

| Critere | Detail |
|---------|--------|
| **Editeur** | EMD International (Danemark) |
| **Ce qu'il fait** | Standard industriel pour l'eolien. Evaluation ressource vent (ERA5, MERRA2, MCP), optimisation layout turbines (AEP, LCOE, NPC), simulation de rendement, analyse environnementale (bruit, ombres, impact visuel), conformite aux normes IEC, catalogue 1000+ turbines. 6000+ activations mondiales. |
| **Tarification** | Module BASIS 680 EUR, modules Energy/METEO 1 600 EUR chacun. Licence 1 an = 40% du prix standard. |
| **Cible** | Developpeurs eoliens, bureaux d'etudes, consultants |
| **Limites** | Eolien principalement (solaire en complement). Application desktop Windows. Pas de knowledge base structuree. Pas de donnees reseau francais integrees. Prix eleve pour un ensemble complet de modules. |
| **Ce que Proxiam apporte en plus** | Interface web moderne. Multi-filiere. Knowledge Graph 6D. Donnees reseau francais (Capareseau). IA generative pour l'analyse. Prix significativement inferieur. |

### 4.5 Meteonorm (Meteotest)

| Critere | Detail |
|---------|--------|
| **Editeur** | Meteotest AG (Suisse) |
| **Ce qu'il fait** | Base de donnees meteorologiques mondiale (8000+ stations, 5 satellites). 30+ parametres meteo. Historique horaire depuis 2010. Generation de donnees TMY (Typical Meteorological Year). 36+ formats d'export (PVsyst, SAM, etc.). Modelisation changement climatique (scenarios IPCC). |
| **Tarification** | Licence logiciel (prix sur devis, mode demo gratuit pour 5 sites) |
| **Cible** | Ingenieurs ENR, architectes, chercheurs |
| **Limites** | Donnees meteo uniquement. Pas de conception, pas de GIS projet, pas de reglementation. Outil complementaire, pas autonome. |
| **Ce que Proxiam apporte en plus** | Plateforme complete integrant les donnees meteo dans un contexte plus large (knowledge graph, reglementation, scoring). |

---

## 5. Categorie 4 -- Outils specifiques France

### 5.1 ODRE (Open Data Reseaux Energies)

| Critere | Detail |
|---------|--------|
| **Editeur** | RTE + Enedis + Terega + partenaires (France) |
| **Ce qu'il fait** | Portail open data avec 200+ jeux de donnees sur l'energie en France : production, consommation, stockage, mobilite, infrastructures, marches, meteorologie. Registre national des installations ENR. API Opendatasoft. |
| **Tarification** | **Gratuit** (open data) |
| **Cible** | Citoyens, collectivites, acteurs economiques, chercheurs |
| **Limites** | Donnees brutes sans analyse ni contextualisation. Pas d'outil de scoring ou de decision. Interface technique (Opendatasoft). Pas de knowledge base structuree. |
| **Ce que Proxiam apporte en plus** | Integration et contextualisation des donnees ODRE dans le Knowledge Graph. Scoring automatise. Visualisation cartographique enrichie. IA pour l'analyse. |

### 5.2 RTE eCO2mix

| Critere | Detail |
|---------|--------|
| **Editeur** | RTE (France) |
| **Ce qu'il fait** | Donnees temps reel du systeme electrique francais : mix de production par source, consommation regionale, echanges transfrontaliers, emissions CO2, prix marche. Application mobile. Open data structure. Historique depuis 2012. |
| **Tarification** | **Gratuit** |
| **Cible** | Grand public, professionnels de l'energie |
| **Limites** | Consultation uniquement. Donnees systeme electrique (pas projet). Pas de donnees reglementaires. Pas de scoring ni aide a la decision. |
| **Ce que Proxiam apporte en plus** | Donnees eCO2mix integrees dans le contexte projet. Croisement avec postes sources, capacites de raccordement, normes et reglementation. |

### 5.3 Capareseau (RTE + gestionnaires de reseau)

| Critere | Detail |
|---------|--------|
| **Editeur** | RTE + Enedis + distributeurs (France) |
| **Ce qu'il fait** | Carte des postes sources de France metropolitaine (~3000+). Capacite d'accueil de chaque poste pour le raccordement ENR. Puissance des transformateurs, production deja connectee, capacite reservee S3REnR. |
| **Tarification** | **Gratuit** |
| **Cible** | Developpeurs ENR, bureaux d'etudes |
| **Limites** | Carte statique, pas de scoring automatise. Interface basique. Donnees ponctuelles sans croisement avec reglementation ou risques. Pas d'export avance. |
| **Ce que Proxiam apporte en plus** | **4847 postes sources geolocalises dans la BDD Proxiam** avec API de recherche spatiale (bbox, nearest). Croisement automatique avec les phases du projet, normes et risques. Scoring 0-100 integrant la capacite reseau. |

### 5.4 Outils ADEME

| Critere | Detail |
|---------|--------|
| **Editeur** | ADEME (France) |
| **Ce qu'il fait** | Guides, outils de dimensionnement, aides financieres pour la transition energetique. Evaluation bilan GES pour projets de methanisation. Accompagnement collectivites. Appels a projets recherche "Energie durable". |
| **Tarification** | **Gratuit** (organisme public) |
| **Cible** | Collectivites, entreprises, porteurs de projets ENR |
| **Limites** | Outils disparates, pas integres entre eux. Pas de plateforme unifiee. Guides statiques (pas dynamiques). Pas de scoring automatise ni de knowledge graph. |
| **Ce que Proxiam apporte en plus** | Integration des references ADEME dans le Knowledge Graph. Contextualisation automatique des aides par phase de projet. Vision unifiee et dynamique. |

---

## 6. Categorie 5 -- Plateformes d'intelligence et knowledge management

### 6.1 Enverus (Power & Renewables)

| Critere | Detail |
|---------|--------|
| **Editeur** | Enverus (USA) |
| **Ce qu'il fait** | Plateforme SaaS d'intelligence energetique. IA generative (Enverus AI / Instant Analyst). Donnees massives (7M puits, 50 000+ actifs ENR, 1 300+ generateurs, 350M parcelles). Pricing marche (Pexapark), interconnexion, analyse M&A. 8 000+ entreprises clientes. |
| **Tarification** | Enterprise (prix sur devis, estime >50 000 $/an) |
| **Cible** | Investisseurs, utilities, grands developpeurs, traders |
| **Limites** | Focus USA/global, pas specifique France. Tres cher. Complexe (data platform, pas outil operationnel pour PME). Pas de knowledge base structuree par phase de projet. |
| **Ce que Proxiam apporte en plus** | **Accessibilite** (vs. prix Enverus). Focus France. Knowledge Graph 6D actionnable (pas seulement data). Outil operationnel pour PME/ETI. Reglementation francaise native. |

### 6.2 Orennia (Ion_AI)

| Critere | Detail |
|---------|--------|
| **Editeur** | Orennia (Canada) |
| **Ce qu'il fait** | Plateforme d'intelligence energetique IA. Ion_AI integre des milliards de points de donnees avec analytics predictives. Recherche en langage naturel. Couvre solaire, eolien, stockage, thermique, CCUS, hydrogene, data centers. Series C fermee debut 2025 (Decarbonization Partners). |
| **Tarification** | Enterprise (prix sur devis) |
| **Cible** | Investisseurs et grands developpeurs energie |
| **Limites** | Focus Amerique du Nord. Pas de donnees reglementaires francaises. Plateforme de business intelligence, pas d'outil de gestion de projet. Pas de Knowledge Graph structuree par phase. |
| **Ce que Proxiam apporte en plus** | Focus France. Knowledge Graph 6D (phases, normes, risques, livrables, outils, competences). Donnees reseau francais. Outil operationnel (pas seulement BI). Prix accessible. |

### 6.3 Clir Renewables

| Critere | Detail |
|---------|--------|
| **Editeur** | Clir Renewables (Canada) |
| **Ce qu'il fait** | Intelligence IA pour portfolios ENR en exploitation. Reporting investisseur automatise, reconciliation disponibilite contractuelle, monitoring de performance, evaluation risques climatiques (cyclones, foudre, grele, vent extreme). 200+ GW de donnees operationnelles. |
| **Tarification** | SaaS (prix sur devis) |
| **Cible** | Proprietaires et gestionnaires de portfolios ENR |
| **Limites** | Post-construction uniquement. Pas de phase de developpement. Pas de knowledge base reglementaire. Pas specifique France. |
| **Ce que Proxiam apporte en plus** | Couverture du cycle complet de developpement (P0 a P7). Knowledge Graph 6D. Focus reglementaire francais. Scoring pre-construction. |

### 6.4 Esri ArcGIS (Solutions ENR)

| Critere | Detail |
|---------|--------|
| **Editeur** | Esri (USA) |
| **Ce qu'il fait** | Suite GIS enterprise avec modules specialises ENR. Analyse de suitabilite de sites (usage du sol, ensoleillement, vent, contraintes environnementales). Dashboards temps reel. Gestion multi-projets. Applications mobiles. |
| **Tarification** | Enterprise (>10 000 $/an, prix par utilisateur et extensions) |
| **Cible** | Grandes entreprises, utilities, gouvernements |
| **Limites** | Generaliste GIS, pas specifique ENR. Courbe d'apprentissage elevee. Tres cher. Pas de knowledge base ENR integree. Pas de reglementation francaise native. |
| **Ce que Proxiam apporte en plus** | **Specifique ENR**. Knowledge Graph 6D integre au GIS. Reglementation francaise native. Prix 10x inferieur. Interface simplifiee pour les professionnels ENR. |

---

## 7. Matrice comparative synthetique

### 7.1 Couverture fonctionnelle

| Fonctionnalite | PVsyst | Aurora | HOMER | WindPRO | SolarGIS | Greenbyte | Enverus | Orennia | Esri | **Proxiam** |
|---|---|---|---|---|---|---|---|---|---|---|
| Conception/simulation PV | +++ | +++ | ++ | + | ++ | -- | -- | -- | -- | -- |
| Conception/simulation eolien | -- | -- | ++ | +++ | -- | -- | -- | -- | -- | -- |
| Cartographie GIS | -- | + | -- | ++ | ++ | -- | + | + | +++ | **+++** |
| Knowledge Graph | -- | -- | -- | -- | -- | -- | -- | -- | -- | **+++** |
| Base de connaissances 6D | -- | -- | -- | -- | -- | -- | -- | -- | -- | **+++** |
| Reglementation francaise | -- | -- | -- | -- | -- | -- | -- | -- | -- | **+++** |
| Scoring de sites | -- | -- | -- | -- | + | -- | + | + | ++ | **+++** |
| Gestion de projets | -- | + | -- | -- | -- | -- | + | -- | + | **++** |
| IA generative | -- | + | -- | -- | -- | -- | +++ | ++ | -- | **++** |
| Monitoring exploitation | -- | -- | -- | -- | + | +++ | + | + | ++ | -- |
| Donnees reseau electrique FR | -- | -- | -- | -- | -- | -- | -- | -- | -- | **+++** |
| Visualisation 3D | -- | +++ | -- | ++ | -- | -- | -- | -- | ++ | **++** |
| Multi-filiere (sol+eol+BESS) | -- | -- | +++ | + | -- | ++ | ++ | +++ | -- | **+++** |
| **Prix accessible PME** | ++ | -- | + | -- | + | -- | -- | -- | -- | **+++** |

Legende : +++ = excellent, ++ = bon, + = basique, -- = absent

### 7.2 Comparaison des prix

| Outil | Tarification | Cout annuel estime |
|---|---|---|
| PVsyst | Licence annuelle | ~560 EUR/an |
| Aurora Solar | Abonnement mensuel | 1 900 - 3 100 EUR/an/user |
| HOMER Pro | Licence annuelle | ~2 800 - 4 600 EUR/an |
| HelioScope | Abonnement mensuel | ~950 - 1 140 EUR/an/user |
| RETScreen Expert | Abonnement annuel | ~620 EUR/an |
| WindPRO | Modules + licence | 680 - 3 880 EUR/an (selon modules) |
| SolarGIS | Abonnement annuel | 0 - 3 600 EUR/an |
| Enverus | Enterprise SaaS | >50 000 EUR/an |
| Orennia | Enterprise SaaS | >30 000 EUR/an (estime) |
| Esri ArcGIS | Enterprise | >10 000 EUR/an |
| **Proxiam** | **A definir (freemium prevu)** | **Cible : 0-2 000 EUR/an** |

### 7.3 Positionnement sur 2 axes

```
                    SCOPE FONCTIONNEL (mono → multi)

   Mono-filiere                                Multi-filiere
   Mono-phase                                  Multi-phase
        |                                           |
        |  PVsyst    HelioScope                     |
        |  SolarEdge  Aurora                        |
  Low   |  OpenSolar                                |
  Prix  |  PVGIS     Global Solar Atlas             |
        |  RETScreen                                |  PROXIAM (cible)
        |                                           |
        |  WindPRO                                  |
        |  Meteonorm  SolarGIS                      |
        |                                           |
  High  |                                 HOMER     |
  Prix  |                          Greenbyte        |
        |                    PowerHub    Bazefield   |
        |                          Clir             |
        |                                           |
        |             Esri                 Enverus   |
        |                                  Orennia  |
        |                                           |
```

---

## 8. Positionnement unique de Proxiam

### 8.1 Le probleme que Proxiam resout

Un developpeur de projets ENR en France doit aujourd'hui :

1. **Consulter Capareseau** pour les capacites de raccordement des postes sources
2. **Utiliser PVGIS ou SolarGIS** pour les donnees d'irradiation
3. **Verifier les normes** sur Legifrance, les sites DREAL, les bases MRAe
4. **Gerer les risques** avec des tableurs Excel
5. **Suivre les livrables** dans un logiciel de gestion de projet generique
6. **Concevoir le projet** dans PVsyst ou WindPRO
7. **Presenter aux investisseurs** avec PowerPoint + Excel
8. **Surveiller les appels d'offres** manuellement

Cela represente **8+ outils disparates**, sans lien entre eux, avec une perte d'information massive a chaque transition.

### 8.2 La proposition de valeur unique de Proxiam

**Proxiam est le seul outil qui combine dans une seule plateforme :**

| Dimension | Ce que fait Proxiam | Qui d'autre le fait ? |
|---|---|---|
| **Knowledge Graph 6D** | 5176 items structures en matrice (phases, normes, risques, livrables, outils, competences) relies entre eux | **Personne** |
| **GIS + Infrastructure reseau** | 4847 postes sources geolocalises + requetes spatiales (bbox, nearest) + cartographie interactive | Capareseau (statique), Esri (generique, cher) |
| **Scoring multi-criteres 0-100** | Algorithme integrant donnees reseau, reglementation, risques, contraintes environnementales | Enverus/Orennia (US, cher), Esri (generique) |
| **Focus France** | Normes francaises, S3REnR, MRAe, DREAL, ADEME, Capareseau | **Personne** dans une plateforme integree |
| **Multi-filiere** | Solaire, eolien, BESS, hybride dans une seule plateforme | HOMER (simulation), Enverus (BI) |
| **IA generative** | Claude API pour analyse documentaire, scoring, generation | Enverus AI (>50k$/an), Orennia Ion_AI |
| **Cycle complet P0-P7** | De la prospection a l'exploitation | **Personne** ne couvre tout le cycle avec une knowledge base |
| **Visualisation 3D** | React Three Fiber + Deck.gl pour la comprehension spatiale | Aurora (solaire residentiel), Esri (enterprise) |
| **Prix accessible** | Cible freemium / <2000 EUR/an | OpenSolar (gratuit mais residentiel), RETScreen (~620 EUR) |

### 8.3 Les 5 differenciateurs cles

1. **Approche OS (Operating System)** -- Proxiam n'est pas un outil de plus, c'est une plateforme unifiee qui remplace la fragmentation actuelle. Le concept d'"OS ENR" est unique sur le marche.

2. **Knowledge Graph 6D** -- La matrice 6 dimensions (phases x normes x risques x livrables x outils x competences) avec 5176 items interconnectes n'existe nulle part ailleurs. C'est un actif strategique irreproductible rapidement.

3. **Focus reglementaire francais** -- Aucun concurrent international n'integre nativement les normes francaises (S3REnR, MRAe, ICPE, EIE, PLU, SCoT, etc.). Les outils francais (ODRE, Capareseau, eCO2mix) sont des portails de donnees brutes, pas des outils de decision.

4. **Integration GIS + Knowledge + IA** -- La combinaison cartographie interactive (MapLibre GL + PostGIS) + Knowledge Graph (React Flow) + IA generative (Claude API) + 3D (R3F) dans une seule application web est sans equivalent.

5. **Accessibilite PME/ETI** -- Enverus et Orennia ciblent les grandes entreprises (>50 000$/an). PVsyst et WindPRO sont des outils desktop specialises. Proxiam vise les developpeurs de projets de toute taille avec un modele freemium.

---

## 9. Analyse SWOT Proxiam

### Forces

- **Unicite du Knowledge Graph 6D** -- 5176 items structures, zero concurrent direct
- **Donnees reseau francais integrees** -- 4847 postes sources dans la BDD
- **Stack technique moderne** -- Web-native, responsive, API-first
- **Cout de developpement maitrise** -- Stack open source, pas de licence logicielle
- **IA integree des la conception** -- Claude API, pas une surcouche

### Faiblesses

- **Produit en construction** -- Sprint 1 termine, beaucoup reste a faire (Sprint 2-6)
- **Pas de simulation energetique** -- Ne remplace pas PVsyst/WindPRO pour le calcul de rendement
- **Equipe reduite** -- Vitesse de developpement limitee
- **Pas encore de base utilisateurs** -- Market validation a faire
- **Donnees meteorologiques non integrees** -- Depend d'APIs tierces

### Opportunites

- **Marche ENR France en forte croissance** -- Objectifs PPE 2028 ambitieux (solaire 44 GW, eolien 33 GW)
- **Aucun "OS ENR" sur le marche** -- Ocean bleu, pas de concurrent direct
- **Reglementation croissante** -- Plus de normes = plus de besoin de structuration
- **IA generative democratisee** -- Permet de creer rapidement de la valeur (scoring, analyse, generation)
- **Open data francais en expansion** -- ODRE, Capareseau, eCO2mix enrichissent le socle
- **Frustration des professionnels** -- Fragmentation des outils = besoin reel identifie

### Menaces

- **Enverus/Orennia s'etendent** -- Pourraient lancer des modules France
- **PVsyst/WindPRO pourraient s'ouvrir** -- Ajout de fonctions GIS et compliance
- **Nouveaux entrants IA** -- Startups agiles avec financement
- **Adoption** -- Les professionnels sont habitues a leurs outils actuels
- **Maintenance des donnees** -- Le Knowledge Graph 6D necessite une mise a jour continue

---

## 10. Conclusion et recommandations strategiques

### 10.1 Constat principal

**Proxiam n'a pas de concurrent direct.** Aucun outil sur le marche ne combine Knowledge Graph structuree + GIS + IA + reglementation francaise dans une plateforme unifiee. Les concurrents les plus proches sont :

| Concurrent le plus proche | Pourquoi ce n'est pas la meme chose |
|---|---|
| **Enverus** | BI enterprise US, >50k$/an, pas de Knowledge Graph structuree par phase |
| **Esri ArcGIS** | GIS generique, pas de knowledge base ENR, >10k$/an |
| **PVsyst + WindPRO** | Outils de simulation, pas de plateforme de connaissance |
| **Capareseau** | Donnees brutes statiques, pas d'outil de decision |

### 10.2 Recommandations strategiques

1. **Ne pas tenter de remplacer PVsyst/WindPRO** -- Se positionner comme complementaire. Proxiam est la couche de connaissance et de decision, pas l'outil de simulation energetique.

2. **Construire des integrations** -- API bidirectionnelles avec PVsyst, PVGIS, SolarGIS, Capareseau, ODRE pour enrichir l'ecosysteme.

3. **Monetiser le Knowledge Graph** -- C'est l'actif strategique unique. Freemium sur les fonctions basiques (carte, consultation), premium sur le scoring IA, le Knowledge Graph avance, l'export de rapports.

4. **Cibler les developpeurs de projets ENR** -- Pas les installateurs (Aurora, OpenSolar) ni les operateurs (Greenbyte, Clir). Le "trou dans le marche" est la phase de developpement (P0-P4).

5. **Accelerer la validation marche** -- Presenter Proxiam a 5-10 developpeurs de projets ENR en France avant de continuer le dev des Sprints 3-6.

6. **Construire la communaute** -- Le Knowledge Graph 6D peut etre enrichi par la communaute (modele Wikipedia de l'ENR francais).

### 10.3 Positionnement marketing recommande

> **Proxiam : L'OS de connaissance pour le developpement de projets ENR en France.**
>
> Cartographie + Knowledge Graph + IA -- tout ce dont vous avez besoin pour developper vos projets renouvelables, dans une seule plateforme.

---

## Sources

### Logiciels de conception
- [PVsyst](https://www.pvsyst.com/en/) -- Simulation photovoltaique
- [Aurora Solar](https://aurorasolar.com/) -- Design solaire cloud
- [HOMER Energy](https://homerenergy.com/) -- Optimisation microgrids
- [HelioScope](https://helioscope.aurorasolar.com/) -- Design solaire C&I
- [RETScreen](https://natural-resources.canada.ca/maps-tools-publications/tools-applications/retscreen) -- Analyse projets ENR
- [OpenSolar](https://www.opensolar.com/) -- Design solaire gratuit
- [SolarEdge Designer](https://www.solaredge.com/en/products/software-tools/designer) -- Design gratuit SolarEdge
- [RatedPower pvDesign](https://ratedpower.com/) -- Design utility-scale

### Gestion d'actifs
- [Greenbyte / Power Factors](https://www.greenbyte.com/) -- Asset management
- [Bazefield](https://bazefield.com/) -- Monitoring ENR
- [PowerHub](https://powerhub.com/) -- Gestion d'actifs cloud
- [Solarplaza](https://www.solarplaza.com/) -- Networking solaire

### GIS et meteo
- [Global Solar Atlas](https://globalsolaratlas.info/) -- Irradiation mondiale
- [SolarGIS / Solargis](https://solargis.com/) -- Donnees solaires pro
- [PVGIS](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en) -- Commission Europeenne
- [WindPRO](https://www.emd-international.com/software/windpro) -- Planning eolien
- [Meteonorm](https://meteonorm.com/en/) -- Donnees meteorologiques

### Outils France
- [ODRE](https://opendata.reseaux-energies.fr) -- Open Data Reseaux Energies
- [RTE eCO2mix](https://www.rte-france.com/en/data-publications/eco2mix) -- Donnees electricite temps reel
- [Capareseau](https://www.capareseau.fr) -- Capacites de raccordement
- [ADEME](https://www.ademe.fr/) -- Agence de la transition ecologique

### Plateformes d'intelligence
- [Enverus](https://www.enverus.com/) -- Intelligence energetique IA
- [Orennia](https://orennia.com/) -- Intelligence transition energetique
- [Clir Renewables](https://www.clir.eco/) -- IA portfolios ENR
- [Esri ArcGIS ENR](https://www.esri.com/en-us/industries/renewables/overview) -- GIS enterprise
