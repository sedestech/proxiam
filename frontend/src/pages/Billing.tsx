import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Key, Users, Check, Copy, Trash2, Plus, Shield, Zap, Building } from "lucide-react";
import api from "../lib/api";

interface PlanInfo {
  plan: string;
  price_eur: number;
  features: Record<string, unknown>;
}

interface SubInfo {
  plan: string;
  status: string;
  features: Record<string, unknown>;
  price_eur: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface ApiKeyInfo {
  id: string;
  prefix: string;
  name: string;
  scopes: string;
  rate_limit: number;
  last_used: string | null;
  active: boolean;
}

const PLAN_ICONS: Record<string, typeof CreditCard> = {
  free: Shield,
  pro: Zap,
  enterprise: Building,
};

const PLAN_COLORS: Record<string, string> = {
  free: "border-slate-200 bg-slate-50",
  pro: "border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30",
  enterprise: "border-amber-200 bg-amber-50 dark:bg-amber-950/30",
};

export default function Billing() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: plans = [] } = useQuery<PlanInfo[]>({
    queryKey: ["billing-plans"],
    queryFn: () => api.get("/billing/plans").then((r) => r.data),
  });

  const { data: subscription } = useQuery<SubInfo>({
    queryKey: ["billing-subscription"],
    queryFn: () => api.get("/billing/subscription").then((r) => r.data),
  });

  const { data: apiKeys = [] } = useQuery<ApiKeyInfo[]>({
    queryKey: ["billing-api-keys"],
    queryFn: () => api.get("/billing/api-keys").then((r) => r.data),
  });

  const subscribe = useMutation({
    mutationFn: (plan: string) => api.post(`/billing/subscribe?plan=${plan}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-subscription"] });
    },
  });

  const createKey = useMutation({
    mutationFn: (name: string) => api.post(`/billing/api-keys?name=${encodeURIComponent(name)}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["billing-api-keys"] });
      setCopiedKey(res.data.key);
      setNewKeyName("");
    },
  });

  const revokeKey = useMutation({
    mutationFn: (id: string) => api.delete(`/billing/api-keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing-api-keys"] }),
  });

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("billing.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("billing.subtitle")}</p>
      </div>

      {/* Plans */}
      <section>
        <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-indigo-500" />
          {t("billing.plans")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = PLAN_ICONS[plan.plan] || Shield;
            const isCurrent = subscription?.plan === plan.plan;
            return (
              <div
                key={plan.plan}
                className={`rounded-xl border-2 p-5 transition-all ${
                  isCurrent ? "border-indigo-500 ring-2 ring-indigo-200" : PLAN_COLORS[plan.plan] || "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-5 w-5" />
                  <h3 className="font-bold capitalize">{plan.plan}</h3>
                </div>
                <p className="text-3xl font-bold">
                  {plan.price_eur === 0 ? t("billing.free") : `${plan.price_eur}€`}
                  {plan.price_eur > 0 && <span className="text-sm font-normal text-slate-500">/mois</span>}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {Object.entries(plan.features).map(([key, val]) => (
                    <li key={key} className="flex items-center gap-2">
                      <Check className={`h-4 w-4 ${val === false || val === 0 ? "text-slate-300" : "text-emerald-500"}`} />
                      <span className={val === false ? "text-slate-400 line-through" : ""}>
                        {key.replace(/_/g, " ")}
                        {typeof val === "number" && val > 0 ? `: ${val === -1 ? "∞" : val}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => subscribe.mutate(plan.plan)}
                  disabled={isCurrent || subscribe.isPending}
                  className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold min-h-[44px] transition-all ${
                    isCurrent
                      ? "bg-indigo-100 text-indigo-700 cursor-default"
                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                  }`}
                >
                  {isCurrent ? t("billing.currentPlan") : t("billing.upgrade")}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* API Keys */}
      <section>
        <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <Key className="h-5 w-5 text-indigo-500" />
          {t("billing.apiKeys")}
        </h2>

        {copiedKey && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/30">
            <p className="text-sm font-semibold text-amber-800">{t("billing.keyCreated")}</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-1.5 text-xs font-mono dark:bg-slate-800">{copiedKey}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(copiedKey);
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <button onClick={() => setCopiedKey(null)} className="mt-2 text-xs text-amber-600 underline">
              {t("billing.dismiss")}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div key={key.id} className="flex items-center gap-3 rounded-lg border bg-white p-3 dark:bg-slate-800">
              <Key className="h-4 w-4 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{key.name}</p>
                <p className="text-xs text-slate-500">
                  {key.prefix}... · {key.scopes} · {key.rate_limit} req/min
                  {key.last_used && ` · ${t("billing.lastUsed")}: ${new Date(key.last_used).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => revokeKey.mutate(key.id)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder={t("billing.keyName")}
            className="flex-1 rounded-lg border px-3 py-2 text-sm min-h-[44px] dark:bg-slate-800"
          />
          <button
            onClick={() => newKeyName && createKey.mutate(newKeyName)}
            disabled={!newKeyName || createKey.isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white min-h-[44px] hover:bg-indigo-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t("billing.createKey")}
          </button>
        </div>
      </section>
    </div>
  );
}
