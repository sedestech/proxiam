# 🤖 DIMENSION : IA EMBARQUÉE & EDGE COMPUTING

> Cette dimension couvre l'intelligence artificielle déployée directement sur site — sans dépendance au cloud — pour le monitoring en temps réel, l'inspection automatique et la maintenance prédictive.

---

## 1. Vision

L'IA embarquée (Edge AI) transforme les centrales ENR de systèmes passifs en systèmes auto-diagnostiquants. Au lieu d'envoyer des téraoctets de données vers le cloud pour analyse, les modèles tournent localement, détectent les anomalies en millisecondes, et ne remontent que les alertes pertinentes.

**Pourquoi c'est critique** :
- Latence réduite : détection de défaut en < 100 ms vs quelques secondes à minutes via cloud (selon la qualité de la connexion et l'architecture)
- Fonctionnement offline : sites isolés sans fibre, connexion satellite intermittente
- Coût data réduit : la majorité des données filtrées en local (estimation courante : >90%, variable selon l'application)
- Cybersécurité : moins de surface d'attaque (pas de flux continu vers le cloud)

---

## 2. Drones Autonomes avec IA Embarquée

### Inspection PV
- **Détection de hotspots** en temps réel via caméra IR + modèle CNN (convolutional neural network)
- **Détection de soiling** (encrassement) par analyse d'image visible — seuil de nettoyage calculé en vol
- **Détection de micro-fissures** par électroluminescence embarquée (prototype)
- **Détection de PID, snail trails, délamination** par classification d'images
- Modèles : YOLOv8/v9 quantifié pour NVIDIA Jetson Orin embarqué sur drone
- Outils : Raptor Maps, Sitemark, Above Surveying, DroneDeploy

### Inspection Éolien
- **Détection de fissures de pales** par caméra haute résolution + IA
- **Érosion de bord d'attaque** — classification automatique de sévérité
- **Détection d'impacts de foudre** sur les pales
- **Inspection de la tour et de la nacelle** sans nacelle-descente humaine
- Outils : SkySpecs, Sulzer Schmid, Perceptual Robotics

### Drones Matériel
- DJI Matrice 350 RTK + Zenmuse H30T (thermique + zoom optique)
- Skydio X10 (vol autonome avec évitement d'obstacles)
- senseFly eBee X (cartographie de grandes surfaces) *— marque acquise par AgEagle Aerial Systems, statut commercial fragile en 2026. Alternatives : DJI Matrice 350 RTK, WingtraOne*
- Drones sous-marins ROV pour FPV et câbles offshore

---

## 3. Caméras Thermiques IA sur Trackers

- Caméras IR fixes montées sur chaque rangée de trackers
- Analyse continue des modules pendant la rotation (matin → soir)
- Détection automatique : hotspots, bypass diodes défaillantes, connexions dégradées
- Fréquence : 1 scan complet/jour vs 1 inspection drone/an
- Edge processing : Raspberry Pi industriel ou NVIDIA Jetson Nano
- Alertes en temps réel au centre de supervision

---

## 4. Robots de Nettoyage Intelligents

| Robot | Type | Technologie | Consommation d'eau |
|-------|------|-------------|-------------------|
| Ecoppia T4 | Autonome, rail sur structure | Brosse rotative + microfibre | Zéro eau |
| SunBrush mobil | Semi-automatique, tracteur | Brosse rotative + eau déminéralisée | Faible |
| Heliotex | Automatisé, système fixe | Aspersion + raclette | Eau recyclée |
| Serbot | Robot grimpant (toiture) | Ventouses + brosse | Faible |

**IA intégrée** :
- Capteurs de soiling pour déclenchement automatique du nettoyage
- Optimisation du planning : nettoyer quand la perte de production > coût du nettoyage
- Évitement d'obstacles (câbles, capteurs, défauts de structure)

---

## 5. SCADA Augmenté (Edge Intelligence)

### Architecture
```
[Capteurs IoT] → [Edge Gateway] → [Modèle IA local] → [Alertes] → [Cloud SCADA]
                                                                      ↑
                                                          (données agrégées uniquement)
```

### Modèles IA déployés en edge
- **Détection d'anomalies** : modèle de baseline par onduleur, alerte si déviation > 2σ
- **Prédiction de pannes** : Random Forest / LSTM entraîné sur données historiques
- **Estimation du soiling** : modèle de dégradation basé sur météo (poussière, pluie, vent)
- **Prédiction de production** : modèle LSTM/Transformer pour les 24-48h
- **Optimisation du curtailment** : ajustement en temps réel de la puissance injectée

### Hardware Edge
| Matériel | GPU/NPU | Puissance | Usage |
|----------|---------|-----------|-------|
| NVIDIA Jetson Orin Nano | 40 TOPS (version Super 2024 : 67 TOPS) | 15W | Modèles de vision |
| Intel NUC industriel | CPU + iGPU | 25W | SCADA léger |
| Raspberry Pi 5 industriel | CPU | 5W | Capteurs IoT |
| Advantech UNO-2484G | CPU industriel | 35W | Edge Gateway |
| Moxa UC-8200 | ARM | 10W | Protocoles industriels |

### Protocoles de communication
- **Modbus RTU/TCP** — communication onduleurs et capteurs legacy
- **OPC-UA** — communication industrielle moderne, sécurisée
- **MQTT** — messaging IoT léger pour les capteurs
- **IEC 61850** — communication dans les postes électriques
- **IEC 104** — téléconduite avec le gestionnaire de réseau
- **LoRaWAN** — capteurs IoT longue portée, faible consommation
- **DNP3** — protocole SCADA américain (projets internationaux)

---

## 6. Acoustic Monitoring IA (Éolien)

- Microphones embarqués dans la nacelle et sur les pales
- Détection en temps réel : fissures de pales, roulements défaillants, boîte de vitesses
- Classification de sons par spectrogramme + CNN
- Réduction du bruit de fond (vent) par algorithme adaptatif
- Alerte préventive 2-4 semaines avant la panne pour certains défauts mécaniques (roulements, engrenages). *Variable selon le type de défaillance — les pannes électroniques ou de pale sont plus difficiles à anticiper.*

---

## 7. Capteurs IoT & Réseau de Capteurs

### Capteurs déployés sur une centrale type (10 MWc PV)
- 200-500 capteurs de courant/tension par string
- 4-8 pyranomètres (plan des modules + horizontal)
- 2-4 stations météo (T°, vent, humidité, pluviométrie)
- 50-100 capteurs de température module (thermocouples PT100)
- 10-20 capteurs de vibration (trackers, onduleurs)
- 4-8 caméras IR fixes
- 1-2 capteurs de soiling (DustIQ, Kipp & Zonen)

### Réseau
- **LoRaWAN** pour les capteurs distribués (portée 2-5 km, faible conso)
- **RS-485 / Modbus** pour les onduleurs et compteurs
- **Ethernet industriel** pour le backbone SCADA
- **4G/5G** backup pour la connexion internet
- **Fibre optique** pour le lien principal

---

## 8. Modèles IA par Phase du Cycle de Vie

| Phase | Application | Modèle | Déploiement |
|-------|------------|--------|-------------|
| P0 | Scoring de sites | Gradient Boosting / XGBoost | Cloud |
| P1 | Optimisation de layout | Algorithme génétique + pvlib | Cloud |
| P2 | Analyse de documents MRAe | LLM (Claude/GPT) | Cloud |
| P4 | QA/QC par drone | YOLOv8 (détection d'objets) | Edge (drone) |
| P5 | Validation commissioning | Modèle de baseline | Edge |
| P6 | Maintenance prédictive | LSTM / Transformer | Edge + Cloud |
| P6 | Détection d'anomalies | Isolation Forest / Autoencoder | Edge |
| P6 | Prévision de production | Transformer temporel | Cloud |
| P7 | Classification de déchets | CNN (classification d'images) | Edge |

---

## 9. Frameworks & Outils IA Embarqués

- **TensorFlow Lite** — modèles légers pour appareils mobiles et edge
- **ONNX Runtime** — inférence multi-plateforme
- **OpenVINO (Intel)** — optimisation pour hardware Intel
- **TensorRT (NVIDIA)** — optimisation pour GPU NVIDIA
- **Edge Impulse** — plateforme de développement ML embarqué
- **Apache TVM** — compilateur de modèles pour hardware divers
- **MLflow** — suivi des expérimentations ML et déploiement
