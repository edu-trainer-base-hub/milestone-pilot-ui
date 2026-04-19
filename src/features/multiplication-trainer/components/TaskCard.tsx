import React from "react";

interface TaskCardProps {
  a: number;
  b: number;
  op: "mul" | "div";
  /** Allows dynamic replacement of screen-reader text natively */
  srLabel: string;
  children: React.ReactNode;
  lastLine: string;
  lastCorrect: boolean | null;
  correctAria: string;
  wrongAria: string;
}

export function TaskCard({
  a,
  b,
  op,
  srLabel,
  children,
  lastLine,
  lastCorrect,
  correctAria,
  wrongAria,
}: TaskCardProps) {
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-6xl font-semibold tracking-wide select-none">
        {a} <span aria-hidden>{op === "mul" ? "×" : "÷"}</span> <span className="sr-only">{srLabel}</span> {b} =
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 w-full">{children}</div>

      <div className="mt-4 text-lg sm:text-xl" aria-live="polite" aria-atomic="true">
        {lastLine && (
          <span className="inline-flex items-center gap-2">
            <span className="font-medium">{lastLine}</span>
            {lastCorrect === true && (
              <span role="img" aria-label={correctAria}>
                ✅
              </span>
            )}
            {lastCorrect === false && (
              <span role="img" aria-label={wrongAria}>
                ❌
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
