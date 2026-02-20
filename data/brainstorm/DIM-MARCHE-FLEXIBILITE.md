# ⚡ DIMENSION : MARCHÉS DE L'ÉLECTRICITÉ & FLEXIBILITÉ

> Cette dimension couvre la valorisation de l'énergie produite — marchés spot, PPA, services système, stockage, agrégation — et la flexibilité comme nouvelle source de revenus.

---

## 1. Marchés de l'Électricité — Vue d'Ensemble

### Structure du marché européen
- **Marché de gros** : EPEX Spot (day-ahead + intraday), NordPool
- **Marché de détail** : PPA, obligation d'achat (OA), complément de rémunération (CR)
- **Services système** : réglage de fréquence, réserve, tension
- **Mécanisme de capacité** : certification et enchères RTE
- **Garanties d'Origine (GO)** : certification de l'origine renouvelable

### Mécanismes de soutien en France (2026)
| Mécanisme | Description | Durée | Éligibilité |
|-----------|-------------|-------|-------------|
| Obligation d'achat (OA) | Tarif fixe garanti | 20 ans | < 500 kWc (PV), < 6 éoliennes |
| Complément de rémunération (CR) | Prime au-dessus du prix de marché | 20 ans | > 500 kWc, appels d'offres CRE |
| PPA corporate | Contrat bilatéral producteur-consommateur | 5-25 ans | Toute taille |
| Marché spot | Vente directe sur EPEX Spot | Continu | Via agrégateur |

---

## 2. Power Purchase Agreements (PPA)

### Types de PPA
- **PPA physique** : livraison physique d'électricité au consommateur
- **PPA virtuel (VPPA/CFD)** : contrat financier sans livraison physique
- **PPA corporate on-site** : production sur le site du consommateur
- **PPA sleeved** : via un intermédiaire (agrégateur/fournisseur)
- **PPA multi-acheteurs** : plusieurs consommateurs pour un seul producteur

### Structuration d'un PPA
- **Prix fixe** : €40-60/MWh (2025-2026, France, PV)
- **Prix indexé** : base + indexation inflation/marché
- **Floor/Cap** : prix plancher garanti + plafond de partage
- **Pay-as-produced** : le consommateur prend tout ce qui est produit
- **Baseload** : le producteur garantit un profil de production lissé (avec stockage)

