Voici la spécification exhaustive du **Bloc 1** de la plateforme **AetherNexus OS**. Ce bloc constitue le socle fondateur de tout projet ENR : il couvre l'ensemble des activités de **prospection territoriale, d'analyse de faisabilité technique et économique**, et de qualification réglementaire préliminaire. Aucun euro n'est engagé en développement tant que ce bloc n'a pas validé la viabilité du site.

---

# 🔍 BLOC 1 : PROSPECTION & FAISABILITÉ

> **Périmètre** : Analyse SIG, qualification réseau, prospection foncière, estimation de productible, faisabilité économique et pré-analyse réglementaire.
> **Référentiel** : 10 compétences de prospection et d'évaluation SolarBrainOS.

---

## 🗺️ 1.1 Analyse SIG & Cartographie (Phases 1-30)

1. **Acquisition des données cadastrales** : Import des parcelles via le flux WMS/WFS du cadastre (cadastre.gouv.fr).
2. **Extraction des données PLU/PLUi** : Récupération du zonage urbanistique (zones A, N, U, AU) depuis le Géoportail de l'Urbanisme (GPU).
3. **Analyse de compatibilité PLU** : Vérification que le zonage autorise les installations de production d'énergie renouvelable.
4. **Import du Modèle Numérique de Terrain (MNT)** : Téléchargement des dalles RGE Alti 1m de l'IGN via l'API de la Géoplateforme IGN (anciennement Géoportail/Géoservices).
5. **Analyse topographique du site** : Calcul des pentes, orientations et altitudes pour qualifier l'aptitude du terrain.
6. **Génération de la carte des pentes** : Classification en zones 0-5%, 5-15%, 15-25% et >25% pour le solaire au sol. *Seuils indicatifs courants en prospection, à adapter selon le contexte géologique et la technologie (fixe vs tracker).*
7. **Import des données Corine Land Cover** : Identification de l'occupation du sol (cultures, friches, forêts, zones artificialisées).
8. **Détection de friches industrielles par imagerie satellite** : Analyse des images Sentinel-2/Copernicus pour identifier les terrains délaissés.
9. **Croisement avec les bases CASIAS (SSP-InfoTerre, BRGM) et GeoRisques (sites et sols pollués)** : Identification des sites potentiellement pollués (anciens ICPE, décharges). *Note : CASIAS remplace l'ancienne base BASIAS depuis la migration BRGM ; BASOL est intégrée dans GeoRisques.*
10. **Cartographie des contraintes Natura 2000** : Import des périmètres ZSC (Directive Habitats) et ZPS (Directive Oiseaux).
11. **Cartographie des ZNIEFF de type I et II** : Superposition des Zones Naturelles d'Intérêt Écologique, Faunistique et Floristique.
12. **Import des périmètres de protection PPR/PPRI** : Plans de Prévention des Risques naturels et inondation.
13. **Analyse des servitudes aéronautiques civiles** : Consultation de la DGAC pour les zones de dégagement des aérodromes.
14. **Analyse des servitudes aéronautiques militaires** : Vérification des zones de basse altitude (RTBA) et radars militaires.
15. **Vérification des servitudes radioélectriques** : Consultation de l'ANFR pour les faisceaux hertziens et stations de télécommunication.
16. **Import des périmètres de monuments historiques** : Zones de 500m autour des édifices classés/inscrits (ABF).
17. **Analyse des sites classés et inscrits** : Vérification de l'absence de co-visibilité avec les paysages protégés.
18. **Cartographie des zones de bruit radar** : Impact potentiel des éoliennes sur les radars Météo-France et aviation.
19. **Analyse d'ombrage par Modèle Numérique de Surface (MNS)** : Calcul de l'ombrage projeté par la végétation et le bâti existant.
20. **Modélisation des masques lointains** : Calcul de l'horizon topographique à 360° pour estimer les pertes d'ombrage.
21. **Import des données du Registre Parcellaire Graphique (RPG)** : Identification des cultures en place et de la valeur agronomique.
22. **Analyse de la distance aux habitations** : Calcul des reculs réglementaires — 500m minimum pour l'éolien (art. L.515-44 Code de l'environnement), reculs définis par le PLU/PLUi pour le solaire au sol.
23. **Cartographie des zones humides inventoriées** : Import des données SDAGE et SAGE locaux.
24. **Identification des corridors écologiques (TVB)** : Superposition de la Trame Verte et Bleue régionale.
25. **Analyse de la desserte routière** : Vérification de l'accessibilité par voirie existante pour les convois de chantier.
26. **Cartographie des réseaux souterrains** : Consultation du guichet unique (DICT) pour les réseaux enterrés existants.
27. **Analyse multicritère SIG assistée** : Scoring pondéré de l'ensemble des couches (technique, environnement, accès, réseau). *Méthode AHP ou ELECTRE avec paramétrage des poids par l'utilisateur — le processus requiert un arbitrage humain sur les critères et seuils.*
28. **Génération de la carte de synthèse des contraintes** : Superposition de toutes les couches avec classification Rouge/Orange/Vert.
29. **Identification des zones d'implantation potentielles (ZIP)** : Définition des périmètres constructibles après filtrage multicritère.
30. **Export du rapport cartographique de prospection** : Document PDF avec atlas cartographique pour la revue de comité.

