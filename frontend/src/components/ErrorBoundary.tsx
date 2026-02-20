import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
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
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              Une erreur est survenue
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {this.state.error?.message || "Erreur inattendue"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              <RefreshCw className="h-4 w-4" />
              Recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
