import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Clock,
  GitBranch,
  Cpu,
} from "lucide-react";
import api from "../lib/api";

// ─── Types ───

interface HealthStatus {
  status: string;
  database: boolean;
  redis: boolean;
  disk_ok: boolean;
  memory_ok: boolean;
  uptime_seconds: number;
}

interface Metrics {
  request_count: number;
  avg_response_time_ms: number;
}

interface VersionInfo {
  version: string;
  python_version: string;
  git_sha: string;
}

// ─── Pure helpers ───

export function formatUptime(
  seconds: number,
  t: (key: string) => string,
): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${t("monitoring.days")}`);
  if (hours > 0) parts.push(`${hours} ${t("monitoring.hours")}`);
  parts.push(`${minutes} ${t("monitoring.minutes")}`);
  return parts.join(", ");
}

export function healthIndicatorClass(healthy: boolean): string {
  return healthy
    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-800"
    : "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-800";
}

export function healthDotClass(healthy: boolean): string {
  return healthy
    ? "bg-emerald-400"
    : "bg-red-400";
}

export function healthLabelClass(healthy: boolean): string {
  return healthy
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-red-700 dark:text-red-400";
}

// ─── Component ───

export default function Monitoring() {
  const { t } = useTranslation();

  // Health query — auto-refresh every 30s
  const { data: health, isLoading: healthLoading } = useQuery<HealthStatus>({
    queryKey: ["monitoring-health"],
    queryFn: async () => {
      const res = await api.get("/api/monitoring/health");
      return res.data;
    },
    refetchInterval: 30_000,
  });

  // Metrics query — auto-refresh every 30s
  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ["monitoring-metrics"],
    queryFn: async () => {
      const res = await api.get("/api/monitoring/metrics");
      return res.data;
    },
    refetchInterval: 30_000,
  });

  // Version query — no auto-refresh (static)
  const { data: version, isLoading: versionLoading } = useQuery<VersionInfo>({
    queryKey: ["monitoring-version"],
    queryFn: async () => {
      const res = await api.get("/api/monitoring/version");
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const isLoading = healthLoading || metricsLoading || versionLoading;

  const healthChecks = health
    ? [
        {
          key: "database",
          label: t("monitoring.database"),
          icon: Database,
          healthy: health.database,
        },
        {
          key: "redis",
          label: t("monitoring.redis"),
          icon: Server,
          healthy: health.redis,
        },
        {
          key: "disk",
          label: t("monitoring.disk"),
          icon: HardDrive,
          healthy: health.disk_ok,
        },
        {
          key: "memory",
          label: t("monitoring.memory"),
          icon: Cpu,
          healthy: health.memory_ok,
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-8 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
            <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("monitoring.title")}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {t("monitoring.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            {t("common.loading")}
          </div>
        </div>
      )}

      {/* System Health */}
      {health && !isLoading && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <Activity className="h-5 w-5 text-indigo-500" />
            {t("monitoring.systemHealth")}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {healthChecks.map(({ key, label, icon: Icon, healthy }) => (
              <div
                key={key}
                className={`rounded-xl border p-5 shadow-sm ${healthIndicatorClass(healthy)}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {label}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <div
                        className={`h-2 w-2 rounded-full ${healthDotClass(healthy)}`}
                      />
                      <span
                        className={`text-xs font-medium ${healthLabelClass(healthy)}`}
                      >
                        {healthy
                          ? t("monitoring.healthy")
                          : t("monitoring.unhealthy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Uptime */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {t("monitoring.uptime")}
                </p>
                <p className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {formatUptime(health.uptime_seconds, t)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version info */}
      {version && !isLoading && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <GitBranch className="h-5 w-5 text-indigo-500" />
            {t("monitoring.version")}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("monitoring.appVersion")}
              </p>
              <p className="mt-1 text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {version.version}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("monitoring.pythonVersion")}
              </p>
              <p className="mt-1 text-lg font-bold font-mono text-slate-900 dark:text-white">
                {version.python_version}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("monitoring.gitSha")}
              </p>
              <p className="mt-1 text-sm font-mono text-slate-600 dark:text-slate-300 truncate" title={version.git_sha}>
                {version.git_sha}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {metrics && !isLoading && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <Activity className="h-5 w-5 text-indigo-500" />
            {t("monitoring.metrics")}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("monitoring.requestCount")}
              </p>
              <p className="mt-1 text-3xl font-bold font-mono text-slate-900 dark:text-white">
                {metrics.request_count.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("monitoring.avgResponseTime")}
              </p>
              <p className="mt-1 text-3xl font-bold font-mono text-slate-900 dark:text-white">
                {metrics.avg_response_time_ms.toFixed(1)}
                <span className="ml-1 text-base font-normal text-slate-400">
                  ms
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      {!isLoading && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {t("monitoring.autoRefresh")}
        </div>
      )}
    </div>
  );
}
