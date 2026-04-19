import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatisticItem } from "@/components/ui/statistic-item";

export interface StatisticsBlockItem {
  key: string;
  label: ReactNode;
  value: ReactNode;
}

interface StatisticsBlockProps {
  items: StatisticsBlockItem[];
  className?: string;
  itemClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function StatisticsBlock({
  items,
  className,
  itemClassName,
  labelClassName,
  valueClassName,
}: StatisticsBlockProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map((item) => (
        <StatisticItem
          key={item.key}
          label={item.label}
          value={item.value}
          className={itemClassName}
          labelClassName={labelClassName}
          valueClassName={valueClassName}
        />
      ))}
    </div>
  );
}