---

## 🔌 1.2 Réseau Électrique & Raccordement (Phases 31-55)

31. **Consultation du S3REnR régional** : Identification des capacités réservées par le Schéma Régional de Raccordement.
32. **Identification des postes sources à proximité** : Localisation via les données Capareseau de RTE. *Rayon de recherche typique : 15-25 km (convention de prospection, non réglementaire — à adapter selon la puissance du projet et la densité du réseau).*
33. **Extraction des capacités d'accueil résiduelles** : Analyse des MW disponibles par poste source (données Enedis/RTE).
34. **Analyse des files d'attente de raccordement** : Consultation du registre des demandes en cours sur les postes ciblés.
35. **Calcul de la distance de raccordement HTA/HTB** : Estimation kilométrique du tracé le plus probable vers le poste source.
36. **Estimation du coût de raccordement préliminaire** : Calcul basé sur les barèmes Enedis/RTE (quote-part S3REnR + extension).
37. **Analyse du schéma de réseau local** : Identification du type de réseau (aérien/souterrain, tension, section).
38. **Vérification de la puissance maximale injectable** : Adéquation avec les limites techniques du poste source.
39. **Étude de la qualité du réseau local** : Analyse des contraintes de tension et de transit (données Enedis OpenData).
40. **Identification des travaux de renforcement réseau nécessaires** : Estimation des ouvrages à créer ou à renforcer.
41. **Analyse de la congestion réseau existante** : Vérification des éventuelles limitations de soutirage/injection.
42. **Pré-évaluation de l'impact sur le plan de tension** : Estimation simplifiée de l'impact de l'injection sur le profil de tension du départ HTA. *Note : la simulation détaillée est réalisée par Enedis/RTE dans l'étude de raccordement ; ici il s'agit d'une analyse préliminaire pour identifier les risques de refus.*
43. **Estimation de l'écrêtement potentiel** : Calcul des heures de curtailment prévisibles en cas de saturation réseau.
44. **Analyse de la faisabilité de raccordement direct HTB** : Opportunité pour les projets de grande puissance. *Le seuil HTA/HTB dépend du domaine de tension et des capacités du poste source — généralement au-delà de 12-17 MW en HTA, le raccordement HTB est envisagé, mais le seuil exact varie selon la configuration locale (Enedis/RTE).*
45. **Identification des synergies avec d'autres projets** : Mutualisation possible du raccordement avec des projets voisins.
46. **Consultation préliminaire Enedis/RTE** : Prise de contact avec le gestionnaire de réseau pour valider la faisabilité.
47. **Pré-estimation des besoins en compensation de réactif** : Identification préliminaire des contraintes de puissance réactive. *Note : l'analyse détaillée est du ressort de l'étude de raccordement (Enedis/RTE) ; ici il s'agit de qualifier le risque de surcout lié à la compensation.*
48. **Vérification de la compatibilité avec le plan de développement réseau** : Cohérence avec les investissements réseau programmés.
49. **Estimation du délai de raccordement** : Planning prévisionnel basé sur les retours d'expérience régionaux.
50. **Analyse des contraintes de tracé du câble de raccordement** : Traversées de routes, cours d'eau, voies ferrées.
51. **Évaluation du risque de refus de raccordement** : Score de probabilité basé sur la saturation du poste source.
52. **Note d'opportunité stockage couplé** : Identification de l'intérêt potentiel d'un BESS pour réduire l'écrêtement. *En prospection, il s'agit d'un signal go/no-go, pas d'une pré-étude technique détaillée (celle-ci relève de la phase ingénierie).*
53. **Cartographie du tracé de raccordement optimal** : Génération du tracé SIG en évitant les contraintes foncières et techniques.
54. **Estimation du coût total de raccordement (CAPEX réseau)** : Synthèse incluant quote-part, extension, branchement et PDL.
55. **Rédaction de la note de synthèse raccordement** : Document de synthèse pour le comité d'investissement.

