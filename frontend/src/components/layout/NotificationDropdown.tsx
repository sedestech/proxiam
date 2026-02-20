import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  FolderKanban,
  Target,
  Server,
  X,
} from "lucide-react";
import api from "../../lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string | null;
  read: boolean;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
  total: number;
}

const TYPE_ICON: Record<string, typeof Bell> = {
  project_created: FolderKanban,
  score_calculated: Target,
  system: Server,
};

const TYPE_COLOR: Record<string, string> = {
  project_created: "#6366f1",
  score_calculated: "#10b981",
  system: "#3b82f6",
};

function timeAgo(timestamp: string | null): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "a l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/api/notifications?limit=10");
      return res.data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = data?.unread ?? 0;
  const notifications = data?.notifications ?? [];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Notifications
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                Aucune notification
              </div>
            )}
            {notifications.map((notif) => {
              const Icon = TYPE_ICON[notif.type] || Bell;
              const color = TYPE_COLOR[notif.type] || "#94a3b8";
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    !notif.read ? "bg-primary-50/50 dark:bg-primary-500/5" : ""
                  }`}
                >
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {notif.title}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {notif.message}
                    </p>
                    {notif.timestamp && (
                      <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                        {timeAgo(notif.timestamp)}
                      </p>
                    )}
                  </div>
                  {!notif.read && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {data && data.total > 10 && (
            <div className="border-t border-slate-100 px-4 py-2 text-center dark:border-slate-700">
              <span className="text-xs text-slate-400">
                {data.total} notifications au total
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
