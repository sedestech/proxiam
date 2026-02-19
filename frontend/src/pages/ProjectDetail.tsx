import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProjectDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          to="/projects"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Projet {id}
        </h1>
      </div>

      <p className="text-sm text-slate-500">
        Detail projet avec tabs : Score, Risques, Livrables, Timeline, Documents — Sprint 4
      </p>
    </div>
  );
}
