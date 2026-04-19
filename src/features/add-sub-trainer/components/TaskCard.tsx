import { cn } from "@/lib/utils";
import { AnswerInput } from "./AnswerInput";
import { QuizOptions } from "./QuizOptions";
import type { TaskState, SessionConfig } from "../model/trainer.types";

export function TaskCard({
  task,
  config,
  isPlayInteractable,
  submitAnswer,
  gameOver,
  lastWasCorrect,
  lastFeedback,
  tr,
}: {
  task: TaskState;
  config: SessionConfig;
  isPlayInteractable: boolean;
  submitAnswer: (userAnswer: string, correctAnswer: number, prompt: string, isCorrect: boolean) => void;
  gameOver: boolean;
  lastWasCorrect: boolean | null;
  lastFeedback: string | null;
  tr: any;
}) {
  const displayStatus = gameOver ? null : lastFeedback;

  return (
    <div className="text-center">
      <div className="text-4xl sm:text-6xl font-semibold tracking-wide select-none">
        {task.prompt.replace(/\?/g, "☐")}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
        {config.playMode === "input" ? (
          <AnswerInput
            onSubmit={(val) => submitAnswer(val, task.correctAnswer, task.prompt, val === String(task.correctAnswer))}
            placeholder={tr("play.placeholder") || ""}
            ariaLabel={tr("aria.answerField") || undefined}
            taskId={task.taskId}
            disabled={!isPlayInteractable}
            tr={tr}
          />
        ) : (
          <QuizOptions
            correctAnswer={task.correctAnswer}
            disabled={!isPlayInteractable}
            onSelect={(val) => submitAnswer(String(val), task.correctAnswer, task.prompt, val === task.correctAnswer)}
          />
        )}
      </div>

      {displayStatus && (
        <p className={cn("mt-3 text-sm font-medium", lastWasCorrect ? "text-emerald-600" : "text-destructive")}>
          {displayStatus}
        </p>
      )}
    </div>
  );
}
