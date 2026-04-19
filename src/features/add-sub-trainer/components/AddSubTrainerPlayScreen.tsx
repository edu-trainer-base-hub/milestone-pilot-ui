import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAccurateTimer } from "../hooks/useAccurateTimer";
import { StatsBar } from "./StatsBar";
import { TaskCard } from "./TaskCard";
import { HistoryTable } from "./HistoryTable";
import { FinishedBanner } from "./FinishedBanner";
import { TrainerPlayLayout } from "@/components/ui/trainer-play-layout";

export function AddSubTrainerPlayScreen({ controller }: { controller: any }) {
  const { t } = useTranslation();
  const tr = (key: string, vars?: Record<string, unknown>) => t(`addSubT.${key}`, vars);

  const { state } = controller;
  const { isPlayInteractable, accuracy } = controller;

  const timerActive = state.screen === "play" && !state.gameOver;
  const { elapsedSec } = useAccurateTimer(timerActive);

  const timerMinutes = state.config.timerMinutes;

  useEffect(() => {
    if (timerActive && timerMinutes > 0 && elapsedSec >= timerMinutes * 60) {
      controller.actions.finishGame("time");
    }
  }, [elapsedSec, timerActive, timerMinutes, controller.actions]);

  return (
    <TrainerPlayLayout
      banner={<FinishedBanner state={state} tr={tr} />}
      stats={<StatsBar state={state} accuracy={accuracy} elapsedSec={elapsedSec} tr={tr} />}
      main={
        state.currentTask && !state.gameOver ? (
          <TaskCard
            task={state.currentTask}
            config={state.config}
            isPlayInteractable={isPlayInteractable}
            submitAnswer={controller.actions.submitAnswer}
            gameOver={state.gameOver}
            lastWasCorrect={state.progress.lastWasCorrect}
            lastFeedback={state.progress.lastFeedback}
            tr={tr}
          />
        ) : null
      }
      history={<HistoryTable history={state.progress.history} tr={tr} />}
    />
  );
}