---

## 🏠 1.3 Prospection Foncière (Phases 56-85)

56. **Extraction des données DVF (Demandes de Valeurs Foncières)** : Analyse des transactions récentes pour estimer la valeur du foncier.
57. **Identification des propriétaires via le cadastre** : Croisement des parcelles cibles avec les données de propriété.
58. **Recherche de propriétaires via les services de publicité foncière** : Consultation des fichiers immobiliers pour les cas complexes.
59. **Cartographie de la structure foncière** : Visualisation du morcellement parcellaire et des propriétés.
60. **Identification des baux ruraux existants** : Vérification de l'existence de baux en cours (fermage, métayage).
61. **Analyse de la durée résiduelle des baux** : Calcul de l'échéance et des conditions de résiliation/non-renouvellement.
62. **Premier contact propriétaires** : Prise de rendez-vous et présentation du projet de manière pédagogique.
63. **Identification des exploitants agricoles en place** : Contact avec les fermiers pour évaluer l'impact sur leur activité.
64. **Analyse de la valeur agronomique des parcelles** : Classement PAC et potentiel cultural pour évaluer l'enjeu AgriPV.
65. **Étude de la stratégie multi-propriétaires** : Regroupement des parcelles nécessaires et identification des propriétaires clés.
66. **Vérification des servitudes foncières existantes** : Droits de passage, servitudes de canalisation, lignes électriques.
67. **Analyse des indivisions et successions** : Identification des situations juridiques complexes (plusieurs ayants droit).
68. **Vérification de l'absence de préemption SAFER** : Consultation de la SAFER locale sur le risque de préemption.
69. **Négociation des conditions de bail emphytéotique** : Discussion du loyer, de la durée et des clauses d'indexation. *Durée légale : 18 à 99 ans (art. L.451-1 Code rural). Pratique courante ENR : 30-40 ans avec options de renouvellement pour le repowering.*
70. **Négociation des promesses de bail** : Signature de promesses synallagmatiques avec conditions suspensives.
71. **Due diligence foncière** : Vérification de l'absence d'hypothèques, saisies ou contentieux sur les parcelles.
72. **Vérification de la conformité au statut du fermage** : Respect du cadre légal pour la résiliation ou la modification du bail rural.
73. **Analyse des droits de chasse et de passage** : Identification des conventions de chasse et chemins ruraux.
74. **Estimation de l'emprise foncière nécessaire** : Calcul de la surface optimale en fonction de la technologie et de la puissance cible.
75. **Négociation des accords de principe avec les communes** : Délibération favorable du conseil municipal si terrain communal.
76. **Rédaction des lettres d'intention foncière** : Formalisation de l'intérêt réciproque entre développeur et propriétaires.
77. **Identification des terrains publics mobilisables** : Appels à projets, domaine public (délaissés routiers, friches SNCF).
78. **Analyse des contraintes d'accès au site** : Création de pistes, servitudes de passage à négocier.
79. **Vérification du droit de préemption urbain (DPU)** : Consultation de la commune sur l'existence d'un DPU sur les parcelles.
80. **Négociation des indemnités d'éviction agricole** : Compensation pour l'exploitant en place si nécessaire.
81. **Constitution du dossier foncier complet** : Regroupement de tous les actes, promesses et états hypothécaires.
82. **Validation juridique des promesses de bail** : Relecture par un avocat spécialisé en droit rural et immobilier.
83. **Sécurisation foncière des accès et servitudes** : Signature des conventions de passage et de raccordement.
84. **Cartographie finale de la maîtrise foncière** : Carte SIG avec le statut de chaque parcelle (sécurisée, en cours, refus).
85. **Rédaction de la note de synthèse foncière** : Document consolidé pour le comité d'investissement.

