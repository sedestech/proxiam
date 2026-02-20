# 🔗 MATRICE DE CROISEMENT P0 — Prospection & Faisabilité

> Première matrice **E↔L↔S↔R↔V↔T** complète. Pour chaque sous-ensemble de la Phase P0, cette matrice identifie les **livrables** produits, les **normes** applicables, les **risques** à surveiller, les **sources** de données à consulter et les **outils** à utiliser.

---

## Légende des dimensions

| Code | Dimension | Fichier source | Plage P0 |
|------|-----------|---------------|----------|
| **E** | Étapes (phases opérationnelles) | `Bloc1.md` | Phases 1-150 |
| **L** | Livrables (documents produits) | `P0-Livrables.md` | L-001 à L-125 |
| **S** | Normes & Standards | `P0-Normes.md` | S-001 à S-125 |
| **R** | Risques | `P0-Risques.md` | R-001 à R-125 |
| **V** | Sources de Veille | `P0-Sources.md` | V-001 à V-125 |
| **T** | Outils | `1000.md` | T-001 à T-060 |

---

## 1. Analyse SIG & Cartographie (Phases 1-30)

| Étapes | Description | Livrables | Normes | Risques | Sources | Outils |
|--------|-------------|-----------|--------|---------|---------|--------|
| E-001→005 | Acquisition cadastre, PLU, compatibilité urbanistique | L-011→016, L-026→029 | S-001→005, S-017→018 | R-076→080 | V-001→005 | T-001, T-007, T-008, T-012, T-016→018 |
| E-006→010 | Import MNT, analyse topographique, pentes, Corine Land Cover, détection friches | L-001→003, L-010 | S-008→009, S-101→105 | R-051→055 | V-006→009, V-012→015 | T-001, T-002, T-003, T-009, T-015 |
| E-011→015 | Contraintes Natura 2000, ZNIEFF, PPR, servitudes aéronautiques | L-034→035, L-038→040 | S-026→032, S-040→042 | R-056→062 | V-024, V-101→105 | T-001, T-002, T-007 |
| E-016→020 | Servitudes radioélectriques, monuments historiques, sites classés, radar | L-034, L-039 | S-042→050 | R-063→068, R-083→085 | V-002, V-022, V-024 | T-001, T-004, T-007, T-008 |
| E-021→025 | RPG, distance habitations, zones humides, corridors TVB, desserte routière | L-006→010 | S-038→039, S-051→055 | R-069→075 | V-014→015, V-022→024 | T-001, T-006, T-011 |
| E-026→030 | Réseaux souterrains, scoring multicritère, carte synthèse, ZIP, rapport | L-010, L-116→120, L-125 | S-101→110 | R-076→082 | V-001→025 (synthèse) | T-001, T-002, T-012, T-014 |

---

## 2. Réseau Électrique & Raccordement (Phases 31-55)

| Étapes | Description | Livrables | Normes | Risques | Sources | Outils |
|--------|-------------|-----------|--------|---------|---------|--------|
| E-031→035 | S3REnR, identification postes sources, capacités résiduelles, files d'attente | L-056→060 | S-076→080 | R-026→030 | V-026→032 | T-026→029 |
| E-036→040 | Distance raccordement, coût estimé, schéma réseau, puissance max injectable | L-061→065 | S-081→085 | R-031→036 | V-027→030, V-033 | T-026, T-028, T-032 |
| E-041→045 | Qualité réseau, travaux renforcement, congestion, simulation tension | L-066→068 | S-086→090 | R-037→042 | V-027→029, V-037 | T-032→035 |
| E-046→050 | Écrêtement, raccordement HTB, synergies, consultation Enedis/RTE | L-069→070 | S-091→095 | R-042→046 | V-030→034, V-038 | T-026, T-030, T-032 |
| E-051→055 | Réactif, plan développement, délai, contraintes tracé, BESS couplé, note synthèse | L-056→070 (synthèse) | S-076→100 | R-047→050 | V-026→050 (synthèse) | T-026→035 |

---

## 3. Prospection Foncière (Phases 56-85)

| Étapes | Description | Livrables | Normes | Risques | Sources | Outils |
|--------|-------------|-----------|--------|---------|---------|--------|
| E-056→060 | DVF, identification propriétaires, contact initial, vérification droits | L-011→015, L-017→020 | S-051→055 | R-001→005 | V-051→055, V-003 | T-016→020, T-022 |
| E-061→065 | Négociation foncière, benchmark loyers, stratégie multi-propriétaires | L-041→045 | S-056→060 | R-006→012 | V-051→060 | T-019, T-020, T-024 |
| E-066→070 | Rédaction baux, promesses, conditions suspensives, notaire | L-046→055 | S-061→065 | R-013→018 | V-055→060 | T-020, T-021 |
| E-071→075 | Accords SAFER, droit de préemption, servitudes de passage | L-036, L-041→043 | S-066→070 | R-003, R-019→022 | V-051→055 | T-019, T-022, T-024 |
| E-076→080 | AgriPV qualification, classement CDPENAF, bail rural cohabitation | L-015, L-021→025 | S-071→075 | R-023→025, R-051→053 | V-061→070 | T-019, T-001 |
| E-081→085 | Synthèse foncière, plan masse, sécurisation juridique finale | L-024→025, L-116→120 | S-051→075 (synthèse) | R-001→025 (synthèse) | V-051→075 (synthèse) | T-016→025 |

---

## 4. Estimation du Productible (Phases 86-110)

