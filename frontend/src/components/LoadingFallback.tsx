import { Zap } from "lucide-react";

export default function LoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 animate-pulse">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
          Chargement...
        </p>
      </div>
    </div>
  );
}
