import React from "react";
import { useTranslation } from "react-i18next";
import { getCheckDigitForPlace } from "../lib/rounding";
import type { Mode, RoundingTask, TargetPlace } from "../model/trainer.types";
import { AnswerInput } from "./AnswerInput";
import { QuizOptions } from "./QuizOptions";

interface TaskCardProps {
  task: RoundingTask | null;
  mode: Mode;
  showHint: boolean;
  gameOver: boolean;
  inputValue: string;
  lastLine: string;
  lastCorrect: boolean | null;
  formatNumber: (value: number) => string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
  onInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onQuizSelect: (value: number) => void;
}

function targetLabel(place: TargetPlace, t: (key: string, options?: Record<string, unknown>) => string): string {
  const key = place === 10 ? "tens" : place === 100 ? "hundreds" : "thousands";
  return t(`roundT.expl.target.${key}`);
}

function renderHint(
  original: number,
  target: TargetPlace,
  t: (key: string, options?: Record<string, unknown>) => string,
  formatNumber: (value: number) => string
) {
  const absolute = Math.abs(Math.trunc(original));
  const digit = getCheckDigitForPlace(original, target);
  const arrow = digit >= 5 ? "↑" : "↓";
  const lowerKey = target === 10 ? "ones" : target === 100 ? "tens" : "hundreds";
  const lower = t(`roundT.expl.lower.${lowerKey}`);

  return (
    <span>
      {t("roundT.hint.template", {
        lower,
        num: formatNumber(absolute),
        digit,
        arrow,
      })}
    </span>
  );
}

export function TaskCard({
  task,
  mode,
  showHint,
  gameOver,
  inputValue,
  lastLine,
  lastCorrect,
  formatNumber,
  inputRef,
  onInputChange,
  onInputSubmit,
  onInputKeyDown,
  onQuizSelect,
}: TaskCardProps) {
  const { t } = useTranslation();
  if (gameOver || !task) return null;

  return (
    <div className="text-center">
      <div className="text-3xl sm:text-5xl font-semibold tracking-wide select-none">
        {formatNumber(task.original)} <span aria-hidden>→</span> <span className="sr-only">{t("roundT.sr.to")}</span>{" "}
        {targetLabel(task.target, t)}
      </div>

      {showHint && (
        <div className="mt-2 text-sm text-muted-foreground">
          {renderHint(task.original, task.target, t, formatNumber)}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-3">
        {mode === "input" ? (
          <AnswerInput
            inputRef={inputRef}
            value={inputValue}
            disabled={gameOver}
            onChange={onInputChange}
            onSubmit={onInputSubmit}
            onKeyDown={onInputKeyDown}
          />
        ) : (
          <QuizOptions
            taskId={task.taskId}
            options={task.options}
            disabled={gameOver}
            formatNumber={formatNumber}
            onSelect={onQuizSelect}
          />
        )}
      </div>

      <div className="mt-4 text-lg sm:text-xl" aria-live="polite" aria-atomic="true">
        {lastLine && (
          <span className="inline-flex items-center gap-2">
            <span className="font-medium">{lastLine}</span>
            {lastCorrect === true && (
              <span role="img" aria-label={t("roundT.aria.correct")}>
                ✅
              </span>
            )}
            {lastCorrect === false && (
              <span role="img" aria-label={t("roundT.aria.wrong")}>
                ❌
              </span>
            )}
          </span>
        )}
      </div>

      {mode === "input" && <p className="mt-2 text-xs text-muted-foreground">{t("roundT.input.hint")}</p>}
    </div>
  );
}