| Étapes | Description | Livrables | Normes | Risques | Sources | Outils |
|--------|-------------|-----------|--------|---------|---------|--------|
| E-086→090 | Données météo, irradiation GHI/DNI/DHI, historique 10+ ans | L-071→075 | S-101→105 | R-101→105 | V-076→082 | T-036→040 |
| E-091→095 | Simulation PV : pvlib, PVsyst pré-étude, pertes système | L-076→080 | S-106→110 | R-106→110 | V-076→085 | T-036, T-037, T-041, T-042 |
| E-096→100 | Simulation éolien : rose des vents, distribution Weibull, courbe de puissance | L-076→080 | S-111→115 | R-106→110 | V-083→090 | T-046→052 |
| E-101→105 | Analyse d'incertitude P50/P75/P90, dégradation long terme, facteur de charge | L-081→085 | S-106→115 | R-111→115 | V-076→090 | T-036→042, T-046→052 |
| E-106→110 | Rapport de productible, benchmarking, sensibilité technologique | L-071→085 (synthèse) | S-101→120 | R-101→115 | V-076→100 (synthèse) | T-036→055 |

---

## 5. Faisabilité Économique (Phases 111-130)

| Étapes | Description | Livrables | Normes | Risques | Sources | Outils |
|--------|-------------|-----------|--------|---------|---------|--------|
| E-111→115 | CAPEX estimé : modules, onduleurs, structure, BOS, raccordement | L-086→090 | S-076→080 (réseau) | R-116→118 | V-091→095 | T-056→058 |
| E-116→120 | OPEX estimé : O&M, assurance, foncier, taxe, IFER | L-091→095 | S-051→060 (foncier) | R-119→121 | V-091→095 | T-056→058 |
| E-121→125 | Revenus : tarif OA/CR, PPA corporate, marché spot, GO | L-096→100 | S-076→095 (marché) | R-122→124 | V-091→100 | T-056→060 |
| E-126→130 | Business plan, TRI, VAN, LCOE, DSCR, sensibilité, note comité invest | L-086→100 (synthèse), L-121→125 | S-076→100 | R-116→125 | V-091→100 | T-056→060 |

---

## 6. Pré-analyse Réglementaire (Phases 131-150)

| Étapes | Description | Livrables | Normes | Risques | Sources | Outils |
|--------|-------------|-----------|--------|---------|---------|--------|
| E-131→135 | Identification régime ICPE/EIE, seuils, cas par cas MRAe | L-101→105 | S-001→015, S-026→030 | R-076→082 | V-101→110 | T-001, T-007, T-008 |
| E-136→140 | Pré-diagnostic environnemental, sensibilité faune/flore, zone humide | L-106→110 | S-026→050 | R-056→075 | V-024, V-101→115 | T-001, T-003 |
| E-141→145 | Pré-consultation ABF, DGAC, DREAL, mairie, concertation préalable | L-032, L-034, L-111→115 | S-042→050 | R-083→090, R-076→082 | V-101→120 | T-007, T-008 |
| E-146→150 | Synthèse Go/No-Go, rapport de faisabilité globale, décision comité | L-116→125 | S-001→125 (synthèse) | R-001→125 (synthèse) | V-001→125 (synthèse) | T-001→060 (synthèse) |

---

## Synthèse : Couverture croisée

| Dimension | Codes P0 | Total éléments | Couverture dans la matrice |
|-----------|----------|---------------|---------------------------|
| Étapes (E) | 1-150 | 150 phases | 100% (6 sous-ensembles) |
| Livrables (L) | L-001 à L-125 | 125 livrables | 100% |
| Normes (S) | S-001 à S-125 | 125 normes | 100% |
| Risques (R) | R-001 à R-125 | 125 risques | 100% |
| Sources (V) | V-001 à V-125 | 125 sources | 100% |
| Outils (T) | T-001 à T-060 | 60 outils | 100% |

**Total** : **710 éléments croisés** dans une seule matrice.

---

## Observations clés

1. **Densité de risques maximale en phases 56-85 (Foncier)** — 25 risques (R-001→R-025) pour 30 phases. Le foncier est la zone la plus risquée de la prospection : indivision, préemption SAFER, baux en cours, erreurs cadastrales. C'est aussi la zone la moins automatisable.

2. **Les outils SIG (T-001→T-015) sont transversaux** — Ils interviennent dans 5 des 6 sous-ensembles. QGIS (T-001) est l'outil le plus référencé de toute la matrice, suivi du Géoportail (T-007) et de PostGIS (T-012).

3. **Les normes d'urbanisme (S-001→S-025) conditionnent tout** — Elles sont le premier filtre : si le PLU interdit l'installation, aucune autre analyse n'a de sens. C'est pourquoi la phase E-001→005 est séquentielle et non parallélisable.

4. **Le raccordement réseau est le 2e filtre éliminatoire** — Les sources V-026→V-050 (RTE Capareseau, ODRÉ, Enedis) sont critiques : un poste source saturé tue le projet instantanément. VeilleMarche couvre déjà 80% de ces sources.

5. **Les phases 146-150 (Go/No-Go) croisent TOUTES les dimensions** — C'est le point de convergence où les 710 éléments se synthétisent en une décision binaire. Le livrable L-125 (rapport de faisabilité globale) est le document le plus critique de P0.

6. **Asymétrie Sources/Outils par sous-ensemble** — L'estimation du productible (E-086→110) utilise le plus grand nombre d'outils spécialisés (T-036→T-055, soit 20 outils) mais relativement peu de normes (S-101→S-120). Inversement, la pré-analyse réglementaire (E-131→150) mobilise le plus grand nombre de normes (S-001→S-125) mais peu d'outils dédiés.

7. **Le scoring multicritère (E-027) est le nœud central** — Il consomme les outputs de toutes les phases précédentes (E-001→026) et produit le livrable le plus stratégique de la sous-section SIG (L-116→L-120). C'est le candidat idéal pour l'automatisation IA (algorithme de scoring pondéré).
