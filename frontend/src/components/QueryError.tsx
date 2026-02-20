import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function QueryError({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center py-12 text-slate-400">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {message || "Erreur de chargement des donnees"}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RefreshCw className="h-3 w-3" />
          Reessayer
        </button>
      )}
    </div>
  );
}
