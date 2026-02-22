import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  TrendingUp,
  BarChart3,
  Target,
  ArrowUp,
  ArrowDown,
  Search,
} from "lucide-react";
import api from "../lib/api";

// ─── Types ───

interface PredictionFactor {
  name: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
  description: string;
}

interface PredictionResult {
  project_id: string;
  success_probability: number;
  confidence: number;
  factors: PredictionFactor[];
  recommendation: string;
}

interface BenchmarkComparison {
  metric: string;
  project_value: number;
  market_avg: number;
  status: "above" | "below" | "inline";
}

interface BenchmarkResult {
  project_id: string;
  percentile: number;
  market_position: string;
  comparisons: BenchmarkComparison[];
}

// ─── Pure helpers ───

export function probabilityColor(probability: number): string {
  if (probability > 70) return "#10b981"; // green
  if (probability >= 30) return "#f59e0b"; // yellow/amber
  return "#ef4444"; // red
}

export function probabilityBgClass(probability: number): string {
  if (probability > 70) return "bg-emerald-50 dark:bg-emerald-500/10";
  if (probability >= 30) return "bg-amber-50 dark:bg-amber-500/10";
  return "bg-red-50 dark:bg-red-500/10";
}

export function statusLabel(
  status: "above" | "below" | "inline",
  t: (key: string) => string,
): string {
  switch (status) {
    case "above":
      return t("predictions.above");
    case "below":
      return t("predictions.below");
    case "inline":
      return t("predictions.inline");
  }
}

// ─── Component ───

export default function Predictions() {
  const { t } = useTranslation();
  const [projectId, setProjectId] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const handleAnalyze = () => {
    const trimmed = projectId.trim();
    if (trimmed) {
      setActiveProjectId(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
  };

  // Prediction query
  const {
    data: prediction,
    isLoading: predictionLoading,
    error: predictionError,
  } = useQuery<PredictionResult>({
    queryKey: ["prediction", activeProjectId],
    queryFn: async () => {
      const res = await api.get(`/api/predictions/${activeProjectId}`);
      return res.data;
    },
    enabled: !!activeProjectId,
    staleTime: 5 * 60 * 1000,
  });

  // Benchmark query
  const {
    data: benchmark,
    isLoading: benchmarkLoading,
  } = useQuery<BenchmarkResult>({
    queryKey: ["benchmark", activeProjectId],
    queryFn: async () => {
      const res = await api.get(
        `/api/predictions/${activeProjectId}/benchmark`,
      );
      return res.data;
    },
    enabled: !!activeProjectId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = predictionLoading || benchmarkLoading;

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-8 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
            <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("predictions.title")}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {t("predictions.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Project ID input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("predictions.enterProjectId")}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={!projectId.trim()}
          className="min-h-[44px] rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {t("predictions.analyze")}
        </button>
      </div>

      {/* No project state */}
      {!activeProjectId && (
        <div className="flex h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="text-center">
            <Brain className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-lg font-medium text-slate-500 dark:text-slate-400">
              {t("predictions.noProject")}
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {activeProjectId && isLoading && (
        <div className="flex h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            {t("common.loading")}
          </div>
        </div>
      )}

      {/* Error state */}
      {predictionError && !isLoading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {(predictionError as Error).message || "Error loading prediction"}
        </div>
      )}

      {/* Prediction results */}
      {prediction && !isLoading && (
        <div className="space-y-6">
          {/* Success probability card */}
          <div
            className={`rounded-xl border p-6 ${probabilityBgClass(prediction.success_probability)} border-slate-200 dark:border-slate-700`}
          >
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t("predictions.successProbability")}
                  </p>
                  <p
                    className="text-4xl font-bold font-mono"
                    style={{ color: probabilityColor(prediction.success_probability) }}
                  >
                    {prediction.success_probability}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t("predictions.confidence")}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-200">
                  {Math.round(prediction.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Factors + Recommendation */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Factor breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                {t("predictions.factors")}
              </h3>
              <div className="space-y-3">
                {prediction.factors.map((factor, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-700"
                  >
                    <div className="mt-0.5">
                      {factor.impact === "positive" ? (
                        <ArrowUp className="h-4 w-4 text-emerald-500" />
                      ) : factor.impact === "negative" ? (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {factor.name}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {(factor.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Brain className="h-4 w-4 text-indigo-500" />
                {t("predictions.recommendation")}
              </h3>
              <div className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                {prediction.recommendation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark section */}
      {benchmark && !isLoading && (
        <div className="space-y-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            {t("predictions.benchmark")}
          </h2>

          {/* Percentile + Position */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Percentile */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("predictions.percentile")}
              </p>
              <p className="mt-1 text-3xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {benchmark.percentile}
                <span className="text-base font-normal text-slate-400">
                  e
                </span>
              </p>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all duration-700 ease-out"
                  style={{ width: `${benchmark.percentile}%` }}
                />
              </div>
            </div>

            {/* Market position */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("predictions.marketPosition")}
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                {benchmark.market_position}
              </p>
            </div>
          </div>

          {/* Comparison table */}
          {benchmark.comparisons.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("predictions.comparisons")}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500">
                      <th className="px-5 py-3">{t("predictions.metric")}</th>
                      <th className="px-5 py-3">
                        {t("predictions.projectValue")}
                      </th>
                      <th className="px-5 py-3">
                        {t("predictions.marketAvg")}
                      </th>
                      <th className="px-5 py-3">{t("predictions.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmark.comparisons.map((comp, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-50 last:border-0 dark:border-slate-700/50"
                      >
                        <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">
                          {comp.metric}
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-600 dark:text-slate-300">
                          {comp.project_value}
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-400 dark:text-slate-500">
                          {comp.market_avg}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              comp.status === "above"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : comp.status === "below"
                                  ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                            }`}
                          >
                            {comp.status === "above" && (
                              <ArrowUp className="h-3 w-3" />
                            )}
                            {comp.status === "below" && (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {statusLabel(comp.status, t)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
