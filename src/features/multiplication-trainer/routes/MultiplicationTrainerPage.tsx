import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMultiplicationTrainerController } from "../hooks/useMultiplicationTrainerController";
import { MultiplicationTrainerShell } from "../components/MultiplicationTrainerShell";
import { MultiplicationTrainerSetupScreen } from "../components/MultiplicationTrainerSetupScreen";
import { MultiplicationTrainerPlayScreen } from "../components/MultiplicationTrainerPlayScreen";

export function MultiplicationTrainerPage() {
  const { t } = useTranslation();
  const { state, accuracy, elapsedSec, totalAnswered, isInteractable, isPlayInteractable, actions } =
    useMultiplicationTrainerController();

  // Thin ephemeral state for the single input component
  const [inputValue, setInputValue] = useState("");
  const [showHistory, setShowHistory] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus effect from original monolith, kept purely at the view composition layer
  React.useEffect(() => {
    if (state.screen === "play" && state.config.mode === "input" && !state.gameOver) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [state.screen, state.config.mode, state.gameOver, state.currentTask?.taskId]);

  const headerLabels = {
    menu: t("multiT.menu"),
    newSession: t("multiT.newSession"),
    changeRange: t("multiT.changeRange"),
    showHistory: t("multiT.showHistory"),
    mainMenuLabel: t("menu.mainMenuLabel"),
  };

  const playStatsSnippet = t("multiT.rangeAccuracy", {
    min: Math.min(state.config.minVal, state.config.maxVal),
    max: Math.max(state.config.minVal, state.config.maxVal),
    acc: accuracy,
  });

  return (
    <MultiplicationTrainerShell
      title={t("multiT.title")}
      isPlayScreen={state.screen === "play"}
      playStatsSnippet={playStatsSnippet}
      onNewSession={actions.newSession}
      onBackToSetup={actions.backToSetup}
      showHistory={showHistory}
      onToggleHistory={() => setShowHistory((prev) => !prev)}
      headerLabels={headerLabels}
    >
      {state.screen === "setup" ? (
        <MultiplicationTrainerSetupScreen
          minVal={state.config.minVal}
          maxVal={state.config.maxVal}
          mode={state.config.mode}
          includeMul={state.config.includeMul}
          includeDiv={state.config.includeDiv}
          timerMinutes={state.config.timerMinutes}
          maxExercises={state.config.maxExercises}
          onMinChange={(val) => actions.updateConfig({ minVal: val })}
          onMaxChange={(val) => actions.updateConfig({ maxVal: val })}
          onModeChange={(val) => actions.updateConfig({ mode: val })}
          onMulChange={(val) => actions.updateConfig({ includeMul: val })}
          onDivChange={(val) => actions.updateConfig({ includeDiv: val })}
          onTimerChange={(val) => actions.updateConfig({ timerMinutes: val })}
          onMaxExercisesChange={(val) => actions.updateConfig({ maxExercises: val })}
          onStartClick={actions.startGame}
          isInteractable={isInteractable}
          labels={{
            introText: (
              <>
                {t("multiT.setup.intro")} <b>4…9</b>.
              </>
            ),
            min: t("multiT.setup.min")!,
            max: t("multiT.setup.max")!,
            mode: t("multiT.setup.mode")!,
            modeQuiz: t("multiT.mode.quiz"),
            modeInput: t("multiT.mode.input"),
            mul: t("multiT.ex.mul"),
            div: t("multiT.ex.div"),
            timer: t("multiT.setup.timer")!,
            maxExercises: t("multiT.setup.maxExercises")!,
            start: t("multiT.start"),
            menu: t("multiT.menu"),
            note: t("multiT.setup.note"),
            ariaBackToMenu: t("multiT.aria.backToMenu")!,
          }}
        />
      ) : (
        <MultiplicationTrainerPlayScreen
          state={state}
          accuracy={accuracy}
          elapsedSec={elapsedSec}
          totalAnswered={totalAnswered}
          isInteractable={isPlayInteractable}
          onAnswerSubmit={actions.submitAnswer}
          inputValue={inputValue}
          onInputChange={setInputValue}
          inputRef={inputRef}
          showHistory={showHistory}
          labels={{
            finishedTimeUp: t("multiT.finished.timeUp"),
            finishedExLimit: (count: number) => t("multiT.finished.exLimit", { count }),
            statsCorrect: t("multiT.stats.correct")!,
            statsWrong: t("multiT.stats.wrong")!,
            statsAccuracy: t("multiT.stats.accuracy")!,
            statsTime: t("multiT.stats.time")!,
            statsTimeLeft: t("multiT.stats.timeLeft")!,
            srOperatorMul: t("multiT.sr.mul"),
            srOperatorDiv: t("multiT.sr.div"),
            inputPlaceholder: t("multiT.input.placeholder") || "",
            inputSubmit: t("multiT.input.submit"),
            inputHint: t("multiT.input.hint"),
            ariaAnswerField: t("multiT.aria.answerField") || (undefined as any),
            ariaOption: (opt: number) => t("multiT.quiz.optionAria", { opt }) || (undefined as any),
            ariaCorrect: t("multiT.aria.correct") || (undefined as any),
            ariaWrong: t("multiT.aria.wrong") || (undefined as any),
            tableExample: t("multiT.table.example"),
            tableAnswer: t("multiT.table.answer"),
            tableResult: t("multiT.table.result"),
            tableEmpty: t("multiT.table.empty"),
            tableCorrect: t("multiT.table.correct"),
            tableIncorrect: (correctAnswer: number) => t("multiT.table.incorrect", { correct: correctAnswer }),
          }}
        />
      )}
    </MultiplicationTrainerShell>
  );
}
