import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface QuizKeyboardPadOption<T extends string | number> {
  key?: string;
  value: T;
  label?: ReactNode;
  ariaLabel?: string;
  hotkeyHint?: string;
}

interface QuizKeyboardPadProps<T extends string | number> {
  options: ReadonlyArray<QuizKeyboardPadOption<T>>;
  onSelect: (value: T) => void;
  disabled?: boolean;
  taskId?: string | number;
  columns?: 1 | 2 | 3 | 4;
  hotkeysHint?: ReactNode;
  className?: string;
  buttonClassName?: string;
}

const gridColumns = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

export function QuizKeyboardPad<T extends string | number>({
  options,
  onSelect,
  disabled = false,
  taskId = "quiz",
  columns = 2,
  hotkeysHint,
  className,
  buttonClassName,
}: QuizKeyboardPadProps<T>) {
  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className={cn("grid gap-2 sm:gap-3 w-full", gridColumns[columns])}>
        {options.map((option, index) => (
          <Button
            key={option.key ?? `${taskId}-${index}`}
            variant="outline"
            onClick={(event) => {
              (event.currentTarget as HTMLButtonElement).blur();
              if (!disabled) onSelect(option.value);
            }}
            onTouchEnd={(event) => (event.currentTarget as HTMLButtonElement).blur()}
            aria-label={option.ariaLabel}
            disabled={disabled}
            className={cn("px-3 py-3 text-xl font-medium sm:px-5 sm:py-4 sm:text-2xl", buttonClassName)}
          >
            <span className="inline-flex items-center gap-2">
              <span>{option.label ?? option.value}</span>
              {option.hotkeyHint && <span className="text-xs text-muted-foreground">{option.hotkeyHint}</span>}
            </span>
          </Button>
        ))}
      </div>

      {hotkeysHint ? <p className="mt-3 text-xs text-muted-foreground">{hotkeysHint}</p> : null}
    </div>
  );
}
