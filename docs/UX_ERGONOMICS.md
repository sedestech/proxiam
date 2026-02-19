# Étude Ergonomique — Proxiam OS ENR

## Philosophie de design

**Proxiam est un outil professionnel B2B, pas une application grand public.**

Le design doit inspirer **confiance et maîtrise** à des ingénieurs, chefs de projet et directeurs de développement ENR. Pas de fioritures, pas de cartoon, pas de gadgets. Chaque pixel sert un objectif métier.

### Références visuelles

| Référence | Ce qu'on prend | Ce qu'on évite |
|-----------|---------------|----------------|
| **Linear** | Sidebar minimaliste, transitions fluides, densité d'info | — |
| **Apple Health** | Jauges circulaires, couleurs par catégorie, progressions animées | Trop de blanc |
| **Notion** | Blocs modulaires, navigation par breadcrumb | Pages trop longues |
| **Figma** | Canvas infini, outils contextuels, sidebar de propriétés | — |
| **Nexus-Flow** (notre actif) | Phases en colonnes colorées, nodes typés, connections SVG | — |
| **Bloomberg Terminal** | Densité d'information, data-first, KPIs partout | UX élitiste |

### Ce qu'on ne fait PAS
- Duolingo : pas de badges cartoon, pas de streaks gamifiés artificiels
- Notion : pas de pages infinies non structurées
- Salesforce : pas de surcharge de menus et onglets
- Jira : pas de workflows bureaucratiques incompréhensibles

---

## Principes fondamentaux

### 1. Mobile-first, Desktop-rich

| Breakpoint | Comportement |
|------------|-------------|
| `< 768px` (mobile) | Bottom nav 5 items, cartes full-width, gestes tactiles natifs |
| `768px - 1024px` (tablet) | Sidebar collapsible, grille 2 colonnes |
| `> 1024px` (desktop) | Sidebar fixe 260px, grille 3-4 colonnes, panels détail |

**Règle** : toute fonctionnalité doit être utilisable sur mobile. La carte, le graphe et le dashboard sont conçus touch-first.

### 2. Data density without clutter

Inspiré Bloomberg et Linear : afficher beaucoup d'information sans surcharger.

**Techniques** :
- **Progressive disclosure** : résumé visible, détail au clic
- **Hover reveal** : actions secondaires visibles au survol
- **Inline editing** : pas de modales pour les modifications simples
- **Sparklines** : mini-graphes dans les tableaux (vélocité, tendances)
- **Color-coding** : phases, risques, statuts codés par couleur

### 3. Animations subtiles, jamais gratuites

| Animation | Usage | Durée | Easing |
|-----------|-------|-------|--------|
| Page transition | Changement de page | 200ms | ease-out |
| Card hover | Élévation + ombre | 150ms | ease-out |
| Score fill | Remplissage jauge circulaire | 800ms | ease-out |
| Alert pulse | Risque critique | 2s loop | linear |
| Slide up | Apparition de contenu | 300ms | ease-out |
| Fade in | Chargement de données | 300ms | ease-out |

**Interdit** : bounce, spring excessif, animations > 1s pour des éléments UI courants.

### 4. Accessibilité (WCAG 2.1 AA)

- **Contraste** : ratio minimum 4.5:1 pour le texte, 3:1 pour les éléments graphiques
- **Focus visible** : outline clair sur tous les éléments interactifs
- **Navigation clavier** : Tab, Enter, Escape fonctionnels partout
- **Labels ARIA** : sur tous les boutons d'icônes
- **Taille tactile** : minimum 44x44px pour les boutons mobiles
- **Réduit les animations** : respect de `prefers-reduced-motion`

---

## Design System

### Palette de couleurs

