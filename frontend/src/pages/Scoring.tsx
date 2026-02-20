import { useState } from "react";
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
  Target,
  RefreshCw,
  MapPin,
  Zap,
  Sun,
  Wind,
  Battery,
  ChevronDown,
} from "lucide-react";
import api from "../lib/api";

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

interface ScoreResult {
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
  weights: Record<string, number>;
  filiere: string | null;
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
      return <Sun className="h-4 w-4 text-amber-500" />;
    case "eolien_onshore":
      return <Wind className="h-4 w-4 text-blue-500" />;
    case "bess":
      return <Battery className="h-4 w-4 text-emerald-500" />;
    default:
      return <Zap className="h-4 w-4 text-slate-400" />;
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

/** Score gauge ring (SVG) */
function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Background ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        {/* Progress ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-3xl font-bold font-mono"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

/** Criteria bar */
function CriteriaBar({
  label,
  value,
  weight,
  color,
}: {
  label: string;
  value: number;
  weight: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            x{(weight * 100).toFixed(0)}%
          </span>
          <span className="font-mono font-medium text-slate-900">
            {value}
          </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export default function Scoring() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch all projects
  const { data: projets } = useQuery<Projet[]>({
    queryKey: ["projets"],
    queryFn: async () => {
      const res = await api.get("/api/projets");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Score mutation
  const scoreMutation = useMutation<ScoreResult, Error, string>({
    mutationFn: async (projetId: string) => {
      const res = await api.post(`/api/projets/${projetId}/score`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projets"] });
    },
  });

  const selectedProjet = projets?.find((p) => p.id === selectedId);
  const scoreData = scoreMutation.data;

  // Radar chart data
  const radarData = scoreData
    ? CRITERIA_KEYS.map((key) => ({
        criterion: t(`scoring.${key}`),
        value: scoreData.details[key],
        fullMark: 100,
      }))
    : [];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setDropdownOpen(false);
    scoreMutation.mutate(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("scoring.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("scoring.subtitle")}
          </p>
        </div>
      </div>

      {/* Project selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm hover:bg-slate-50 sm:w-96"
        >
          {selectedProjet ? (
            <div className="flex items-center gap-2">
              {filiereIcon(selectedProjet.filiere)}
              <span className="font-medium text-slate-900">
                {selectedProjet.nom}
              </span>
              {selectedProjet.score_global !== null && (
                <span
                  className="ml-2 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{
                    backgroundColor: scoreColor(selectedProjet.score_global),
                  }}
                >
                  {selectedProjet.score_global}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">
              {t("scoring.selectProject")}
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {dropdownOpen && projets && (
          <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg sm:w-96">
            {projets.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
              >
                {filiereIcon(p.filiere)}
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{p.nom}</div>
                  <div className="text-xs text-slate-400">
                    {p.commune} — {filiereLabel(p.filiere)}
                  </div>
                </div>
                {p.score_global !== null && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: scoreColor(p.score_global) }}
                  >
                    {p.score_global}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No project selected */}
      {!selectedId && (
        <div className="flex h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-100/50">
          <div className="text-center">
            <Target className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-lg font-medium text-slate-500">
              {t("scoring.noProject")}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {selectedId && scoreMutation.isPending && (
        <div className="flex h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            {t("scoring.calculating")}
          </div>
        </div>
      )}

      {/* Score result */}
      {selectedId && scoreData && !scoreMutation.isPending && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Score gauge + project info */}
          <div className="space-y-4">
            {/* Global score card */}
            <div className="card flex flex-col items-center py-6">
              <h3 className="mb-4 text-sm font-medium text-slate-500">
                {t("scoring.globalScore")}
              </h3>
              <ScoreGauge score={scoreData.score} />
              <div className="mt-3 flex items-center gap-2">
                {filiereIcon(scoreData.filiere)}
                <span className="text-sm font-medium text-slate-700">
                  {filiereLabel(scoreData.filiere)}
                </span>
              </div>
              <button
                onClick={() => scoreMutation.mutate(selectedId)}
                className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw className="h-3 w-3" />
                {t("scoring.recalculate")}
              </button>
            </div>

            {/* Project info */}
            {selectedProjet && (
              <div className="card space-y-3">
                <h3 className="text-sm font-medium text-slate-500">
                  {t("scoring.projectInfo")}
                </h3>
                <div className="space-y-2 text-sm">
                  {selectedProjet.commune && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-600">
                        {selectedProjet.commune}
                        {selectedProjet.departement && ` (${selectedProjet.departement})`}
                      </span>
                    </div>
                  )}
                  {selectedProjet.region && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {t("scoring.region")}
                      </span>
                      <span className="text-slate-700">
                        {selectedProjet.region}
                      </span>
                    </div>
                  )}
                  {selectedProjet.puissance_mwc && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {t("scoring.puissance")}
                      </span>
                      <span className="font-mono text-slate-700">
                        {selectedProjet.puissance_mwc}
                      </span>
                    </div>
                  )}
                  {selectedProjet.surface_ha && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {t("scoring.surface")}
                      </span>
                      <span className="font-mono text-slate-700">
                        {selectedProjet.surface_ha}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      {t("scoring.statut")}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {selectedProjet.statut}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center: Radar chart */}
          <div className="card lg:col-span-1">
            <h3 className="mb-4 text-sm font-medium text-slate-500">
              {t("scoring.radarTitle")}
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
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

          {/* Right: Criteria bars */}
          <div className="card">
            <h3 className="mb-4 text-sm font-medium text-slate-500">
              {t("scoring.details")}
            </h3>
            <div className="space-y-4">
              {CRITERIA_KEYS.map((key) => (
                <CriteriaBar
                  key={key}
                  label={t(`scoring.${key}`)}
                  value={scoreData.details[key]}
                  weight={scoreData.weights[key]}
                  color={CRITERIA_COLORS[key]}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
