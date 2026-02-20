# 🔋 DIMENSION : HYDROGÈNE VERT

> Cette dimension couvre la production d'hydrogène par électrolyse alimentée par des ENR, son stockage, son transport et ses usages — un marché naissant qui transforme les centrales ENR en hubs multi-vecteurs.

---

## 1. Types d'Électrolyseurs

| Technologie | Maturité | Rendement | CAPEX (€/kW) | Durée de vie | Avantage |
|-------------|----------|-----------|--------------|-------------|----------|
| **Alcalin (AEL)** | Mature | 60-70% | 500-1000 | 80,000h | Moins cher, éprouvé |
| **PEM (Proton Exchange Membrane)** | Commercial | 55-70% | 800-1500 | 50,000-80,000h | Réponse rapide, compact |
| **SOEC (Solid Oxide)** | Pilote | 75-85% | 1500-3000 | 20,000-40,000h | Meilleur rendement (chaleur) |
| **AEM (Anion Exchange Membrane)** | Émergent | 55-65% | 600-1200 | 30,000h | Pas de métaux nobles |

### Principaux fabricants
- **Nel Hydrogen** (Norvège) — alcalin et PEM
- **ITM Power** (UK) — PEM
- **Siemens Energy** (Allemagne) — PEM (Silyzer)
- **Elogen** (France, filiale GTT) — PEM. *Attention : en 2025, suspension de la construction de l'usine de Vendôme, plan de suppression de 110 postes sur 160. GTT a lancé une revue stratégique de cette filiale.*
- **McPhy** (France) — alcalin et stockage. *Attention : McPhy a déclaré son insolvabilité en 2025, événement majeur pour la filière H2 française.*
- **Sunfire** (Allemagne) — SOEC
- **Bloom Energy** (USA) — SOEC réversible
- **John Cockerill** (Belgique) — alcalin grande capacité

---

## 2. Couplage Électrolyseur + Centrale ENR

### Dimensionnement
- **Ratio électrolyseur/PV** : typiquement 50-70% de la puissance PV installée
- **Facteur de charge** : 1500-2500 h/an (PV), 3000-4500 h/an (éolien)
- **Consommation** : ~50-55 kWh/kg H2 (PEM) ; ~4.5-5.5 kWh/Nm3
- **Production** : 1 MWe PEM → ~180-200 kg H2/jour (avec PV, facteur charge 20%)

### Gestion de l'intermittence
- Rampe de puissance PEM : < 1 seconde (idéal pour ENR)
- Alcalin : 1-10 minutes (moins adapté aux variations rapides)
- Tampon batterie : BESS de 15-30 min pour lisser les variations court terme
- Mode veille : maintien en température sans production (consommation ~5%)

### Architecture type
```
[Centrale PV/Éolien] ──→ [Transformateur] ──→ [Redresseur AC/DC]
                                                      ↓
                              [Eau déminéralisée] → [Électrolyseur]
                                                      ↓
                                        [Compresseur] → [Stockage H2]
                                                              ↓
                                                      [Distribution]
```

---

## 3. Stockage de l'Hydrogène

| Méthode | Pression/T° | Capacité | Coût | Maturité |
|---------|-------------|----------|------|----------|
| **Réservoirs haute pression** | 200-700 bar | 100 kg - 10 t | Moyen | Mature |
| **Cavernes salines** | 100-200 bar | 100-10,000 t | Faible (€/kg) | Commercial |
| **Hydrures métalliques** | 10-30 bar, T° ambiante | 1-100 kg | Élevé | Pilote |
| **Stockage liquide (LH2)** | -253°C, 1 bar | 1-1000 t | Très élevé | Commercial (spatial) |
| **LOHC (Liquid Organic H2 Carriers)** | Ambiante | Transport | Moyen | Pilote |

### Cavernes salines en France
- **Storengy (Engie)** — opérateur de stockage souterrain
- Sites potentiels : Manosque, Lussagnet, Etrez, Tersanne
- Capacité unitaire : 200-6000 tonnes H2 par caverne
- Projet HyGreen Provence (ENGIE/DLVA) : couplage PV + électrolyse 240 MW + stockage caverne saline

---

## 4. Transport de l'Hydrogène

### Options de transport
| Mode | Distance | Capacité | Coût | Statut |
|------|----------|----------|------|--------|
| **Pipeline dédié H2** | > 100 km | Illimité | €0.5-1.5/kg/100km | Pilote |
| **Reconversion pipeline gaz** | > 100 km | Illimité | €0.3-0.8/kg/100km | Pilote |
| **Camion tube** | < 300 km | 300-1000 kg | €1-3/kg/100km | Mature |
| **Camion LH2** | < 1000 km | 3,000-4,000 kg | €0.5-1.5/kg/100km | Commercial |
| **Navire LH2** | International | 10,000+ t | Élevé | Pilote (Japon) |

