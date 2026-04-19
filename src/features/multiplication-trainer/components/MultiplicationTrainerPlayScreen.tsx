import React from "react";
import { FinishedBanner } from "./FinishedBanner";
import { StatsBar } from "./StatsBar";
import { TaskCard } from "./TaskCard";
import { AnswerInput } from "./AnswerInput";
import { QuizOptions } from "./QuizOptions";
import { HistoryTable } from "./HistoryTable";
import { TrainerPlayLayout } from "@/components/ui/trainer-play-layout";
import type { SessionState } from "../model/trainer.types";

interface MultiplicationTrainerPlayScreenProps {
  state: SessionState;
  accuracy: number;
  elapsedSec: number;
  totalAnswered: number;
  isInteractable: boolean;
  onAnswerSubmit: (val: number) => void;
  // Ephemeral pure UI state for controlled input mode
  inputValue: string;
  onInputChange: (val: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  showHistory?: boolean;
  labels: {
    finishedTimeUp: string;
    finishedExLimit: (count: number) => string;
    statsCorrect: string;
    statsWrong: string;
    statsAccuracy: string;
    statsTime: string;
    statsTimeLeft: string;
    srOperatorMul: string;
    srOperatorDiv: string;
    inputPlaceholder: string;
    inputSubmit: string;
    inputHint: string;
    ariaAnswerField: string;
    ariaOption: (opt: number) => string;
    ariaCorrect: string;
    ariaWrong: string;
    tableExample: string;
    tableAnswer: string;
    tableResult: string;
    tableEmpty: string;
    tableCorrect: string;
    tableIncorrect: (correctAnswer: number) => string;
  };
}

export function MultiplicationTrainerPlayScreen({
  state,
  accuracy,
  elapsedSec,
  totalAnswered,
  isInteractable,
  onAnswerSubmit,
  inputValue,
  onInputChange,
  inputRef,
  showHistory = true,
  labels,
}: MultiplicationTrainerPlayScreenProps) {
  const { gameOver, endReason, progress, config, currentTask } = state;

  return (
    <TrainerPlayLayout
      showHistory={showHistory}
      banner={
        <FinishedBanner
          endReason={endReason}
          totalAnswered={totalAnswered}
          timeUpLabel={labels.finishedTimeUp}
          exLimitLabel={labels.finishedExLimit}
        />
      }
      stats={
        <StatsBar
          correctCount={progress.correctCount}
          wrongCount={progress.wrongCount}
          accuracy={accuracy}
          elapsedSec={elapsedSec}
          timerLimitSec={config.timerMinutes * 60}
          labels={{
            correct: labels.statsCorrect,
            wrong: labels.statsWrong,
            accuracy: labels.statsAccuracy,
            time: labels.statsTime,
            timeLeft: labels.statsTimeLeft,
          }}
        />
      }
      main={
        !gameOver && currentTask ? (
          <TaskCard
            a={currentTask.a}
            b={currentTask.b}
            op={currentTask.op}
            srLabel={currentTask.op === "mul" ? labels.srOperatorMul : labels.srOperatorDiv}
            lastLine={progress.lastLine}
            lastCorrect={progress.lastCorrect}
            correctAria={labels.ariaCorrect}
            wrongAria={labels.ariaWrong}
          >
            {config.mode === "input" ? (
              <AnswerInput
                ref={inputRef}
                answer={inputValue}
                onChange={onInputChange}
                onSubmit={() => {
                  const parsed = parseInt(inputValue.trim(), 10);
                  if (!Number.isNaN(parsed)) {
                    onAnswerSubmit(parsed);
                    onInputChange(""); // reset local input
                  } else if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
                disabled={!isInteractable}
                placeholder={labels.inputPlaceholder}
                submitLabel={labels.inputSubmit}
                hintLabel={labels.inputHint}
                ariaLabel={labels.ariaAnswerField}
              />
            ) : (
              <QuizOptions
                options={currentTask.options}
                taskId={currentTask.taskId}
                onSelect={onAnswerSubmit}
                disabled={!isInteractable}
                getAriaLabel={labels.ariaOption}
              />
            )}
          </TaskCard>
        ) : null
      }
      history={
        <HistoryTable
          history={progress.history}
          labels={{
            exampleColumn: labels.tableExample,
            answerColumn: labels.tableAnswer,
            resultColumn: labels.tableResult,
            emptyText: labels.tableEmpty,
            correctResultText: labels.tableCorrect,
            incorrectResultText: labels.tableIncorrect,
            correctAria: labels.ariaCorrect,
            wrongAria: labels.ariaWrong,
          }}
        />
      }
    />
  );
}
