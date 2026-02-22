import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import api from "../../lib/api";

export default function GeoJsonDropZone() {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const name = file.name.replace(/\.(geojson|json)$/i, "");
      return api.post(`/layers/upload?name=${encodeURIComponent(name)}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      setError(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || t("layers.uploadError"));
    },
  });

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      setError(null);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      if (!file.name.endsWith(".geojson") && !file.name.endsWith(".json")) {
        setError(t("layers.invalidFormat"));
        return;
      }
      if (file.size > 10_000_000) {
        setError(t("layers.tooLarge"));
        return;
      }

      upload.mutate(file);
    },
    [upload, t],
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`pointer-events-auto absolute inset-0 z-20 transition-all duration-200 ${
        dragging
          ? "border-4 border-dashed border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30"
          : "pointer-events-none"
      }`}
    >
      {dragging && (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/90 px-8 py-6 shadow-xl backdrop-blur-sm dark:bg-slate-800/90">
            <Upload className="h-10 w-10 text-indigo-500" />
            <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">{t("layers.dropHere")}</p>
          </div>
        </div>
      )}

      {upload.isPending && (
        <div className="absolute bottom-4 left-4 z-30 rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white shadow-lg">
          {t("layers.uploading")}
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 z-30 rounded-lg bg-red-500 px-4 py-2 text-sm text-white shadow-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
