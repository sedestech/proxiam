Voici la cartographie des **100 risques (R-901 à R-1000)** rattachés à la **Phase P6 : Exploitation & O&M**. Ces risques couvrent les 25-30 ans de vie opérationnelle — dégradation des équipements, aléas climatiques, cybermenaces, et évolutions réglementaires menacent en continu la performance et la rentabilité de l'actif.

---

## 📊 P6 : RISQUES D'EXPLOITATION & O&M (R-901 à R-1000)

### ⚡ 1. Risques de Performance & Dégradation (R-901 à R-925)

*Cible : Baisse de production, vieillissement des équipements, pertes non détectées.*

* **R-901** : **Dégradation linéaire des modules PV** supérieure à la garantie constructeur (> 0.7%/an au lieu de 0.5%).
* **R-902** : **PID (Potential Induced Degradation)** — perte de puissance de 10-30% sur les modules affectés.
* **R-903** : **LeTID (Light and elevated Temperature Induced Degradation)** — dégradation thermique spécifique aux cellules PERC.
* **R-904** : Hotspots non détectés provoquant la dégradation accélérée de cellules individuelles.
* **R-905** : **Soiling** (encrassement) réduisant la production de 3-15% selon la région et la saison.
* **R-906** : Délamination de l'encapsulant EVA provoquant le jaunissement et la perte de transmission.
* **R-907** : Micro-fissures évolutives (snail trails) réduisant progressivement la puissance du module.
* **R-908** : Corrosion des contacts métalliques dans les boîtiers de jonction (humidité + courant).
* **R-909** : **Panne d'onduleur central** — arrêt de production d'un bloc entier (plusieurs MW).
* **R-910** : Dégradation des condensateurs DC des onduleurs (durée de vie 10-15 ans vs 25 ans du parc).
* **R-911** : Défaillance mécanique des trackers (moteur, vérin, engrenage) — modules bloqués en position non optimale.
* **R-912** : Corrosion des structures métalliques en environnement salin ou industriel.
* **R-913** : Dégradation de l'isolation des câbles DC/AC par UV, rongeurs ou humidité.
* **R-914** : Perte de production par mismatch évolutif (dégradation non uniforme des modules d'un string).
* **R-915** : **Performance Ratio (PR) inférieur aux projections** de plus de 5% sur une année.
* **R-916** : Sous-performance chronique non détectée (absence de monitoring granulaire par string).
* **R-917** : Dégradation du transformateur HTA (échauffement, vieillissement de l'huile diélectrique).
* **R-918** : Perte d'étanchéité des connecteurs MC4 après 10+ ans d'exposition UV.
* **R-919** : Vieillissement prématuré des batteries BESS (capacité < 80% après 5 ans au lieu de 10).
* **R-920** : Défaut de calibration des capteurs météo (pyranomètre, anémomètre) faussant le calcul du PR.
* **R-921** : Effet d'ombre non prévu (croissance d'arbres, construction voisine) réduisant la production.
* **R-922** : Dégradation des pales éoliennes (érosion de bord d'attaque, foudre, délamination).
* **R-923** : Vibrations anormales sur éolienne (déséquilibre rotor, roulement défaillant).
* **R-924** : Perte de gaz SF6 dans les cellules HTA (fuite lente, impact environnemental + sécurité).
* **R-925** : Obsolescence logicielle des onduleurs/contrôleurs (fin de support firmware constructeur).

---

### 🌪️ 2. Risques Climatiques & Catastrophes Naturelles (R-926 à R-945)

*Cible : Événements météo extrêmes impactant l'intégrité physique des installations.*

* **R-926** : **Grêle exceptionnelle** détruisant les modules PV (grêlons > 25 mm, non couverts par garantie standard).
* **R-927** : Tempête avec rafales > 150 km/h arrachant les modules des structures.
* **R-928** : Inondation du poste de livraison (crue centennale ou submersion marine).
* **R-929** : Foudre directe sur l'installation provoquant la destruction de l'onduleur et du SCADA.
* **R-930** : Incendie de végétation atteignant la centrale (garrigue, pinède, culture de blé).
* **R-931** : Surcharge de neige dépassant la capacité structurelle des tables PV.
* **R-932** : **Tornade** ou microrafale détruisant une partie du parc PV ou éolien.
* **R-933** : Canicule prolongée réduisant le rendement des modules PV (coefficient de température négatif).
* **R-934** : Gel/dégel endommagant les fondations par cycles de gonflement.
* **R-935** : Tempête de sable/poussière saharienne (épisode de calima) encrassant massivement les modules.
* **R-936** : Séisme endommagant les structures et les connexions électriques.
* **R-937** : Cyclone sur installation DROM-COM (La Réunion, Guadeloupe, Mayotte).
* **R-938** : Coulée de boue atteignant la centrale après pluies intenses en zone collinaire.
* **R-939** : Verglas massif sur les pales éoliennes (projection de glace, arrêt de production).
* **R-940** : Montée des eaux/érosion côtière menaçant une installation littorale.
* **R-941** : Impact d'un avion ou d'un drone sur une éolienne (collision aérienne).
* **R-942** : Tsunami (risque faible mais non nul en Méditerranée) sur installation côtière.
* **R-943** : Crue soudaine emportant les flotteurs d'une installation FPV.
* **R-944** : Pollution atmosphérique industrielle dégradant les revêtements anti-reflets des modules.
* **R-945** : Événement climatique non modélisé dans le design initial (changement climatique, nouveaux records).

---

### 🔒 3. Risques Cybersécurité & SCADA (R-946 à R-960)

*Cible : Intrusion, sabotage numérique, perte de contrôle des systèmes OT.*

* **R-946** : **Ransomware ciblant le SCADA** — chiffrement des données de production, demande de rançon.
* **R-947** : Intrusion via un accès VPN de maintenance non sécurisé (mot de passe par défaut).
* **R-948** : **Manipulation des données de production** par un attaquant (factures frauduleuses, PR falsifié).
* **R-949** : Attaque DDoS sur le portail de monitoring rendant la supervision impossible.
* **R-950** : Compromission du Power Plant Controller (PPC) — perte de contrôle de l'injection réseau.
* **R-951** : Exploitation d'une vulnérabilité zero-day dans le firmware des onduleurs.
* **R-952** : Espionnage industriel — vol de données de performance par un concurrent.
* **R-953** : **Non-conformité NIS2** — amende ANSSI jusqu'à 10M€ ou 2% du CA mondial.
* **R-954** : Perte de données historiques de production (corruption de base de données, absence de backup).
* **R-955** : Accès non autorisé d'un ancien prestataire (comptes non révoqués après fin de contrat).
* **R-956** : Interception de communications Modbus/OPC-UA non chiffrées sur le réseau local.
* **R-957** : Malware dans une mise à jour firmware fournie par le constructeur (supply chain attack).
* **R-958** : Défaillance de l'UPS du local technique laissant le SCADA sans alimentation.
* **R-959** : Perte de connectivité internet prolongée (fibre coupée) rendant le monitoring distant impossible.
* **R-960** : Sabotage physique du boîtier de communication SCADA sur un site isolé non surveillé.

---

### 💰 4. Risques Contractuels & Financiers (R-961 à R-980)

*Cible : Revenus, contrats, garanties, assurances, fiscalité.*

* **R-961** : **Baisse du prix de marché de l'électricité** rendant le PPA ou le complément de rémunération moins rentable.
* **R-962** : Résiliation anticipée du PPA par l'acheteur (défaut de paiement, faillite).
* **R-963** : Écrêtement (curtailment) imposé par le gestionnaire de réseau réduisant les revenus de 5-15%.
* **R-964** : Non-respect des critères de disponibilité du contrat O&M (pénalités SLA).
* **R-965** : Refus de claim garantie par le fabricant de modules (contestation de la cause de dégradation).
* **R-966** : Faillite du fabricant de modules/onduleurs — garantie devenue inapplicable.
* **R-967** : Augmentation non prévue de la IFER (Imposition Forfaitaire sur les Entreprises de Réseaux).
* **R-968** : Modification du mécanisme de complément de rémunération par arrêté ministériel.
* **R-969** : Sous-assurance découverte lors d'un sinistre majeur (franchise trop élevée, exclusion).
* **R-970** : Litige avec le propriétaire foncier (augmentation de loyer, résiliation du bail).
* **R-971** : Coûts O&M réels supérieurs de > 20% aux prévisions du business plan.
* **R-972** : Baisse de la valeur de revente de l'actif (due diligence technique négative).
* **R-973** : Obligation de constituer une garantie financière de démantèlement supérieure au provisionné.
* **R-974** : Taxe carbone ou mécanisme CBAM impactant le coût de remplacement des équipements importés.
* **R-975** : Défaut de paiement du complément de rémunération par EDF OA (retard administratif).
* **R-976** : Non-conformité ESG/GRESB pénalisant la notation du fonds investisseur.
* **R-977** : Audit technique révélant des vices cachés lors d'une transaction (M&A).
* **R-978** : Hausse du TURPE (Tarif d'Utilisation des Réseaux Publics d'Électricité).
* **R-979** : Perte du bénéfice d'un tarif d'achat par non-respect des conditions contractuelles.
* **R-980** : Refinancement impossible (hausse des taux d'intérêt, dégradation du credit rating).

---

### 🌿 5. Risques Réglementaires & Environnementaux (R-981 à R-1000)

*Cible : Évolutions normatives, conformité ICPE, impacts biodiversité en exploitation.*

* **R-981** : Nouvelle réglementation ICPE imposant des investissements de mise en conformité non budgétés.
* **R-982** : Mortalité avifaune/chiroptères supérieure aux seuils du protocole de suivi (arrêt temporaire éolien).
* **R-983** : Obligation de bridage éolien étendue (vitesses de vent plus basses, périodes plus longues).
* **R-984** : Mise en demeure DREAL pour non-respect d'une prescription de l'arrêté d'autorisation.
* **R-985** : Plainte de riverains pour nuisances (bruit éolien, reflets PV, impact paysager).
* **R-986** : Pollution accidentelle du sol par fuite d'huile de transformateur (responsabilité environnementale).
* **R-987** : Obligation de démanteler une installation jugée non conforme a posteriori.
* **R-988** : Évolution du zonage PLU rendant l'installation non conforme à l'urbanisme.
* **R-989** : Obligation de mettre en place des mesures compensatoires supplémentaires post-suivi écologique.
* **R-990** : Durcissement des normes de bruit (réduction des seuils admissibles en zone rurale).
* **R-991** : Nouveau décret imposant le recyclage de 95% des composants (vs 85% actuel).
* **R-992** : Obligation d'agrivoltaïsme rétroactive sur des centrales au sol existantes.
* **R-993** : Contamination par des PFAS (substances per/polyfluoroalkylées) dans les composants — obligation de dépollution.
* **R-994** : Restriction d'usage du SF6 par le règlement F-Gas révisé (remplacement des cellules HTA).
* **R-995** : Non-renouvellement de l'autorisation d'exploitation ICPE à échéance.
* **R-996** : Création d'une zone de protection environnementale post-implantation (Natura 2000, PNR).
* **R-997** : Obligation de transparence accrue (publication des données de production, accès public).
* **R-998** : Évolution des Grid Codes imposant des mises à jour coûteuses des systèmes de contrôle.
* **R-999** : Responsabilité élargie du producteur (REP) étendue aux installations de production.
* **R-1000** : **Risque systémique** — combinaison de plusieurs risques mineurs créant un effet cascade non anticipé.