```
Background       : slate-50  (#f8fafc)     — Fond principal
Surface          : white     (#ffffff)     — Cartes, panneaux
Text primary     : slate-900 (#0f172a)     — Texte principal
Text secondary   : slate-500 (#64748b)     — Labels, descriptions
Text muted       : slate-400 (#94a3b8)     — Placeholders
Border           : slate-200 (#e2e8f0)     — Bordures cartes
Primary action   : indigo-500 (#6366f1)    — Boutons principaux
Primary hover    : indigo-600 (#4f46e5)    — Hover
Success          : emerald-500 (#10b981)   — Validations
Warning          : amber-500 (#f59e0b)     — Alertes modérées
Danger           : red-500   (#ef4444)     — Erreurs, risques critiques
```

### Palette phases (P0-P7)

Chaque phase a une couleur unique, reconnaissable instantanément :

```
P0 Prospection     : blue-500    (#3b82f6)
P1 Ingénierie      : violet-500  (#8b5cf6)
P2 Autorisations   : emerald-500 (#10b981)
P3 Finance         : teal-500    (#14b8a6)
P4 Construction    : amber-500   (#f59e0b)
P5 Commissioning   : pink-500    (#ec4899)
P6 Exploitation    : indigo-500  (#6366f1)
P7 Démantèlement   : slate-500   (#64748b)
```

### Typographie

| Usage | Font | Weight | Size |
|-------|------|--------|------|
| Headings | Inter | 700 (Bold) | 24px / 20px / 18px |
| Body | Inter | 400 (Regular) | 14px |
| Labels | Inter | 500 (Medium) | 12px |
| Data / Mono | JetBrains Mono | 500 | 14px |
| KPI values | Inter | 700 | 28px |

### Espacement

Basé sur une grille de 4px :
- `p-1` (4px), `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-5` (20px), `p-6` (24px)
- Gap standard entre cartes : `gap-4` (16px)
- Padding de page : `p-4` (mobile), `p-6` (desktop)

### Bordures et ombres

- **Bordures** : `border border-slate-200` (1px, subtile)
- **Rayon** : `rounded-xl` (12px) pour les cartes, `rounded-lg` (8px) pour les boutons
- **Ombre repos** : `shadow-sm` (légère)
- **Ombre hover** : `shadow-md` (plus prononcée)

---

## Composants clés

### 1. Score Ring (Apple Watch style)

Jauge circulaire SVG pour le score projet 0-100 :
- Anneau extérieur : score global (0-100, coloré du rouge au vert)
- 6 segments internes : axes du radar (réseau, urbanisme, environnement, irradiation, accessibilité, risques)
- Animation de remplissage au chargement (800ms ease-out)
- Cliquable → détail du score

### 2. Phase Badge

Indicateur de phase compact :
- Pastille colorée (couleur de phase) + code + nom
- `rounded-full`, padding compact
- Utilisé dans les tableaux, les popups carte, le graphe

### 3. Risk Thermometer

Indicateur de niveau de risque :
- Gradient froid→chaud (bleu→rouge)
- Pulse animé sur les risques critiques (sévérité 5)
- Tooltip avec sévérité × probabilité

### 4. KPI Card

Carte de métrique :
- Icône colorée (fond transparent) + valeur grande + label
- Sparkline optionnel (tendance sur 7 jours)
- Hover : détail de la donnée

### 5. Knowledge Node (React Flow)

Noeud typé dans le graphe 6D :
- Couleur par type (phase=blue, norme=green, risque=red, outil=orange, livrable=amber, personne=pink)
- Code affiché en header
- Titre en body
- Handles de connexion latéraux
- Sélection → panneau de détail latéral

### 6. Map Popup

Popup d'information sur la carte :
- Titre en gras, sous-titre en gris
- KPIs inline (tension, puissance, capacité)
- Bouton d'action principal (voir projet, analyser)
- Bordure gauche colorée (couleur de phase ou statut)

---

## Gamification professionnelle

### Règle fondamentale

**Chaque élément gamifié est adossé à un KPI métier réel. Aucun élément décoratif.**

Si un chiffre s'affiche, il est cliquable et mène à la donnée brute. La gamification est la **couche de lecture** de la matrice 6D, pas un jeu.