### Risques PPA
- Risque de volume (production < prévision)
- Risque de profil (production en heures creuses = prix bas)
- Risque de contrepartie (défaut de paiement de l'acheteur)
- Risque de cannibalisation (trop d'ENR = prix bas aux mêmes heures)

---

## 3. Agrégation

### Rôle de l'agrégateur
- Vend la production sur les marchés pour le compte du producteur
- Optimise le placement entre day-ahead, intraday et balancing
- Gère l'écart entre prévision et production réelle (responsabilité d'équilibre)
- Fournit des prévisions de production (J-1, infra-journalier)

### Principaux agrégateurs en France
| Agrégateur | Spécialité | Taille de portefeuille |
|------------|-----------|----------------------|
| Statkraft | Multi-filière, leader européen | > 20 GW Europe |
| Vattenfall | Éolien, corporate PPA | > 10 GW |
| Engie Green | Multi-filière, PPA corporate | > 8 GW France |
| EDF Renouvelables | PV + éolien | > 10 GW France |
| Alpiq | Trading avancé, stockage | > 5 GW |
| Axpo | PPA structurés, marché suisse | > 3 GW |
| Volterres | PME, circuits courts | < 1 GW |

---

## 4. Virtual Power Plant (VPP)

### Concept
Agrégation de multiples actifs distribués (PV, éolien, BESS, V2G, effacement) pour fonctionner comme une seule centrale virtuelle pilotable.

### Architecture technique
```
[PV 1] ──┐
[PV 2] ──┤
[BESS 1] ─┤── [VPP Controller] ── [Marché/Dispatching RTE]
[Éolien] ──┤
[V2G] ────┘
```

### Services fournis par un VPP
- Réglage primaire de fréquence (FCR)
- Réserve secondaire (aFRR)
- Réserve tertiaire (mFRR)
- Mécanisme de capacité
- Arbitrage de prix (charge BESS en heures creuses, décharge en pointe)
- Lissage de production intermittente

### Plateformes VPP
- Next Kraftwerke (Shell Energy) — l'un des plus grands VPP européens, ~10-15 GW (en compétition avec Statkraft)
- Flexitricity (Drax Group, acquis en 2024 pour £42M) — effacement et flexibilité UK
- Sonnen (Shell) — batteries résidentielles agrégées
- Tesla Autobidder — agrégation de Megapack et Powerwall

---

## 5. Stockage BESS — Arbitrage et Optimisation

### Stratégies de revenus BESS
1. **Arbitrage de prix** : charge en heures creuses (€20-40/MWh), décharge en pointe (€80-200/MWh)
2. **FCR (Frequency Containment Reserve)** : réponse en < 30 secondes, revenus stables
3. **aFRR/mFRR** : réserves de fréquence secondaire et tertiaire
4. **Peak shaving** : réduction de la pointe de consommation du consommateur PPA
5. **Firming** : transformation d'une production intermittente en production baseload
6. **Backup** : alimentation de secours en cas de coupure réseau

### Modèle économique BESS (France, 2025-2026, estimations)
| Revenu | Estimation annuelle/MWh |
|--------|------------------------|
| Arbitrage spot | €40,000-80,000 |
| FCR | €60,000-100,000 |
| aFRR (ouvert 2024) | €20,000-40,000 |
| Mécanisme de capacité | €15,000-25,000 |
| **Total** | **€135,000-245,000** |
| CAPEX | ~€250,000-400,000/MWh |
| Payback | 4-7 ans (réaliste) |

*Note : le payback de 2-4 ans souvent cité repose sur des hypothèses agressives de revenus cumulés FCR+arbitrage. En pratique, la saturation du marché FCR en France (~500 MW de batteries certifiées vs ~500 MW de besoin) pousse les revenus FCR à la baisse. Sources : RTE, CRE.*

---

## 6. Services Système

### Réglage de fréquence (50 Hz)
- **FCR** : réponse automatique proportionnelle en < 30s (rémunéré par enchère)
- **aFRR** : réponse en 30s-15min, pilotée par signal RTE
- **mFRR** : réponse en 15min+, activation manuelle
- **RR** : remplacement après 30min

### Réglage de tension
- Injection/absorption de puissance réactive (Q)
- Obligation gratuite dans les Grid Codes pour les producteurs ENR
- Potentiel de rémunération future

### Black Start
- Capacité de redémarrage du réseau après un blackout
- Les BESS et centrales PV + BESS peuvent fournir ce service
- Rémunération par contrat bilatéral avec le GRT

---

## 7. Vehicle-to-Grid (V2G) & Demand Response

### V2G
- Les véhicules électriques comme batteries distribuées
- Charge bidirectionnelle : le véhicule injecte sur le réseau en pointe
- Standards : ISO 15118, CHAdeMO V2G
- Projets pilotes : Nuvve, The Mobility House, Dreev (EDF)

### Demand Response (Effacement)
- Réduction temporaire de la consommation sur demande du GRT
- Rémunération : €0-500/MW/h d'effacement selon la tension du réseau
- Opérateurs : Voltalis (résidentiel), Energy Pool (industriel), Flexcity (Veolia Environnement, via Dalkia)

---

## 8. Peer-to-Peer Energy Trading & Blockchain

### Concept
- Échange direct d'électricité entre producteurs et consommateurs voisins
- Smart contracts sur blockchain pour automatiser les transactions
- Autoconsommation collective (cadre légal français depuis 2017)

### Projets et plateformes
- **Enosi** — plateforme de matching producteur/consommateur
- **Power Ledger** — trading P2P sur blockchain (Australie)
- **Energy Web Foundation** — blockchain open source pour l'énergie
- **Lumenaza** — plateforme de communautés énergétiques (Allemagne)

### Autoconsommation collective (France)
- Périmètre : 2 km (étendu à 20 km par la loi APER 2023)
- Cadre : personne morale organisatrice (PMO)
- Avantage : réduction TURPE pour la part autoconsommée

---

## 9. Garanties d'Origine (GO)

- Certification qu'1 MWh a été produit à partir d'ENR
- Registre français : Powernext (EEX)
- Prix : €0.5-5/MWh (volatil, marché en expansion)
- Couplage GO + PPA = "24/7 carbon-free energy" (tendance 2025+)
- Standard européen : AIB (Association of Issuing Bodies)
