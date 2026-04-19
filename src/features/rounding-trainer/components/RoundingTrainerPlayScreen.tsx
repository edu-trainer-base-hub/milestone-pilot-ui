import React from "react";
import type { SessionState } from "../model/trainer.types";
import { FinishedBanner } from "./FinishedBanner";
import { HistoryTable } from "./HistoryTable";
import { StatsBar } from "./StatsBar";
import { TaskCard } from "./TaskCard";
import { TrainerPlayLayout } from "@/components/ui/trainer-play-layout";

interface RoundingTrainerPlayScreenProps {
  state: SessionState;
  accuracy: number;
  elapsedSec: number;
  timeLeft: number | null;
  formatNumber: (value: number) => string;
  inputValue: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
  onInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onQuizSelect: (value: number) => void;
}

export function RoundingTrainerPlayScreen({
  state,
  accuracy,
  elapsedSec,
  timeLeft,
  formatNumber,
  inputValue,
  inputRef,
  onInputChange,
  onInputSubmit,
  onInputKeyDown,
  onQuizSelect,
}: RoundingTrainerPlayScreenProps) {
  const totalAnswered = state.progress.correctCount + state.progress.wrongCount;

  return (
    <TrainerPlayLayout
      banner={state.gameOver ? <FinishedBanner endReason={state.endReason} totalAnswered={totalAnswered} /> : null}
      stats={
        <StatsBar
          correctCount={state.progress.correctCount}
          wrongCount={state.progress.wrongCount}
          accuracy={accuracy}
          elapsedSec={elapsedSec}
          timerMinutes={state.config.timerMinutes}
          timeLeft={timeLeft}
        />
      }
      main={
        <TaskCard
          task={state.currentTask}
          mode={state.config.mode}
          showHint={state.config.showHint}
          gameOver={state.gameOver}
          inputValue={inputValue}
          lastLine={state.progress.lastLine}
          lastCorrect={state.progress.lastCorrect}
          formatNumber={formatNumber}
          inputRef={inputRef}
          onInputChange={onInputChange}
          onInputSubmit={onInputSubmit}
          onInputKeyDown={onInputKeyDown}
          onQuizSelect={onQuizSelect}
        />
      }
      history={<HistoryTable history={state.progress.history} formatNumber={formatNumber} />}
    />
  );
}
