import { Shield, Users, Activity, BarChart3, Server } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Admin() {
  const { t } = useTranslation();

  const adminSections = [
    {
      icon: Users,
      title: "Utilisateurs",
      description: "Gestion des comptes, roles, permissions",
      color: "#6366f1",
    },
    {
      icon: BarChart3,
      title: "KPIs de supervision",
      description: "Metriques systeme, usage, performance",
      color: "#10b981",
    },
    {
      icon: Activity,
      title: "Audit Trail",
      description: "Journal des actions, conformite, securite",
      color: "#f59e0b",
    },
    {
      icon: Server,
      title: "Infrastructure",
      description: "Etat des services, BDD, Redis, Meilisearch",
      color: "#3b82f6",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("nav.admin")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Supervision, KPIs systeme, audit trail
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {adminSections.map(({ icon: Icon, title, description, color }) => (
          <div key={title} className="card cursor-pointer hover:border-slate-300">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
