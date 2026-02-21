import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Database,
  Server,
  Search,
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Activity,
  DollarSign,
  Shield,
  HeartPulse,
} from "lucide-react";
import api from "../lib/api";
import QueryError from "../components/QueryError";

// ─── Types ───

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

interface UserRow {
  id: string;
  email: string;
  nom: string | null;
  tier: string;
  active: boolean;
  created_at: string | null;
  last_login: string | null;
  nb_projets: number;
  nb_actions: number;
}

interface PlatformStats {
  users: { total: number; active: number; by_tier: Record<string, number> };
  projets: number;
  usage: { total_actions: number; actions_24h: number; total_cost_eur: number };
}

interface UsageData {
  period_days: number;
  by_action: { action: string; count: number; cost_eur: number }[];
  daily: { day: string; count: number; cost_eur: number }[];
}

interface DataHealthSource {
  source_name: string;
  display_name: string;
  category: string;
  record_count: number;
  last_updated: string | null;
  days_since_update: number | null;
  update_frequency_days: number;
  status: "ok" | "stale" | "error" | "loading";
  quality_score: number;
  notes: string | null;
}

interface DataHealthResponse {
  overall_health_pct: number;
  sources: DataHealthSource[];
}

// ─── Helpers ───

const SERVICE_META: Record<string, { icon: typeof Database; label: string; color: string }> = {
  postgresql: { icon: Database, label: "PostgreSQL", color: "#336791" },
  redis: { icon: Server, label: "Redis", color: "#dc382d" },
  meilisearch: { icon: Search, label: "Meilisearch", color: "#ff5caa" },
  ai: { icon: Brain, label: "Claude IA", color: "#6366f1" },
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  pro: "bg-indigo-100 text-indigo-700",
  admin: "bg-amber-100 text-amber-700",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <CheckCircle className="h-5 w-5 text-emerald-500" />;
  if (status === "degraded") return <AlertCircle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

// ─── Tabs ───

type Tab = "overview" | "users" | "usage" | "services" | "dataHealth";

export default function Admin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");

  // Queries
  const { data: health, isLoading: healthLoading, refetch: refetchHealth, isFetching } = useQuery<HealthResponse>({
    queryKey: ["admin-health"],
    queryFn: async () => (await api.get("/api/admin/health")).data,
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery<PlatformStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/api/admin/stats")).data,
    retry: false,
  });

  const { data: usersData } = useQuery<{ total: number; users: UserRow[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get("/api/admin/users?limit=100")).data,
    enabled: tab === "users" || tab === "overview",
    retry: false,
  });

  const { data: usage } = useQuery<UsageData>({
    queryKey: ["admin-usage"],
    queryFn: async () => (await api.get("/api/admin/usage?days=30")).data,
    enabled: tab === "usage" || tab === "overview",
    retry: false,
  });

  const { data: dataHealth } = useQuery<DataHealthResponse>({
    queryKey: ["admin-data-health"],
    queryFn: async () => (await api.get("/api/admin/data-health")).data,
    enabled: tab === "dataHealth",
    retry: false,
  });

  // Mutation: change tier
  const tierMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: string }) => {
      return (await api.patch(`/api/admin/users/${userId}`, { tier })).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const tabs: { key: Tab; label: string; icon: typeof Shield }[] = [
    { key: "overview", label: t("admin.overview"), icon: Shield },
    { key: "users", label: t("admin.users"), icon: Users },
    { key: "usage", label: t("admin.usage"), icon: Activity },
    { key: "services", label: t("admin.services"), icon: Server },
    { key: "dataHealth", label: t("admin.dataHealth"), icon: HeartPulse },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t("nav.admin")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">
            {t("admin.subtitle")}
          </p>
        </div>
        <button
          onClick={() => refetchHealth()}
          disabled={isFetching}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 min-h-[44px] min-w-[44px] justify-center"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-700/50 -mx-4 px-4 md:mx-0 md:px-1 scrollbar-hide">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[44px] ${
              tab === key
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.users.total ?? "—"}
                </p>
                <p className="text-sm text-slate-500">{t("admin.totalUsers")}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.usage.actions_24h ?? "—"}
                </p>
                <p className="text-sm text-slate-500">{t("admin.actions24h")}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.usage.total_cost_eur != null ? `${stats.usage.total_cost_eur.toFixed(2)}` : "—"}
                </p>
                <p className="text-sm text-slate-500">{t("admin.totalCost")}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.projets ?? "—"}
                </p>
                <p className="text-sm text-slate-500">{t("admin.totalProjects")}</p>
              </div>
            </div>
          </div>

          {/* Health status bar */}
          {health && (
            <div className={`card flex items-center gap-3 ${
              health.status === "ok" ? "border-emerald-200 dark:border-emerald-800" : "border-amber-200 dark:border-amber-800"
            }`}>
              <StatusIcon status={health.status} />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {health.status === "ok" ? t("admin.allServicesOk") : t("admin.someServicesDegraded")}
                </p>
                <p className="text-xs text-slate-400">
                  {Object.values(health.services).filter(s => s.status === "ok").length}/{Object.keys(health.services).length} services OK
                </p>
              </div>
            </div>
          )}

          {/* Usage chart */}
          {usage && usage.daily.length > 0 && (
            <div className="card">
              <h2 className="mb-3 text-sm font-medium text-slate-500">{t("admin.dailyUsage")}</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...usage.daily].reverse().slice(-14)}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v.slice(5)} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v: number) => [v, "Actions"]}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ─── Users Tab ─── */}
      {tab === "users" && (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="py-2 pr-4 text-left text-xs font-medium text-slate-500">{t("admin.email")}</th>
                  <th className="py-2 pr-4 text-left text-xs font-medium text-slate-500">{t("admin.tier")}</th>
                  <th className="py-2 pr-4 text-right text-xs font-medium text-slate-500">{t("admin.projects")}</th>
                  <th className="py-2 pr-4 text-right text-xs font-medium text-slate-500">{t("admin.actions")}</th>
                  <th className="py-2 pr-4 text-left text-xs font-medium text-slate-500">{t("admin.lastLogin")}</th>
                  <th className="py-2 text-left text-xs font-medium text-slate-500">{t("admin.changeTier")}</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 dark:border-slate-700/50">
                    <td className="py-2.5 pr-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{u.nom || u.email}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLORS[u.tier] || TIER_COLORS.free}`}>
                        {u.tier}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-slate-700 dark:text-slate-300">{u.nb_projets}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-slate-700 dark:text-slate-300">{u.nb_actions}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-400">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="py-2.5">
                      <select
                        value={u.tier}
                        onChange={(e) => tierMutation.mutate({ userId: u.id, tier: e.target.value })}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!usersData?.users || usersData.users.length === 0) && (
              <p className="py-8 text-center text-sm text-slate-400">{t("admin.noUsers")}</p>
            )}
          </div>

          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {usersData?.users.map((u) => (
              <div key={u.id} className="card space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white">{u.nom || u.email}</p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLORS[u.tier] || TIER_COLORS.free}`}>
                    {u.tier}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{u.nb_projets} {t("admin.projects")}</span>
                  <span>{u.nb_actions} {t("admin.actions")}</span>
                  <span>{u.last_login ? new Date(u.last_login).toLocaleDateString("fr-FR") : "—"}</span>
                </div>
                <select
                  value={u.tier}
                  onChange={(e) => tierMutation.mutate({ userId: u.id, tier: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 min-h-[44px]"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
            {(!usersData?.users || usersData.users.length === 0) && (
              <p className="py-8 text-center text-sm text-slate-400">{t("admin.noUsers")}</p>
            )}
          </div>
        </>
      )}

      {/* ─── Usage Tab ─── */}
      {tab === "usage" && usage && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {usage.by_action.map((a) => (
              <div key={a.action} className="card p-3 sm:p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize sm:text-sm">{a.action}</h3>
                  <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">{a.count}</span>
                </div>
                <p className="text-xs text-slate-400">{a.cost_eur.toFixed(4)} EUR</p>
              </div>
            ))}
          </div>

          {usage.daily.length > 0 && (
            <div className="card">
              <h2 className="mb-3 text-sm font-medium text-slate-500">{t("admin.costPerDay")}</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...usage.daily].reverse().slice(-30)}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v.slice(5)} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v: number) => [`${v.toFixed(4)} EUR`, "Cost"]}
                  />
                  <Bar dataKey="cost_eur" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ─── Services Tab ─── */}
      {tab === "services" && (
        <>
          {healthLoading && (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              {t("common.loading")}
            </div>
          )}
          {health && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(health.services).map(([key, service]) => {
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
                          <h3 className="font-semibold text-slate-900 dark:text-white">{meta.label}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StatusIcon status={service.status} />
                            <span className={`text-xs font-medium ${
                              service.status === "ok" ? "text-emerald-600" :
                              service.status === "degraded" ? "text-amber-600" : "text-red-600"
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
                    <div className="mt-3 space-y-1.5 text-sm">
                      {service.version && (
                        <div className="flex justify-between text-slate-500"><span>Version</span><span className="font-mono text-xs text-slate-700 dark:text-slate-300">{service.version}</span></div>
                      )}
                      {service.db_size_mb !== undefined && (
                        <div className="flex justify-between text-slate-500"><span>Taille BDD</span><span className="font-mono text-slate-700 dark:text-slate-300">{service.db_size_mb} MB</span></div>
                      )}
                      {service.used_memory_mb !== undefined && (
                        <div className="flex justify-between text-slate-500"><span>Memoire</span><span className="font-mono text-slate-700 dark:text-slate-300">{service.used_memory_mb} MB</span></div>
                      )}
                      {service.indexes !== undefined && (
                        <div className="flex justify-between text-slate-500"><span>Index</span><span className="font-mono text-slate-700 dark:text-slate-300">{service.indexes}</span></div>
                      )}
                      {service.counts && Object.entries(service.counts).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-slate-500"><span>{k}</span><span className="font-mono text-slate-700 dark:text-slate-300">{v}</span></div>
                      ))}
                      {service.mode && (
                        <div className="flex justify-between text-slate-500"><span>Mode</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          service.mode === "claude" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"
                        }`}>{service.mode}</span></div>
                      )}
                      {service.message && <p className="text-xs text-slate-400">{service.message}</p>}
                      {service.error && <p className="text-xs text-red-500">{service.error}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Data Health Tab ─── */}
      {tab === "dataHealth" && (
        <div className="space-y-4">
          {/* Overall health bar */}
          {dataHealth && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("admin.overallHealth")}
                </h2>
                <span className={`text-lg font-bold ${
                  dataHealth.overall_health_pct >= 80 ? "text-emerald-600" :
                  dataHealth.overall_health_pct >= 60 ? "text-amber-600" : "text-red-600"
                }`}>
                  {dataHealth.overall_health_pct}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dataHealth.overall_health_pct >= 80 ? "bg-emerald-500" :
                    dataHealth.overall_health_pct >= 60 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, dataHealth.overall_health_pct))}%` }}
                />
              </div>
            </div>
          )}

          {/* Data sources table — desktop */}
          {dataHealth && (
            <div className="card hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="py-2 pr-4 text-left text-xs font-medium text-slate-500">{t("admin.source")}</th>
                    <th className="py-2 pr-4 text-left text-xs font-medium text-slate-500">{t("knowledge.category")}</th>
                    <th className="py-2 pr-4 text-right text-xs font-medium text-slate-500">{t("admin.records")}</th>
                    <th className="py-2 pr-4 text-left text-xs font-medium text-slate-500">{t("admin.lastUpdate")}</th>
                    <th className="py-2 pr-4 text-left text-xs font-medium text-slate-500">{t("common.status")}</th>
                    <th className="py-2 pr-4 text-left text-xs font-medium text-slate-500">{t("admin.quality")}</th>
                    <th className="py-2 text-left text-xs font-medium text-slate-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {dataHealth.sources.map((src) => (
                    <tr key={src.source_name} className="border-b border-slate-50 dark:border-slate-700/50">
                      <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-white">
                        {src.display_name}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {src.category}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        {src.record_count.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500">
                        {src.days_since_update != null
                          ? t("admin.daysAgo", { days: src.days_since_update })
                          : t("admin.never")}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          src.status === "ok" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          src.status === "stale" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          src.status === "error" ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {src.status === "ok" ? t("admin.ok") :
                           src.status === "stale" ? t("admin.stale") :
                           src.status === "error" ? t("admin.error") :
                           t("admin.loading")}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                src.quality_score >= 80 ? "bg-emerald-500" :
                                src.quality_score >= 60 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, src.quality_score))}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-slate-500">{src.quality_score}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-xs text-slate-400">
                        {src.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dataHealth.sources.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">{t("common.noData")}</p>
              )}
            </div>
          )}

          {/* Data sources cards — mobile */}
          {dataHealth && (
            <div className="space-y-3 md:hidden">
              {dataHealth.sources.map((src) => (
                <div key={src.source_name} className="card space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-white">{src.display_name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {src.category}
                      </span>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      src.status === "ok" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      src.status === "stale" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      src.status === "error" ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {src.status === "ok" ? t("admin.ok") :
                       src.status === "stale" ? t("admin.stale") :
                       src.status === "error" ? t("admin.error") :
                       t("admin.loading")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{src.record_count.toLocaleString()} {t("admin.records").toLowerCase()}</span>
                    <span>
                      {src.days_since_update != null
                        ? t("admin.daysAgo", { days: src.days_since_update })
                        : t("admin.never")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{t("admin.quality")}</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          src.quality_score >= 80 ? "bg-emerald-500" :
                          src.quality_score >= 60 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, src.quality_score))}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-500">{src.quality_score}</span>
                  </div>
                  {src.notes && (
                    <p className="text-xs text-slate-400">{src.notes}</p>
                  )}
                </div>
              ))}
              {dataHealth.sources.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">{t("common.noData")}</p>
              )}
            </div>
          )}

          {/* Loading state */}
          {!dataHealth && (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              {t("common.loading")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
