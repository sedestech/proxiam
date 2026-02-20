import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            {this.props.fallbackTitle || "Erreur de chargement"}
          </h2>
          <p className="mt-2 max-w-md text-center text-sm text-slate-500 dark:text-slate-400">
            {this.state.error?.message || "Une erreur inattendue est survenue"}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              <RefreshCw className="h-4 w-4" />
              Reessayer
            </button>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