### Mécanismes

| Mécanisme | UI | KPI sous-jacent |
|-----------|-----|-----------------|
| Score Projet 0-100 | Jauge circulaire (Score Ring) | Multicritère : réseau, urbanisme, environnement, irradiation |
| Maturité Phase | Barre segmentée P0→P7 | Ratio livrables produits / attendus |
| Niveau de Risque | Risk Thermometer | Somme pondérée sévérité × probabilité |
| Couverture 6D | Radar chart 6 branches | % matrice renseignée et à jour |
| Alertes Actives | Badge numérique rouge | Alertes veille non traitées + risques non mitigés |
| Vélocité | Sparkline | Livrables/semaine |
| Milestones | Timeline avec checkpoints | Jalons réglementaires (PC, raccordement, PAC) |

### Ton visuel

- **Apple Health** : propre, couleurs vives sur fond blanc
- **Linear** : typographie nette, micro-interactions
- **Pas Duolingo** : pas de mascotte, pas de streaks forcés, pas de confettis

---

## Vues principales

### 1. Dashboard

```
┌──────────────────────────────────────────────┐
│ [KPI] Projets  [KPI] Phases  [KPI] Risques  │
│                                              │
│ ┌─────────────────┐  ┌──────────────────┐    │
│ │ Matrice 6D       │  │ Activité récente │    │
│ │ ■ Phases    1061 │  │ ...              │    │
│ │ ■ Livrables  975 │  │ ...              │    │
│ │ ■ Normes     943 │  │ ...              │    │
│ │ ■ Risques    811 │  └──────────────────┘    │
│ └─────────────────┘                           │
│ ┌────────────────────────────────────────┐    │
│ │ Infrastructure : 4847 postes sources   │    │
│ └────────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### 2. Carte SIG (plein écran)

```
┌──────────────────────────────────────────────┐
│ [Layers] [Filters] [Draw]          [Zoom +-] │
│                                              │
│         ┌────────┐                           │
│     •   │ Popup  │    •  •                   │
│  •      │ Detail │         •                 │
│    •    └────────┘  •                        │
│         •           •    •                   │
│  •              •                            │
│                                              │
│ [Legend] ■ Postes  ■ Projets  ■ Contraintes  │
└──────────────────────────────────────────────┘
```

### 3. Knowledge Graph

```
┌──────────────────────────────────────────────┐
│ [Search] [Filter by type] [Filter by phase]  │
│                                              │
│      ┌───┐          ┌───┐                    │
│      │P0 │──────────│S01│                    │
│      └─┬─┘          └───┘                    │
│        │    ┌───┐                             │
│        ├────│R01│                             │
│        │    └───┘                             │
│      ┌─┴─┐          ┌───┐                    │
│      │L01│──────────│T01│                    │
│      └───┘          └───┘                    │
│                                              │
│ [Minimap]                    [Detail Panel]  │
└──────────────────────────────────────────────┘
```

---

## Interactions clés

| Action | Résultat |
|--------|---------|
| Clic sur un KPI | Navigation vers la vue détaillée |
| Clic sur un noeud du graphe | Panneau de détail avec liens croisés |
| Clic sur un point de la carte | Popup avec KPIs et actions |
| Hover sur une carte | Élévation + ombre + actions révélées |
| Scroll sur le dashboard | Chargement progressif des sections |
| Recherche globale (Ctrl+K) | Résultats en temps réel (Meilisearch) |
| Changement de langue | Transition instantanée FR↔EN |
| Swipe gauche/droite (mobile) | Navigation entre vues |

---

## Performance perçue

- **Skeleton loading** : placeholders pendant le chargement des données
- **Optimistic UI** : les actions reflètent immédiatement l'état souhaité
- **Stale-while-revalidate** : React Query affiche le cache puis rafraîchit
- **Lazy loading** : composants lourds (carte, graphe, 3D) chargés à la demande
- **Code splitting** : chaque page = chunk séparé
