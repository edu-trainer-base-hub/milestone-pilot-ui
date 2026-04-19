import React from "react";
import { useTranslation } from "react-i18next";
import { RoundingTrainerPlayScreen } from "../components/RoundingTrainerPlayScreen";
import { RoundingTrainerSetupScreen } from "../components/RoundingTrainerSetupScreen";
import { RoundingTrainerShell } from "../components/RoundingTrainerShell";
import { useLocaleNumberFormatter } from "../hooks/useLocaleNumberFormatter";
import { useRoundingTrainerController } from "../hooks/useRoundingTrainerController";

export function RoundingTrainerPage() {
  const { t } = useTranslation();
  const formatNumber = useLocaleNumberFormatter();

  const { state, capabilities, accuracy, elapsedSec, timeLeft, actions } = useRoundingTrainerController();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    if (state.screen === "setup") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [state.screen]);

  React.useEffect(() => {
    if (state.screen === "play" && state.config.mode === "input" && !state.gameOver) {
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [state.screen, state.config.mode, state.gameOver, state.currentTask?.taskId]);

  React.useEffect(() => {
    if (state.currentTask?.taskId == null) {
      setInputValue("");
      return;
    }
    setInputValue("");
  }, [state.currentTask?.taskId]);

  const minRangeLabel =
    state.config.magnitudeMode === "digits" ? `${state.config.minDigits}d` : formatNumber(state.config.minValue);
  const maxRangeLabel =
    state.config.magnitudeMode === "digits" ? `${state.config.maxDigits}d` : formatNumber(state.config.maxValue);

  const playSummarySnippet =
    state.screen === "play"
      ? t("roundT.rangeAccuracy", {
          min: minRangeLabel,
          max: maxRangeLabel,
          acc: accuracy,
        })
      : null;

  const handleInputSubmit = React.useCallback(() => {
    const parsed = parseFloat(inputValue.trim());
    if (Number.isNaN(parsed)) {
      inputRef.current?.focus();
      return;
    }
    const submitted = actions.submitAnswer(parsed);
    if (submitted) {
      setInputValue("");
    }
  }, [actions, inputValue]);

  const handleInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleInputSubmit();
      }
      if (event.key === "Escape") {
        setInputValue("");
      }
    },
    [handleInputSubmit]
  );

  const handleQuizSelect = React.useCallback(
    (value: number) => {
      actions.submitAnswer(value);
    },
    [actions]
  );

  return (
    <RoundingTrainerShell
      isPlayScreen={state.screen === "play"}
      playSummarySnippet={playSummarySnippet}
      onNewSession={actions.newSession}
      onBackToSetup={actions.backToSetup}
      labels={{
        title: t("roundT.title"),
        setupLabel: t("roundT.setup.label"),
        menuLabel: t("roundT.menu"),
        newSession: t("roundT.newSession"),
        changeSetup: t("roundT.changeRange"),
        toMenu: t("menu.mainMenuLabel", "Main Menu"),
      }}
    >
      {state.screen === "setup" ? (
        <RoundingTrainerSetupScreen
          config={state.config}
          canUseCoreFeature={capabilities.canUseCoreFeature}
          onConfigChange={actions.updateConfig}
          onStart={actions.startGame}
        />
      ) : (
        <RoundingTrainerPlayScreen
          state={state}
          accuracy={accuracy}
          elapsedSec={elapsedSec}
          timeLeft={timeLeft}
          formatNumber={formatNumber}
          inputValue={inputValue}
          inputRef={inputRef}
          onInputChange={setInputValue}
          onInputSubmit={handleInputSubmit}
          onInputKeyDown={handleInputKeyDown}
          onQuizSelect={handleQuizSelect}
        />
      )}
    </RoundingTrainerShell>
  );
}