---

## ☀️ 1.4 Estimation de Productible & Ressource (Phases 86-110)

86. **Acquisition des données d'irradiation solaire (GHI)** : Téléchargement via PVGIS, SolarGIS ou Meteonorm pour le site.
87. **Acquisition des données de rayonnement direct (DNI)** : Analyse du potentiel pour les technologies à concentration (CSP).
88. **Acquisition des données d'irradiation diffuse (DHI)** : Complément pour la modélisation du productible bifacial.
89. **Analyse de la ressource éolienne — données Météo-France** : Extraction des séries temporelles de vent (10m, 50m, 100m).
90. **Analyse de la ressource éolienne — données de réanalyse ERA5** : Utilisation du jeu de données ECMWF pour la caractérisation long terme.
91. **Étude de la nécessité d'un mât de mesure** : Décision de déployer une campagne anémométrique in situ (12 mois min).
92. **Pré-dimensionnement de la campagne LIDAR** : Évaluation de l'opportunité d'un LIDAR terrestre pour profiler le vent en altitude.
93. **Corrélation Mesure-Predict (MCP)** : Calage des données court-terme du site avec les références long-terme (20 ans).
94. **Modélisation du productible solaire via pvlib** : Simulation horaire incluant les pertes (température, salissure, ombrage, câblage).
95. **Modélisation du productible éolien simplifié** : Calcul via courbe de puissance constructeur et distribution de Weibull.
96. **Estimation du facteur de charge préliminaire** : Ratio énergie produite / énergie théorique maximale annuelle.
97. **Analyse de la variabilité interannuelle — P50** : Valeur médiane de production attendue sur 20 ans.
98. **Analyse de la variabilité interannuelle — P75** : Valeur dépassée 75% des années (scénario conservateur).
99. **Analyse de la variabilité interannuelle — P90** : Valeur dépassée 90% des années (scénario bancable pour les financeurs).
100. **Calcul de l'incertitude sur le productible** : Propagation des incertitudes (données satellite, modèle, vieillissement).
101. **Analyse de la dégradation annuelle des modules** : Application d'un taux de dégradation linéaire (0.4-0.7%/an selon technologie silicium cristallin). *Source : études NREL et garanties constructeurs standard.*
102. **Estimation des pertes par ombrage inter-rangées** : Calcul basé sur le pitch et la hauteur des structures.
103. **Estimation des pertes par salissure** : Adaptation au contexte local (poussière, pollen, neige, fientes).
104. **Estimation des pertes par température** : Impact du coefficient thermique Pmax sur le productible annuel.
105. **Pré-dimensionnement technique solaire** : Choix préliminaire de la technologie (fixe, tracker, bifacial, AgriPV).
106. **Pré-dimensionnement technique éolien** : Sélection de la classe IEC de turbine adaptée au régime de vent.
107. **Analyse du potentiel de production hybride** : Complémentarité solaire/éolien ou solaire/stockage sur le même site.
108. **Estimation de la courbe de production horaire type** : Profil journalier et saisonnier pour l'analyse de la valorisation.
109. **Calcul du productible spécifique (kWh/kWc ou kWh/MW installé)** : Indicateur clé de comparaison entre sites.
110. **Rédaction de la note de productible préliminaire** : Synthèse technique avec intervalles de confiance pour le comité d'investissement.

