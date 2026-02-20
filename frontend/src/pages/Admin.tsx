import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Database,
  Server,
  Search,
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import api from "../lib/api";

interface ServiceStatus {
  status: string;
  latency_ms?: number;
  error?: string;
  version?: string;
  db_size_mb?: number;
  used_memory_mb?: number;
  indexes?: number;
  mode?: string;
  message?: string;
  counts?: Record<string, number>;
}

interface HealthResponse {
  status: string;
  services: Record<string, ServiceStatus>;
}

const SERVICE_META: Record<string, { icon: typeof Database; label: string; color: string }> = {
  postgresql: { icon: Database, label: "PostgreSQL", color: "#336791" },
  redis: { icon: Server, label: "Redis", color: "#dc382d" },
  meilisearch: { icon: Search, label: "Meilisearch", color: "#ff5caa" },
  ai: { icon: Brain, label: "Claude IA", color: "#6366f1" },
};

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <CheckCircle className="h-5 w-5 text-emerald-500" />;
  if (status === "degraded") return <AlertCircle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

export default function Admin() {
  const { t } = useTranslation();

  const { data, isLoading, refetch, isFetching } = useQuery<HealthResponse>({
    queryKey: ["admin-health"],
    queryFn: async () => {
      const res = await api.get("/api/admin/health");
      return res.data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("nav.admin")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Supervision infrastructure et services
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Overall status */}
      {data && (
        <div className={`card flex items-center gap-3 ${
          data.status === "ok"
            ? "border-emerald-200 dark:border-emerald-800"
            : "border-amber-200 dark:border-amber-800"
        }`}>
          <StatusIcon status={data.status} />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {data.status === "ok" ? "Tous les services sont operationnels" : "Certains services sont degrades"}
            </p>
            <p className="text-xs text-slate-400">
              {Object.values(data.services).filter(s => s.status === "ok").length}/{Object.keys(data.services).length} services OK
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          {t("common.loading")}
        </div>
      )}

      {/* Service cards */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Object.entries(data.services).map(([key, service]) => {
            const meta = SERVICE_META[key] || { icon: Server, label: key, color: "#94a3b8" };
            const Icon = meta.icon;
            return (
              <div key={key} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${meta.color}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: meta.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {meta.label}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusIcon status={service.status} />
                        <span className={`text-xs font-medium ${
                          service.status === "ok"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : service.status === "degraded"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                        }`}>
                          {service.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {service.latency_ms !== undefined && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      {service.latency_ms}ms
                    </span>
                  )}
                </div>

                {/* Service details */}
                <div className="mt-3 space-y-1.5 text-sm">
                  {service.version && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Version</span>
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {service.version}
                      </span>
                    </div>
                  )}
                  {service.db_size_mb !== undefined && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Taille BDD</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {service.db_size_mb} MB
                      </span>
                    </div>
                  )}
                  {service.used_memory_mb !== undefined && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Memoire</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {service.used_memory_mb} MB
                      </span>
                    </div>
                  )}
                  {service.indexes !== undefined && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Index</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {service.indexes}
                      </span>
                    </div>
                  )}
                  {service.counts && Object.entries(service.counts).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>{k}</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{v}</span>
                    </div>
                  ))}
                  {service.mode && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Mode</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        service.mode === "claude"
                          ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      }`}>
                        {service.mode}
                      </span>
                    </div>
                  )}
                  {service.message && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">{service.message}</p>
                  )}
                  {service.error && (
                    <p className="text-xs text-red-500">{service.error}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
