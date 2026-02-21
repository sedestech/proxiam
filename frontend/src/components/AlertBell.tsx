import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bell, Check, ExternalLink } from "lucide-react";
import api from "../lib/api";

interface AlertItem {
  id: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string | null;
  content_url: string | null;
  ai_tags: Record<string, unknown> | null;
}

interface AlertsResponse {
  unread_count: number;
  alerts: AlertItem[];
}

export default function AlertBell() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery<AlertsResponse>({
    queryKey: ["alerts"],
    queryFn: async () => (await api.get("/api/alerts?limit=10&unread_only=false")).data,
    refetchInterval: 60000,
    retry: false,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/alerts/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = data?.unread_count ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:w-80">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              {t("veille.alerts")}
            </h3>
            <p className="text-xs text-slate-400">{unread} {t("veille.unread")}</p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto overscroll-contain sm:max-h-80">
            {data?.alerts && data.alerts.length > 0 ? (
              data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-2.5 border-b border-slate-50 px-4 py-3 dark:border-slate-700/50 ${
                    !alert.read ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${
                      !alert.read ? "font-medium text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
                    }`}>
                      {alert.title}
                    </p>
                    {alert.message && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{alert.message}</p>
                    )}
                    {alert.created_at && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        {new Date(alert.created_at).toLocaleString("fr-FR", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!alert.read && (
                      <button
                        onClick={() => markRead.mutate(alert.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-700"
                        title="Marquer comme lu"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {alert.content_url && (
                      <a
                        href={alert.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Bell className="mb-2 h-8 w-8 text-slate-200" />
                <p className="text-xs">{t("veille.noAlerts")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
