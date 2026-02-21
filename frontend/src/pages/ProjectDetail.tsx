import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ArrowLeft,
  MapPin,
  Sun,
  Wind,
  Battery,
  Zap,
  RefreshCw,
  Check,
  Clock,
  Circle,
  Target,
  Brain,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Pencil,
  Trash2,
  Upload,
  FileText,
  Download,
  File,
  Image,
  FileSpreadsheet,
  Leaf,
  Thermometer,
  Loader2,
} from "lucide-react";
import api from "../lib/api";
import ProjectForm from "../components/ProjectForm";

function fileTypeIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext))
    return <FileText className="h-5 w-5 shrink-0 text-red-400" />;
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return <Image className="h-5 w-5 shrink-0 text-blue-400" />;
  if (["xls", "xlsx", "csv"].includes(ext))
    return <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-400" />;
  if (["doc", "docx"].includes(ext))
    return <FileText className="h-5 w-5 shrink-0 text-blue-500" />;
  return <File className="h-5 w-5 shrink-0 text-slate-400" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface Projet {
  id: string;
  nom: string;
  filiere: string | null;
  puissance_mwc: number | null;
  surface_ha: number | null;
  commune: string | null;
  departement: string | null;
  region: string | null;
  statut: string;
  score_global: number | null;
  lon: number | null;
  lat: number | null;
}

interface PhaseBloc {
  code: string;
  titre: string;
  statut: string;
  completion_pct: number;
}

interface ScoreResult {
  projet_id: string;
  score: number;
  details: Record<string, number>;
  weights: Record<string, number>;
  filiere: string | null;
}

interface AIInsight {
  criterion: string;
  value: number;
  insight: string;
}

interface AIAnalysis {
  summary: string;
  strengths: string[];
  risks: string[];
  next_steps: string[];
  score_insights: AIInsight[];
  phase_summary: string;
  source: "claude" | "template";
}

interface AIAnalysisResponse {
  projet_id: string;
  projet_nom: string;
  analysis: AIAnalysis;
}

interface EnrichmentData {
  projet_id: string;
  enriched: boolean;
  pvgis?: {
    ghi_kwh_m2_an: number | null;
    productible_kwh_kwc_an: number | null;
    temperature_moyenne: number | null;
    source: string;
  };
  constraints?: {
    natura2000: { code: string; nom: string; type_zone: string; intersects: boolean; distance_m: number }[];
    znieff: { code: string; nom: string; type_zone: string; intersects: boolean; distance_m: number }[];
    summary: { total_constraints: number; in_zone: number; nearby: number };
  };
  nearest_postes?: {
    nom: string; gestionnaire: string; distance_km: number;
    capacite_disponible_mw: number | null; tension_kv: number | null;
  }[];
  enriched_at?: string;
}

const CRITERIA_KEYS = [
  "proximite_reseau",
  "urbanisme",
  "environnement",
  "irradiation",
  "accessibilite",
  "risques",
] as const;

const CRITERIA_COLORS: Record<string, string> = {
  proximite_reseau: "#3b82f6",
  urbanisme: "#8b5cf6",
  environnement: "#10b981",
  irradiation: "#f59e0b",
  accessibilite: "#f97316",
  risques: "#ef4444",
};

function filiereIcon(filiere: string | null) {
  switch (filiere) {
    case "solaire_sol":
      return <Sun className="h-5 w-5 text-amber-500" />;
    case "eolien_onshore":
      return <Wind className="h-5 w-5 text-blue-500" />;
    case "bess":
      return <Battery className="h-5 w-5 text-emerald-500" />;
    default:
      return <Zap className="h-5 w-5 text-slate-400" />;
  }
}