---

## 💰 1.5 Faisabilité Économique & Financière (Phases 111-135)

111. **Estimation du CAPEX préliminaire — Modules/Turbines** : Benchmark des prix FOB/CIF selon la technologie retenue.
112. **Estimation du CAPEX préliminaire — BOS (Balance of System)** : Structures, câblage, onduleurs, transformateurs.
113. **Estimation du CAPEX préliminaire — Génie Civil** : Terrassement, pistes, fondations, clôtures.
114. **Estimation du CAPEX préliminaire — Raccordement** : Coût du câble HTA/HTB, poste de livraison, quote-part S3REnR.
115. **Estimation du CAPEX préliminaire — Développement** : Études, autorisations, frais juridiques et fonciers.
116. **Calcul du CAPEX total par MWc installé** : Ratio clé de comparaison avec les benchmarks sectoriels.
117. **Estimation de l'OPEX annuel — O&M technique** : Contrat de maintenance préventive et corrective.
118. **Estimation de l'OPEX annuel — Assurances** : Tous risques chantier, exploitation, responsabilité civile.
119. **Estimation de l'OPEX annuel — Foncier** : Loyers, taxes foncières, IFER (Imposition Forfaitaire des Entreprises de Réseaux).
120. **Estimation de l'OPEX annuel — Gestion et administration** : Asset management, comptabilité, reporting investisseurs.
121. **Analyse des mécanismes de soutien — Appels d'offres CRE** : Éligibilité et compétitivité tarifaire prévisionnelle.
122. **Analyse des mécanismes de soutien — Complément de rémunération** : Calcul du tarif de référence et du complément versé par EDF OA.
123. **Analyse des mécanismes de soutien — PPA corporate** : Opportunités de Power Purchase Agreement avec des industriels/collectivités.
124. **Benchmark du prix de marché spot** : Analyse des prix EPEX SPOT et des courbes forward pour estimer les revenus merchant.
125. **Construction du business plan simplifié** : Modèle financier sur 30 ans avec hypothèses de revenus et de coûts.
126. **Calcul du TRI projet (avant levier)** : Taux de Rentabilité Interne du projet sans dette.
127. **Calcul du TRI fonds propres (après levier)** : TRI avec hypothèse de financement en dette (70-80% de levier, ratio standard en financement de projet ENR — source : rapports IRENA, CRE).
128. **Calcul de la VAN (Valeur Actuelle Nette)** : Avec taux d'actualisation adapté au profil de risque du projet.
129. **Calcul du LCOE (Levelized Cost of Energy)** : Coût actualisé de l'énergie produite sur la durée de vie du projet.
130. **Analyse de sensibilité** : Impact des variations de productible, CAPEX, prix de vente et taux d'intérêt sur le TRI.
131. **Estimation du besoin en fonds propres** : Montant de l'equity nécessaire pour boucler le financement.
132. **Analyse de la bancabilité du projet** : Vérification du DSCR (Debt Service Coverage Ratio) minimum exigé par les banques.
133. **Identification des sources de financement** : Banques, fonds d'investissement, financement participatif, subventions régionales.
134. **Rédaction de la note d'opportunité** : Document synthétique pour le comité d'investissement (go/no-go).
135. **Scoring global du projet** : Note composite intégrant productible, foncier, réseau, réglementaire et financier.

---

## ⚖️ 1.6 Analyse Réglementaire Préliminaire (Phases 136-150)

