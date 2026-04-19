import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatisticItemProps {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function StatisticItem({ label, value, className, labelClassName, valueClassName }: StatisticItemProps) {
  return (
    <Card className={cn("rounded-xl border shadow-sm min-w-20 py-0", className)}>
      <CardContent className="px-3 py-1.5">
        <div className={cn("text-[11px] text-muted-foreground leading-tight", labelClassName)}>{label}</div>
        <div className={cn("text-base font-semibold leading-tight", valueClassName)}>{value}</div>
      </CardContent>
    </Card>
  );
}