### European Hydrogen Backbone (EHB)
- Réseau de pipelines H2 pan-européen planifié
- 53,000 km d'ici 2040 (dont 60% reconversion de pipelines gaz existants)
- France : GRTgaz participe activement, projets MosaHYc et HYnframed

---

## 5. Usages de l'Hydrogène Vert

### Industrie (60% de la demande cible)
- **Raffinage** : remplacement du H2 gris (reformage de méthane)
- **Ammoniac vert** : engrais (Haber-Bosch avec H2 vert)
- **Acier vert** : réduction directe du minerai de fer (DRI) — Hybrit/SSAB
- **Chimie** : méthanol vert, e-fuels

### Mobilité lourde (20%)
- **Poids lourds** : pile à combustible PEMFC (Hyundai Xcient, Nikola, Daimler GenH2)
- **Bus** : Solaris, Van Hool, CaetanoBus
- **Trains** : Alstom Coradia iLint (opérationnel en Allemagne)
- **Maritime** : ferries, navires côtiers (Energy Observer)
- **Aviation** : SAF (Sustainable Aviation Fuel) via e-kérosène

### Injection réseau (10%)
- Blending : injection de 6-20% vol. H2 dans le réseau gaz naturel
- Power-to-Gas-to-Power : stockage intersaisonnier (été → hiver)
- Méthanation : CO2 + H2 → CH4 synthétique (injection 100%)

### Stockage d'énergie (10%)
- Power-to-H2-to-Power : rendement global 25-35%
- Intérêt : stockage de longue durée (jours → mois) vs batteries (heures)
- Cas d'usage : lissage saisonnier, blackstart, îlotage

---

## 6. Normes et Réglementation H2

### Normes techniques
- **ISO 22734** : Générateurs d'hydrogène par électrolyse de l'eau
- **IEC 62282** : Technologies des piles à combustible
- **ISO 19880** : Stations de ravitaillement H2 (gazeuses)
- **ISO 13985** : Réservoirs H2 liquide pour véhicules
- **EN 17124** : Qualité de l'hydrogène pour pile à combustible

### Réglementation ATEX
- L'hydrogène est classé zone ATEX (atmosphères explosives)
- LEL (Limite Explosive Inférieure) : 4% vol. dans l'air
- UEL : 75% vol. — plage d'inflammabilité très large
- Directive 2014/34/UE pour les équipements en zone ATEX
- Formation spécifique obligatoire du personnel

### Sécurité
- Détecteurs H2 (catalytique, électrochimique, semi-conducteur)
- Ventilation obligatoire des locaux de production et stockage
- Distances de sécurité (arrêté français en cours d'élaboration)
- Protocoles d'urgence spécifiques (fuite invisible, pas d'odeur)

---

## 7. Projets de Référence en France

| Projet | Localisation | Capacité | Porteur | Statut |
|--------|-------------|----------|---------|--------|
| HyGreen Provence | Manosque (13) | PV + 240 MW électrolyse | ENGIE + DLVA (pas H2V) | Développement |
| Hynamics (EDF) | Multiple | 40+ MW cumulés | EDF | Opérationnel partiel |
| Lhyfe | Vendée, Nantes, offshore | 5-100 MW | Lhyfe | Opérationnel + extension |
| HysetCo | Paris | Taxis H2 + stations | Air Liquide, Toyota | **En difficulté** — Hype (opérateur taxis) a suspendu ses opérations H2 en 2025 et pivote vers le BEV |
| GENVIA | Béziers (34) | SOEC haute température | CEA, Schlumberger | Pilote |
| CertifHy | France | Certification H2 vert EU | EU | Actif |
| HYnframed (GRTgaz) | Fos-sur-Mer → Manosque | Pipeline ~150 km | GRTgaz | Planification |

---

## 8. Modèle Économique

### LCOH (Levelized Cost of Hydrogen)
| Scénario | LCOH (€/kg) | Compétitif vs H2 gris ? |
|----------|-------------|------------------------|
| PV France 2026 (€30/MWh, 1800h) | €4.5-6.0 | Non (gris = €1.5-2.5) |
| Éolien 2026 (€40/MWh, 3500h) | €3.5-5.0 | Non |
| PV+BESS optimisé 2030 | €2.5-3.5 | Presque |
| Cible EU 2030 | < €2.0 | Oui avec subventions |

### Subventions et soutien
- **IPCEI Hydrogène** : Programme européen de projets importants (€5.4 Mrd)
- **France 2030** : €9 Mrd pour l'hydrogène décarboné
- **Mécanisme de soutien** : appels à projets ADEME, différentiel de compétitivité
- **Quotas H2 vert** : RED III impose des objectifs d'incorporation