136. **Vérification de la compatibilité PLU/PLUi/SCoT** : Analyse approfondie du règlement de zone applicable.
137. **Analyse de la compatibilité avec le SRADDET** : Vérification de la cohérence avec les objectifs régionaux ENR.
138. **Vérification de la compatibilité avec le PCAET** : Cohérence avec le Plan Climat Air Énergie Territorial de l'EPCI.
139. **Pré-analyse de la sensibilité faune/flore** : Consultation des bases INPN et SINP pour les enjeux biodiversité connus.
140. **Identification de la procédure d'autorisation principale** : ICPE / Autorisation Environnementale (éolien/BESS), Permis de Construire (solaire au sol > 1 MWc, décret n°2022-1688 du 29/12/2022), Déclaration Préalable (solaire au sol ≤ 1 MWc).
141. **Analyse de la nécessité d'une évaluation environnementale** : Examen au cas par cas ou étude d'impact systématique.
142. **Identification de la nécessité d'un dossier Loi sur l'Eau** : Vérification des seuils IOTA (rubrique 3.3.1.0 notamment).
143. **Identification de la nécessité d'un défrichement** : Analyse de la couverture forestière et du régime de défrichement.
144. **Pré-consultation de la DDT/M** : Contact informel pour sonder la position des services instructeurs.
145. **Pré-consultation de la DREAL** : Échange préliminaire sur les enjeux environnementaux et paysagers identifiés.
146. **Vérification de la conformité à la Loi APER** : Application de la loi d'Accélération de la Production d'Énergies Renouvelables (zones d'accélération).
147. **Analyse des zones d'accélération ENR communales** : Vérification de l'inscription du site dans les zones définies par la commune.
148. **Identification des recours contentieux potentiels** : Analyse du contexte local (opposition riverains, associations, élus).
149. **Estimation du calendrier d'instruction** : Planning prévisionnel de l'ensemble des procédures administratives. *Délais typiques : 12-18 mois pour le solaire au sol, 24-36 mois pour l'éolien (incluant enquête publique et recours potentiels).*
150. **Rédaction de la note de faisabilité réglementaire consolidée** : Synthèse des risques administratifs et recommandations pour le comité d'investissement.
151. **Analyse de la compatibilité avec les objectifs ZAN** : Vérification de l'impact du projet au regard de la loi Climat et Résilience du 22 août 2021 (Zéro Artificialisation Nette) — les installations ENR au sol comptabilisent dans l'artificialisation sauf exceptions (friches, parkings). *Source : art. 194 loi n°2021-1104.*
152. **Pré-consultation de la CDPENAF** : Identification du risque d'avis défavorable de la Commission Départementale de Préservation des Espaces Naturels, Agricoles et Forestiers. *Avis obligatoire pour tout projet solaire au sol en zone agricole (art. L.112-1-1 Code rural).*
153. **Analyse de la conformité au décret agrivoltaïsme** : Vérification du respect du cadre réglementaire de l'agrivoltaïsme (décret n°2024-318 du 8 avril 2024) — conditions de compatibilité avec l'activité agricole, taux de couverture, maintien du rendement.
154. **Pré-concertation avec le public et les parties prenantes** : Organisation d'échanges préliminaires avec les riverains, associations et élus locaux, conformément aux dispositions renforcées de la loi APER (loi n°2023-175 du 10 mars 2023) sur la concertation préalable.
155. **Consultation des échelons territoriaux** : Échanges avec l'EPCI, le Conseil Départemental et la Région pour évaluer l'acceptabilité politique du projet et la cohérence avec les stratégies territoriales.
156. **Analyse de la stratégie de commercialisation** : Au-delà du benchmark EPEX SPOT, analyse du marché de capacité, des garanties d'origine, du mécanisme post-ARENH et des opportunités de PPA long terme.

---

### Chiffre Total du Bloc 1

**Nombre de sous-phases : 156**

| Section | Thématique | Phases | Nombre |
| --- | --- | --- | --- |
| **1.1** | Analyse SIG & Cartographie | 1-30 | 30 |
| **1.2** | Réseau Électrique & Raccordement | 31-55 | 25 |
| **1.3** | Prospection Foncière | 56-85 | 30 |
| **1.4** | Estimation de Productible & Ressource | 86-110 | 25 |
| **1.5** | Faisabilité Économique & Financière | 111-135 | 25 |
| **1.6** | Analyse Réglementaire Préliminaire | 136-156 | 21 |
