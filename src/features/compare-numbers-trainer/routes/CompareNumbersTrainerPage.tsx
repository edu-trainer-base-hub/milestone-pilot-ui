import React from "react";
import { useTranslation } from "react-i18next";
import { summarizeEnabledTypes } from "../lib/format";
import { useCompareNumbersTrainerController } from "../hooks/useCompareNumbersTrainerController";
import { CompareNumbersTrainerShell } from "../components/CompareNumbersTrainerShell";
import { CompareNumbersSetupScreen } from "../components/CompareNumbersSetupScreen";
import { CompareNumbersPlayScreen } from "../components/CompareNumbersPlayScreen";

export function CompareNumbersTrainerPage() {
  const { t } = useTranslation();
  const tr = React.useCallback((key: string, options?: Record<string, unknown>) => t(`cmpNmbrGm.${key}`, options), [t]);

  const {
    setup,
    session,
    capabilities,
    canStart,
    hasTimer,
    elapsedSec,
    timeLeft,
    exercisesLimit,
    historyDisplay,
    typeAvailableMap,
    actions,
  } = useCompareNumbersTrainerController();

  const focusRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (session.screen !== "play") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    focusRef.current?.focus({ preventScroll: true });
  }, [session.screen, session.sessionAnchor]);

  const playSummarySnippet =
    session.screen === "play"
      ? `${tr("summary.enabledTypes", {
          types: summarizeEnabledTypes(typeAvailableMap, tr),
        })} • ${tr("summary.equal", { ratio: setup.equalRatio })}`
      : null;

  return (
    <CompareNumbersTrainerShell
      isPlayScreen={session.screen === "play"}
      playSummarySnippet={playSummarySnippet}
      onNewSession={actions.newSession}
      onBackToSetup={actions.backToSetup}
      labels={{
        title: tr("title"),
        openMenuAria: tr("aria.openMenu"),
        menuLabel: tr("menuLabel"),
        newSession: tr("actions.newSession"),
        changeSetup: tr("actions.changeSetup"),
        toMenu: tr("actions.toMenu"),
      }}
    >
      {session.screen === "setup" ? (
        <CompareNumbersSetupScreen
          setup={setup}
          typeAvailableMap={typeAvailableMap}
          canStart={canStart}
          canUseCoreFeature={capabilities.canUseCoreFeature}
          onOpenModeChange={actions.setOpenMode}
          onNonNegativeConfigChange={actions.updateNonNegativeConfig}
          onSignedConfigChange={actions.updateSignedConfig}
          onDecimalConfigChange={actions.updateDecimalConfig}
          onFractionConfigChange={actions.updateFractionConfig}
          onEqualRatioChange={actions.setEqualRatio}
          onHistoryOrderChange={actions.setHistoryOrder}
          onTimerMinutesChange={actions.setTimerMinutes}
          onMaxExercisesChange={actions.setMaxExercises}
          onEnableSoundChange={actions.setEnableSound}
          onEnableVibrationChange={actions.setEnableVibration}
          onStartSession={actions.startSession}
        />
      ) : (
        <CompareNumbersPlayScreen
          session={session}
          historyDisplay={historyDisplay}
          historyOrder={setup.historyOrder}
          maxExercises={exercisesLimit}
          elapsedSec={elapsedSec}
          hasTimer={hasTimer}
          timeLeft={timeLeft}
          focusRef={focusRef}
          onAnswer={actions.submitAnswer}
        />
      )}
    </CompareNumbersTrainerShell>
  );
}
