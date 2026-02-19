import { Radar, Plus, Globe, Cpu, Scale, BookOpen, Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";

const veilleCategories = [
  {
    icon: Globe,
    title: "Secteurs",
    description: "Solaire, eolien, BESS, hydrogene, biomasse",
    count: 0,
    color: "#3b82f6",
  },
  {
    icon: Cpu,
    title: "Technologies",
    description: "Cellules PV, onduleurs, batteries, electrolyseurs",
    count: 0,
    color: "#8b5cf6",
  },
  {
    icon: Scale,
    title: "Normes & Reglementation",
    description: "ICPE, PLU, Code de l'environnement, directives EU",
    count: 0,
    color: "#10b981",
  },
  {
    icon: Lightbulb,
    title: "Innovations",
    description: "Brevets, publications academiques, startups",
    count: 0,
    color: "#f59e0b",
  },
  {
    icon: BookOpen,
    title: "Publications",
    description: "Rapports CRE, RTE, ADEME, IEA, IRENA",
    count: 0,
    color: "#ec4899",
  },
];

export default function Veille() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("nav.veille")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Parametrer des veilles sur les secteurs, technologies, normes, pays, innovations
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600">
          <Plus className="h-4 w-4" />
          Nouvelle veille
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {veilleCategories.map(({ icon: Icon, title, description, count, color }) => (
          <div key={title} className="card cursor-pointer hover:border-slate-300">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {count}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex h-[200px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-100/50">
        <div className="text-center">
          <Radar className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-500">
            1000 sources de veille disponibles
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Scraping + API + RSS — Alertes configurables — Sprint 5
          </p>
        </div>
      </div>
    </div>
  );
}
