import { Calculator } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TrainerSettingsMenu } from "./TrainerSettingsMenu";

export function AddSubTrainerHeader({ controller }: { controller: any }) {
  const { t } = useTranslation();
  const tr = (key: string, vars?: any) => t(`addSubT.${key}`, vars) as string;

  const isPlayScreen = controller.state.screen === "play";
  const { minVal, maxVal } = controller.state.config;

  const statsSnippet =
    isPlayScreen && controller.state.currentTask
      ? tr("play.rangeAccuracy", {
          min: Math.min(minVal, maxVal),
          max: Math.max(minVal, maxVal),
          acc: controller.accuracy,
        })
      : null;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Calculator className="size-5 text-primary" aria-hidden />
        <span className="hidden sm:inline text-xs text-muted-foreground">{tr("title")}</span>
      </div>

      <div className="flex items-center text-center">
        {statsSnippet && <span className="w-full text-[10px] sm:text-xs text-muted-foreground">{statsSnippet}</span>}
      </div>

      <TrainerSettingsMenu
        showPlayActions={isPlayScreen}
        onNewSession={controller.actions.newSession}
        onBackToSetup={controller.actions.backToSetup}
        labels={{
          menu: tr("menu") || "Menu",
          newSession: tr("actions.newSession") || "",
          changeSetup: tr("actions.changeSetup") || "",
          mainMenuLabel: t("menu.mainMenuLabel") || "",
        }}
      />
    </div>
  );
}