function filiereLabel(filiere: string | null): string {
  switch (filiere) {
    case "solaire_sol":
      return "Solaire sol";
    case "eolien_onshore":
      return "Eolien onshore";
    case "bess":
      return "BESS (Stockage)";
    default:
      return filiere || "—";
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function cleanBlocTitle(titre: string): string {
  // Remove emoji prefix and BLOC N: prefix
  return titre
    .replace(/^[^\w]+ /, "")
    .replace(/^BLOC \d+ : /, "")
    .replace(/ \(\d+-\d+\)$/, "");
}

/** Phase workflow step */
function WorkflowStep({
  bloc,
  isLast,
  onUpdate,
}: {
  bloc: PhaseBloc;
  isLast: boolean;
  onUpdate?: (pct: number) => void;
}) {
  const statusIcon =
    bloc.statut === "termine" ? (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
        <Check className="h-4 w-4 text-white" />
      </div>
    ) : bloc.statut === "en_cours" ? (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-500 bg-primary-50">
        <Clock className="h-4 w-4 text-primary-500" />
      </div>
    ) : (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-200 bg-white">
        <Circle className="h-3 w-3 text-slate-300" />
      </div>
    );

  const progressColor =
    bloc.statut === "termine"
      ? "bg-emerald-500"
      : bloc.statut === "en_cours"
        ? "bg-primary-500"
        : "bg-slate-200";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        {statusIcon}
        {!isLast && (
          <div
            className={`mt-1 w-0.5 flex-1 ${
              bloc.statut === "termine" ? "bg-emerald-300" : "bg-slate-200"
            }`}
          />
        )}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">
              {bloc.code}
            </span>
            <p className="text-sm font-medium text-slate-900">
              {cleanBlocTitle(bloc.titre)}
            </p>
          </div>
          <span className="font-mono text-sm text-slate-500">
            {bloc.completion_pct}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className={`h-1.5 rounded-full ${progressColor} transition-all duration-500`}
            style={{ width: `${Math.max(bloc.completion_pct, 2)}%` }}
          />
        </div>
        {onUpdate && (
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={bloc.completion_pct}
            onChange={(e) => onUpdate(Number(e.target.value))}
            className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full accent-primary-500"
          />
        )}
      </div>
    </div>
  );
}

/** Score gauge (compact) */
function ScoreGauge({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke="#e2e8f0" strokeWidth="8"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold font-mono" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

interface DocumentItem {
  id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size_bytes: number;
  category: string;
  description: string | null;
  uploaded_at: string | null;
}

function ghiColor(ghi: number | null): string {
  if (ghi === null) return "text-slate-400";
  if (ghi >= 1400) return "text-emerald-600";
  if (ghi >= 1200) return "text-amber-600";
  return "text-red-500";
}

function ghiBg(ghi: number | null): string {
  if (ghi === null) return "bg-slate-50";
  if (ghi >= 1400) return "bg-emerald-50";
  if (ghi >= 1200) return "bg-amber-50";
  return "bg-red-50";
}

type TabKey = "overview" | "phases" | "score" | "ai" | "documents";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: projet, isLoading } = useQuery<Projet>({
    queryKey: ["projet", id],
    queryFn: async () => {
      const res = await api.get(`/api/projets/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: phases } = useQuery<PhaseBloc[]>({
    queryKey: ["projet-phases", id],
    queryFn: async () => {
      const res = await api.get(`/api/projets/${id}/phases`);
      return res.data;
    },
    enabled: !!id,
  });

  const scoreMutation = useMutation<ScoreResult, Error, string>({
    mutationFn: async (projetId: string) => {
      const res = await api.post(`/api/projets/${projetId}/score`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projet", id] });
    },
  });

  const aiMutation = useMutation<AIAnalysisResponse, Error, string>({
    mutationFn: async (projetId: string) => {
      const res = await api.post(`/api/projets/${projetId}/analyze`);
      return res.data;
    },
  });

  const { data: enrichment, refetch: refetchEnrichment } = useQuery<EnrichmentData>({
    queryKey: ["projet-enrichment", id],
    queryFn: async () => {
      const res = await api.get(`/api/projets/${id}/enrichment`);
      return res.data;
    },
    enabled: !!id,
  });

  const enrichMutation = useMutation<EnrichmentData, Error, string>({
    mutationFn: async (projetId: string) => {
      const res = await api.post(`/api/projets/${projetId}/enrich`);
      return res.data;
    },
    onSuccess: () => {
      refetchEnrichment();
      queryClient.invalidateQueries({ queryKey: ["projet", id] });
    },
  });

  const scoreData = scoreMutation.data;

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        {t("common.loading")}
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        Projet non trouve
      </div>
    );
  }

  // Compute overall progression
  const completedBlocs = phases?.filter((p) => p.statut === "termine").length ?? 0;
  const totalBlocs = phases?.length ?? 8;
  const overallPct = phases
    ? Math.round(phases.reduce((sum, p) => sum + p.completion_pct, 0) / totalBlocs)
    : 0;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: t("projects.tabOverview") },
    { key: "phases", label: t("projects.tabPhases") },
    { key: "score", label: t("projects.tabScore") },
    { key: "ai", label: t("ai.tabLabel") },
    { key: "documents", label: t("documents.tabLabel") },
  ];

  const { data: documents, refetch: refetchDocs } = useQuery<DocumentItem[]>({
    queryKey: ["projet-documents", id],
    queryFn: async () => {
      const res = await api.get(`/api/documents?projet_id=${id}`);
      return res.data.documents;
    },
    enabled: !!id && activeTab === "documents",
  });

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async (file: globalThis.File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projet_id", id || "");
      formData.append("category", "general");
      await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      refetchDocs();
    } catch {
      // handled by error boundary
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/projects"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {filiereIcon(projet.filiere)}
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {projet.nom}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("common.edit")}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("common.delete")}
              </button>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {projet.commune && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {projet.commune}
                {projet.departement && ` (${projet.departement})`}
              </span>
            )}
            <span className="text-slate-300">|</span>
            <span>{filiereLabel(projet.filiere)}</span>
            {projet.puissance_mwc && (
              <>
                <span className="text-slate-300">|</span>
                <span className="font-mono">{projet.puissance_mwc} MWc</span>
              </>
            )}
            <span className="text-slate-300">|</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                {
                  prospection: "bg-blue-50 text-blue-700",
                  ingenierie: "bg-violet-50 text-violet-700",
                  autorisation: "bg-amber-50 text-amber-700",
                  construction: "bg-emerald-50 text-emerald-700",
                  exploitation: "bg-teal-50 text-teal-700",
                }[projet.statut] || "bg-slate-50 text-slate-700"
              }`}
            >
              {projet.statut}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-primary-500 text-primary-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Progression summary */}
            <div className="card">
              <h3 className="mb-4 text-sm font-medium text-slate-500">
                {t("projects.progression")}
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900">{overallPct}%</p>
                  <p className="text-xs text-slate-400">{t("projects.overall")}</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {completedBlocs}/{totalBlocs} {t("projects.blocsCompleted")}
                  </p>
                </div>
              </div>
            </div>

            {/* Score card */}
            <div className="card flex flex-col items-center">
              <h3 className="mb-3 text-sm font-medium text-slate-500">
                {t("scoring.globalScore")}
              </h3>
              {projet.score_global !== null ? (
                <ScoreGauge score={projet.score_global} />
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Target className="h-8 w-8 text-slate-300" />
                  <button
                    onClick={() => id && scoreMutation.mutate(id)}
                    className="flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600"
                  >
                    {t("scoring.calculate")}
                  </button>
                </div>
              )}
            </div>

            {/* Project info */}
            <div className="card space-y-3">
              <h3 className="text-sm font-medium text-slate-500">
                {t("scoring.projectInfo")}
              </h3>
              <div className="space-y-2 text-sm">
                {projet.region && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t("scoring.region")}</span>
                    <span className="text-slate-700">{projet.region}</span>
                  </div>
                )}
                {projet.surface_ha && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t("scoring.surface")}</span>
                    <span className="font-mono text-slate-700">
                      {projet.surface_ha} ha
                    </span>
                  </div>
                )}
                {projet.lon && projet.lat && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coordonnees</span>
                    <span className="font-mono text-xs text-slate-700">
                      {projet.lat.toFixed(4)}, {projet.lon.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enrichment: Site Data widget */}
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Leaf className="h-4 w-4 text-emerald-500" />
                {t("enrichment.title")}
              </h3>
              <button
                onClick={() => id && enrichMutation.mutate(id)}
                disabled={enrichMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {enrichMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {enrichMutation.isPending
                  ? t("enrichment.enriching")
                  : enrichment?.enriched
                    ? t("scoring.recalculate")
                    : t("enrichment.enrich")}
              </button>
            </div>

            {enrichment?.enriched ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Irradiation GHI */}
                <div className={`rounded-lg p-3 ${ghiBg(enrichment.pvgis?.ghi_kwh_m2_an ?? null)}`}>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-slate-500">
                      {t("enrichment.irradiation")}
                    </span>
                  </div>
                  <p className={`mt-1 text-xl font-bold font-mono ${ghiColor(enrichment.pvgis?.ghi_kwh_m2_an ?? null)}`}>
                    {enrichment.pvgis?.ghi_kwh_m2_an ?? "—"}
                    <span className="ml-1 text-xs font-normal text-slate-400">kWh/m2/an</span>
                  </p>
                </div>

                {/* Productible */}
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-slate-500">
                      {t("enrichment.productible")}
                    </span>
                  </div>
                  <p className="mt-1 text-xl font-bold font-mono text-blue-600">
                    {enrichment.pvgis?.productible_kwh_kwc_an ?? "—"}
                    <span className="ml-1 text-xs font-normal text-slate-400">kWh/kWc/an</span>
                  </p>
                </div>

                {/* Temperature */}
                <div className="rounded-lg bg-orange-50 p-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-slate-500">
                      {t("enrichment.temperature")}
                    </span>
                  </div>
                  <p className="mt-1 text-xl font-bold font-mono text-orange-600">
                    {enrichment.pvgis?.temperature_moyenne != null
                      ? `${enrichment.pvgis.temperature_moyenne}°C`
                      : "—"}
                  </p>
                </div>

                {/* Constraints summary */}
                <div className={`rounded-lg p-3 ${
                  (enrichment.constraints?.summary.in_zone ?? 0) > 0
                    ? "bg-red-50"
                    : (enrichment.constraints?.summary.nearby ?? 0) > 0
                      ? "bg-amber-50"
                      : "bg-emerald-50"
                }`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`h-4 w-4 ${
                      (enrichment.constraints?.summary.in_zone ?? 0) > 0
                        ? "text-red-500"
                        : (enrichment.constraints?.summary.nearby ?? 0) > 0
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`} />
                    <span className="text-xs text-slate-500">
                      {t("enrichment.constraints")}
                    </span>
                  </div>
                  {(enrichment.constraints?.summary.total_constraints ?? 0) === 0 ? (
                    <p className="mt-1 text-sm font-medium text-emerald-600">
                      {t("enrichment.noConstraints")}
                    </p>
                  ) : (
                    <div className="mt-1 space-y-0.5">
                      {(enrichment.constraints?.summary.in_zone ?? 0) > 0 && (
                        <p className="text-sm font-medium text-red-600">
                          {enrichment.constraints!.summary.in_zone} {t("enrichment.inZone")}
                        </p>
                      )}
                      {(enrichment.constraints?.summary.nearby ?? 0) > 0 && (
                        <p className="text-sm font-medium text-amber-600">
                          {enrichment.constraints!.summary.nearby} {t("enrichment.nearby")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-slate-200 py-6 text-slate-400">
                <Leaf className="h-8 w-8" />
                <p className="mt-2 text-sm">{t("enrichment.notEnriched")}</p>
                <p className="mt-1 text-xs text-slate-300">
                  PVGIS + Natura 2000 + ZNIEFF + Postes sources
                </p>
              </div>
            )}

            {/* Constraint details + Nearest postes */}
            {enrichment?.enriched && (
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Constraint zones list */}
                {(enrichment.constraints?.natura2000?.length ?? 0) + (enrichment.constraints?.znieff?.length ?? 0) > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-slate-400 uppercase">
                      {t("enrichment.constraints")}
                    </h4>
                    <div className="space-y-1.5">
                      {enrichment.constraints?.natura2000?.map((z) => (
                        <div key={z.code} className="flex items-center gap-2 text-xs">
                          <span className={`inline-block h-2 w-2 rounded-full ${z.intersects ? "bg-red-500" : "bg-amber-400"}`} />
                          <span className="font-medium text-slate-600">{t("enrichment.natura2000")}</span>
                          <span className="truncate text-slate-500">{z.nom}</span>
                          <span className="ml-auto font-mono text-slate-400">
                            {z.distance_m < 1000 ? `${z.distance_m} m` : `${(z.distance_m / 1000).toFixed(1)} km`}
                          </span>
                        </div>
                      ))}
                      {enrichment.constraints?.znieff?.map((z) => (
                        <div key={z.code} className="flex items-center gap-2 text-xs">
                          <span className={`inline-block h-2 w-2 rounded-full ${z.intersects ? "bg-red-500" : "bg-amber-400"}`} />
                          <span className="font-medium text-slate-600">{t("enrichment.znieff")} {z.type_zone}</span>
                          <span className="truncate text-slate-500">{z.nom}</span>
                          <span className="ml-auto font-mono text-slate-400">
                            {z.distance_m < 1000 ? `${z.distance_m} m` : `${(z.distance_m / 1000).toFixed(1)} km`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearest postes */}
                {enrichment.nearest_postes && enrichment.nearest_postes.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-slate-400 uppercase">
                      {t("enrichment.nearestPostes")}
                    </h4>
                    <div className="space-y-2">
                      {enrichment.nearest_postes.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 p-2.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-slate-700">{p.nom}</p>
                            <p className="text-xs text-slate-400">
                              {p.gestionnaire}
                              {p.tension_kv && ` · ${p.tension_kv} kV`}
                              {p.capacite_disponible_mw != null && ` · ${p.capacite_disponible_mw} MW dispo`}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-medium text-primary-600">
                            {p.distance_km} km
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Source + date */}
            {enrichment?.enriched && enrichment.pvgis?.source && (
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <span>
                  {t("enrichment.source")}: {enrichment.pvgis.source === "pvgis_api" ? t("enrichment.pvgisApi") : t("enrichment.fallback")}
                </span>
                {enrichment.enriched_at && (
                  <span>
                    · {t("enrichment.enrichedAt")} {new Date(enrichment.enriched_at).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Phases */}
      {activeTab === "phases" && phases && (
        <div className="card max-w-2xl">
          <h3 className="mb-4 text-sm font-medium text-slate-500">
            {t("projects.workflowTitle")}
          </h3>
          <div>
            {phases.map((bloc, i) => (
              <WorkflowStep
                key={bloc.code}
                bloc={bloc}
                isLast={i === phases.length - 1}
                onUpdate={async (pct) => {
                  try {
                    await api.put(
                      `/api/projets/${id}/phases/${bloc.code}?completion_pct=${pct}`
                    );
                    queryClient.invalidateQueries({ queryKey: ["projet-phases", id] });
                  } catch { /* ignore */ }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab: Score */}
      {activeTab === "score" && (
        <div className="space-y-4">
          {!scoreData && (
            <div className="card flex flex-col items-center py-8">
              <Target className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                {t("scoring.noProject")}
              </p>
              <button
                onClick={() => id && scoreMutation.mutate(id)}
                disabled={scoreMutation.isPending}
                className="mt-3 flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {scoreMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
                {t("scoring.calculate")}
              </button>
            </div>
          )}

          {scoreData && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Radar */}
              <div className="card">
                <h3 className="mb-4 text-sm font-medium text-slate-500">
                  {t("scoring.radarTitle")}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart
                    data={CRITERIA_KEYS.map((key) => ({
                      criterion: t(`scoring.${key}`),
                      value: scoreData.details[key],
                      fullMark: 100,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                  >
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="criterion"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      tickCount={5}
                    />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value} / 100`, "Score"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Criteria bars */}
              <div className="card">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-500">
                    {t("scoring.details")}
                  </h3>
                  <div className="flex items-center gap-2">
                    <ScoreGauge score={scoreData.score} />
                  </div>
                </div>
                <div className="space-y-4">
                  {CRITERIA_KEYS.map((key) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          {t(`scoring.${key}`)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            x{(scoreData.weights[key] * 100).toFixed(0)}%
                          </span>
                          <span className="font-mono font-medium text-slate-900">
                            {scoreData.details[key]}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${scoreData.details[key]}%`,
                            backgroundColor: CRITERIA_COLORS[key],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => id && scoreMutation.mutate(id)}
                  className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  {t("scoring.recalculate")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: AI Analysis */}
      {activeTab === "ai" && (
        <div className="space-y-4">
          {!aiMutation.data && (
            <div className="card flex flex-col items-center py-10">
              <Brain className="h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                {t("ai.noAnalysis")}
              </p>
              <button
                onClick={() => id && aiMutation.mutate(id)}
                disabled={aiMutation.isPending}
                className="mt-4 flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {aiMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {aiMutation.isPending
                  ? t("ai.analyzing")
                  : t("ai.analyze")}
              </button>
            </div>
          )}

          {aiMutation.data && (
            <div className="space-y-4">
              {/* Source badge + refresh */}
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    aiMutation.data.analysis.source === "claude"
                      ? "bg-violet-50 text-violet-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {aiMutation.data.analysis.source === "claude"
                    ? t("ai.claudeMode")
                    : t("ai.templateMode")}
                </span>
                <button
                  onClick={() => id && aiMutation.mutate(id)}
                  disabled={aiMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${aiMutation.isPending ? "animate-spin" : ""}`}
                  />
                  {t("ai.analyze")}
                </button>
              </div>

              {/* Summary */}
              <div className="card">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Brain className="h-4 w-4" />
                  {t("ai.summary")}
                </h3>
                <p className="text-sm leading-relaxed text-slate-700">
                  {aiMutation.data.analysis.summary}
                </p>
                {aiMutation.data.analysis.phase_summary && (
                  <p className="mt-2 text-xs text-slate-400">
                    {t("ai.phaseProgress")}: {aiMutation.data.analysis.phase_summary}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Strengths */}
                <div className="card">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                    {t("ai.strengths")}
                  </h3>
                  <ul className="space-y-2">
                    {aiMutation.data.analysis.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks */}
                <div className="card">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    {t("ai.risks")}
                  </h3>
                  <ul className="space-y-2">
                    {aiMutation.data.analysis.risks.map((r, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next Steps */}
              <div className="card">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-primary-600">
                  <ArrowRight className="h-4 w-4" />
                  {t("ai.nextSteps")}
                </h3>
                <ol className="space-y-2">
                  {aiMutation.data.analysis.next_steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Score Insights */}
              {aiMutation.data.analysis.score_insights.length > 0 && (
                <div className="card">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Target className="h-4 w-4" />
                    {t("ai.scoreInsights")}
                  </h3>
                  <div className="space-y-3">
                    {aiMutation.data.analysis.score_insights.map(
                      (insight, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-lg bg-slate-50 p-3"
                        >
                          <div className="text-center">
                            <span
                              className="text-lg font-bold font-mono"
                              style={{
                                color: scoreColor(insight.value),
                              }}
                            >
                              {insight.value}
                            </span>
                            <p className="text-[10px] text-slate-400">/100</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              {insight.criterion}
                            </p>
                            <p className="text-sm text-slate-700">
                              {insight.insight}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          {/* Drag & drop upload zone */}
          <div
            className={`card transition-colors ${dragOver ? "border-primary-400 bg-primary-50/50 dark:bg-primary-500/5" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (!file) return;
              await handleUpload(file);
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <FileText className="mr-1.5 inline h-4 w-4" />
                {t("documents.tabLabel")}
                {documents && documents.length > 0 && (
                  <span className="ml-1.5 text-xs text-slate-400">({documents.length})</span>
                )}
              </h3>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600">
                <Upload className="h-3.5 w-3.5" />
                {uploading ? t("documents.uploading") : t("documents.upload")}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await handleUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="mb-3 rounded-lg bg-primary-50 p-3 dark:bg-primary-500/10">
                <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  {t("documents.uploading")}
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-primary-100 dark:bg-primary-500/20">
                  <div className="h-full rounded-full bg-primary-500 animate-pulse" style={{ width: "60%" }} />
                </div>
              </div>
            )}

            {!documents || documents.length === 0 ? (
              <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-slate-200 py-8 text-slate-400 dark:border-slate-600">
                <Upload className="h-10 w-10" />
                <p className="mt-2 text-sm">{t("documents.noDocuments")}</p>
                <p className="mt-1 text-xs text-slate-300 dark:text-slate-500">
                  {dragOver ? "Deposez le fichier ici" : "Glissez-deposez ou cliquez pour ajouter"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {[...documents].sort((a, b) =>
                  (b.uploaded_at || "").localeCompare(a.uploaded_at || "")
                ).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 py-2.5"
                  >
                    {fileTypeIcon(doc.original_name)}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                        {doc.original_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatSize(doc.size_bytes)}
                        {doc.category !== "general" && ` · ${doc.category}`}
                        {doc.uploaded_at && ` · ${new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                    <a
                      href={`${api.defaults.baseURL}/api/documents/${doc.id}/download`}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                      title={t("documents.download")}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={async () => {
                        await api.delete(`/api/documents/${doc.id}`);
                        refetchDocs();
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                      title={t("documents.deleteTitle")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit form modal */}
      {showEditForm && (
        <ProjectForm
          initial={{
            id: projet.id,
            nom: projet.nom,
            filiere: projet.filiere || "solaire_sol",
            puissance_mwc: projet.puissance_mwc?.toString() || "",
            surface_ha: projet.surface_ha?.toString() || "",
            commune: projet.commune || "",
            departement: projet.departement || "",
            region: projet.region || "",
            statut: projet.statut,
            lon: projet.lon?.toString() || "",
            lat: projet.lat?.toString() || "",
          }}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            queryClient.invalidateQueries({ queryKey: ["projet", id] });
          }}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("deleteConfirm.title")}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t("deleteConfirm.message")} "{projet.nom}"
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await api.delete(`/api/projets/${id}`);
                    queryClient.invalidateQueries({ queryKey: ["projets"] });
                    navigate("/projects");
                  } catch {
                    setDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? t("common.loading") : t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
