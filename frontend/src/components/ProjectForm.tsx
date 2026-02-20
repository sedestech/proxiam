import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import api from "../lib/api";

interface ProjectFormData {
  nom: string;
  filiere: string;
  puissance_mwc: string;
  surface_ha: string;
  commune: string;
  departement: string;
  region: string;
  statut: string;
  lon: string;
  lat: string;
}

interface ProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initial?: Partial<ProjectFormData> & { id?: string };
}

const EMPTY: ProjectFormData = {
  nom: "",
  filiere: "solaire_sol",
  puissance_mwc: "",
  surface_ha: "",
  commune: "",
  departement: "",
  region: "",
  statut: "prospection",
  lon: "",
  lat: "",
};

export default function ProjectForm({ onClose, onSuccess, initial }: ProjectFormProps) {
  const { t } = useTranslation();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<ProjectFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof ProjectFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim()) {
      setError("Le nom est obligatoire");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        nom: form.nom.trim(),
        filiere: form.filiere || null,
        puissance_mwc: form.puissance_mwc ? parseFloat(form.puissance_mwc) : null,
        surface_ha: form.surface_ha ? parseFloat(form.surface_ha) : null,
        commune: form.commune || null,
        departement: form.departement || null,
        region: form.region || null,
        statut: form.statut,
      };
      if (form.lon && form.lat) {
        body.lon = parseFloat(form.lon);
        body.lat = parseFloat(form.lat);
      }

      if (isEdit) {
        await api.put(`/api/projets/${initial!.id}`, body);
      } else {
        await api.post("/api/projets", body);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEdit ? t("common.edit") : t("common.create")} — Projet
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Nom */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nom du projet *
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => set("nom", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              required
            />
          </div>

          {/* Filiere + Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Filiere
              </label>
              <select
                value={form.filiere}
                onChange={(e) => set("filiere", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              >
                <option value="solaire_sol">Solaire sol</option>
                <option value="eolien_onshore">Eolien onshore</option>
                <option value="bess">BESS</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Statut
              </label>
              <select
                value={form.statut}
                onChange={(e) => set("statut", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              >
                <option value="prospection">Prospection</option>
                <option value="ingenierie">Ingenierie</option>
                <option value="autorisation">Autorisation</option>
                <option value="construction">Construction</option>
                <option value="exploitation">Exploitation</option>
              </select>
            </div>
          </div>

          {/* Puissance + Surface */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Puissance (MWc)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.puissance_mwc}
                onChange={(e) => set("puissance_mwc", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Surface (ha)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.surface_ha}
                onChange={(e) => set("surface_ha", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Commune
              </label>
              <input
                type="text"
                value={form.commune}
                onChange={(e) => set("commune", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Dept
              </label>
              <input
                type="text"
                maxLength={3}
                value={form.departement}
                onChange={(e) => set("departement", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Region
              </label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.lon}
                onChange={(e) => set("lon", e.target.value)}
                placeholder="ex: 2.3488"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.lat}
                onChange={(e) => set("lat", e.target.value)}
                placeholder="ex: 43.6047"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
