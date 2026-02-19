// ═══════════════════════════════════════════
// Proxiam TypeScript Interfaces — Matrice 6D
// ═══════════════════════════════════════════

export interface Bloc {
  id: number;
  code: string;
  titre: string;
  description: string | null;
  phase_debut: number | null;
  phase_fin: number | null;
}

export interface Phase {
  id: number;
  code: string;
  bloc_id: number | null;
  titre: string;
  description: string | null;
  ordre: number | null;
  duree_jours_min: number | null;
  duree_jours_max: number | null;
  filiere: string[];
  predecesseurs: number[];
  metadata: Record<string, unknown>;
}

export interface Livrable {
  id: number;
  code: string;
  phase_id: number | null;
  titre: string;
  description: string | null;
  type: string | null;
  template_url: string | null;
  obligatoire: boolean;
  metadata: Record<string, unknown>;
}

export interface Norme {
  id: number;
  code: string;
  titre: string;
  reference_legale: string | null;
  organisme: string | null;
  perimetre: string | null;
  date_revision: string | null;
  url: string | null;
  metadata: Record<string, unknown>;
}

export interface Risque {
  id: number;
  code: string;
  titre: string;
  description: string | null;
  categorie: string | null;
  severite: number | null;
  probabilite: number | null;
  impact_financier_eur: number | null;
  impact_delai_jours: number | null;
  mitigation: string | null;
  metadata: Record<string, unknown>;
}

export interface SourceVeille {
  id: number;
  code: string;
  nom: string;
  type: string | null;
  url: string | null;
  frequence: string | null;
  gratuit: boolean;
  metadata: Record<string, unknown>;
}

export interface Outil {
  id: number;
  code: string;
  nom: string;
  editeur: string | null;
  licence: string | null;
  cout_annuel_eur: number | null;
  url: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
}

export interface Competence {
  id: number;
  code: string;
  nom: string;
  pole: string | null;
  niveau_requis: number | null;
  certifications: string[];
  metadata: Record<string, unknown>;
}

export interface Projet {
  id: string;
  nom: string;
  filiere: string | null;
  puissance_mwc: number | null;
  surface_ha: number | null;
  commune: string | null;
  departement: string | null;
  region: string | null;
  statut: string;
  phase_courante_id: number | null;
  score_global: number | null;
  date_creation: string;
  metadata: Record<string, unknown>;
}

export interface PosteSource {
  id: number;
  nom: string;
  gestionnaire: string | null;
  tension_kv: number | null;
  puissance_mw: number | null;
  capacite_disponible_mw: number | null;
  lon: number;
  lat: number;
  source_donnees: string | null;
  date_maj: string | null;
}

export interface ScoreResult {
  projet_id: string;
  score: number;
  details: {
    proximite_reseau: number;
    urbanisme: number;
    environnement: number;
    irradiation: number;
    accessibilite: number;
    risques: number;
  };
}

export interface SearchResult {
  query: string;
  results: Array<{
    type: string;
    id: number;
    titre: string;
    code: string;
    score: number;
  }>;
  total: number;
}

// Phase color mapping
export const PHASE_COLORS: Record<string, string> = {
  P0: "#3b82f6",
  P1: "#8b5cf6",
  P2: "#10b981",
  P3: "#14b8a6",
  P4: "#f59e0b",
  P5: "#ec4899",
  P6: "#6366f1",
  P7: "#64748b",
};

// Node type colors (Knowledge Graph)
export const NODE_COLORS: Record<string, string> = {
  input: "#3b82f6",
  output: "#10b981",
  deliverable: "#f59e0b",
  tool: "#f97316",
  person: "#ec4899",
  repository: "#64748b",
};
