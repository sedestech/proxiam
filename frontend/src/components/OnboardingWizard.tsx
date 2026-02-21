import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MapPin, Network, Box, ChevronRight, Sparkles } from "lucide-react";
import { useAppStore } from "../stores/appStore";

const PILLAR_ROUTES = ["/map", "/knowledge", "/3d"] as const;

interface PillarCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  onTry: () => void;
  tryLabel: string;
}

function PillarCard({ icon: Icon, title, description, color, onTry, tryLabel }: PillarCardProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <button
        onClick={onTry}
        className="mt-1 flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 min-h-[36px]"
      >
        {tryLabel}
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ease-out ${
            i === current ? "w-6 bg-indigo-500" : "w-2 bg-slate-300 dark:bg-slate-600"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);
  const [step, setStep] = useState(0);

  function close() {
    setHasSeenOnboarding(true);
  }

  function handleCreateProject() {
    setHasSeenOnboarding(true);
    navigate("/projects?new=1");
  }

  function handleExplore() {
    setHasSeenOnboarding(true);
  }

  function handleTryPillar(index: number) {
    setHasSeenOnboarding(true);
    navigate(PILLAR_ROUTES[index]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-800 md:max-w-xl">
        {/* Content area with step transitions */}
        <div className="overflow-hidden">
          {/* Step 1: Welcome */}
          {step === 0 && (
            <div className="animate-fade-in p-6 text-center sm:p-8">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
                <Sparkles className="h-7 w-7 text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {t("onboarding.welcome")}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t("onboarding.welcomeDesc")}
              </p>

              {/* 3 pillar icons */}
              <div className="mt-6 flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                    <MapPin className="h-6 w-6 text-blue-500" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {t("onboarding.map")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/30">
                    <Network className="h-6 w-6 text-violet-500" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {t("onboarding.knowledge")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                    <Box className="h-6 w-6 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {t("onboarding.viewer3d")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-600 active:bg-indigo-700 min-h-[44px]"
              >
                {t("onboarding.start")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Three Pillars */}
          {step === 1 && (
            <div className="animate-fade-in p-6 sm:p-8">
              <h2 className="text-center text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                {t("onboarding.pillars")}
              </h2>

              <div className="mt-5 space-y-3">
                <PillarCard
                  icon={MapPin}
                  title={t("onboarding.map")}
                  description={t("onboarding.mapDesc")}
                  color="#3b82f6"
                  onTry={() => handleTryPillar(0)}
                  tryLabel={t("onboarding.tryIt")}
                />
                <PillarCard
                  icon={Network}
                  title={t("onboarding.knowledge")}
                  description={t("onboarding.knowledgeDesc")}
                  color="#8b5cf6"
                  onTry={() => handleTryPillar(1)}
                  tryLabel={t("onboarding.tryIt")}
                />
                <PillarCard
                  icon={Box}
                  title={t("onboarding.viewer3d")}
                  description={t("onboarding.viewer3dDesc")}
                  color="#10b981"
                  onTry={() => handleTryPillar(2)}
                  tryLabel={t("onboarding.tryIt")}
                />
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-600 active:bg-indigo-700 min-h-[44px]"
                >
                  {t("onboarding.next")}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 2 && (
            <div className="animate-fade-in p-6 text-center sm:p-8">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30">
                <Sparkles className="h-7 w-7 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {t("onboarding.ready")}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t("onboarding.readyDesc")}
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={handleCreateProject}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-600 active:bg-indigo-700 sm:w-auto min-h-[44px]"
                >
                  {t("onboarding.createProject")}
                </button>
                <button
                  onClick={handleExplore}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto min-h-[44px]"
                >
                  {t("onboarding.explore")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with step indicator and skip */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-700">
          <StepIndicator current={step} total={3} />
          {step < 2 && (
            <button
              onClick={close}
              className="text-xs text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300 min-h-[44px] px-2"
            >
              {t("onboarding.explore")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
