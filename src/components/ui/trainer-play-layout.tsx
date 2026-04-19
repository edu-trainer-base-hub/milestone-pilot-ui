import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

interface TrainerPlayLayoutProps {
  banner?: ReactNode;
  stats?: ReactNode;
  extra?: ReactNode;
  main: ReactNode;
  history?: ReactNode;
  showHistory?: boolean;
  className?: string;
  gridClassName?: string;
  leftColumnClassName?: string;
  rightColumnClassName?: string;
  historyClassName?: string;
  leftColumnProps?: HTMLAttributes<HTMLDivElement>;
  leftColumnRef?: Ref<HTMLDivElement>;
}

export function TrainerPlayLayout({
  banner,
  stats,
  extra,
  main,
  history,
  showHistory = true,
  className,
  gridClassName,
  leftColumnClassName,
  rightColumnClassName,
  historyClassName,
  leftColumnProps,
  leftColumnRef,
}: TrainerPlayLayoutProps) {
  const hasHistory = showHistory && Boolean(history);
  const { className: leftPropsClassName, ...restLeftColumnProps } = leftColumnProps ?? {};

  return (
    <section
      className={cn(
        "bg-muted/50 backdrop-blur rounded-2xl shadow-lg flex-1 min-h-0 overflow-hidden p-2 sm:p-4 lg:p-6",
        className
      )}
    >
      <div
        className={cn(
          "grid h-full min-h-0 gap-3 sm:gap-4",
          hasHistory ? "grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-2 lg:grid-rows-1 lg:gap-6" : "grid-cols-1",
          gridClassName
        )}
      >
        <div
          ref={leftColumnRef}
          {...restLeftColumnProps}
          className={cn("flex min-h-0 flex-col gap-3 sm:gap-4", leftPropsClassName, leftColumnClassName)}
        >
          {banner}
          {stats}
          {extra}
          <div className="min-h-0">{main}</div>
        </div>

        {hasHistory && (
          <div className={cn("min-h-0 overflow-hidden", rightColumnClassName)}>
            <div className={cn("h-full min-h-0 overflow-hidden", historyClassName)}>{history}</div>
          </div>
        )}
      </div>
    </section>
  );
}
