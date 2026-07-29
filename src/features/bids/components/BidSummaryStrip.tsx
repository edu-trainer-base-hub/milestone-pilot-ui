import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { BidDashboard } from "../model/types";

const chips = [
  { key: "open", field: "open", dot: "bg-blue-500" },
  { key: "dueSoon", field: "dueSoon", dot: "bg-amber-500" },
  { key: "overdue", field: "overdue", dot: "bg-red-500", danger: true },
  { key: "pendingReview", field: "pendingReview", dot: "bg-violet-500" },
  { key: "submitted", field: "submitted", dot: "bg-teal-500" },
  { key: "awarded", field: "awarded", dot: "bg-green-500" },
  { key: "parsingFailures", field: "recentParsingFailures", dot: "bg-red-500", danger: true },
] as const;

export function BidSummaryStrip({ summary }: { summary?: BidDashboard }) {
  const { t } = useTranslation();

  if (!summary) {
    return (
      <div className="flex flex-wrap gap-1.5" aria-hidden="true">
        {chips.map((chip) => (
          <Skeleton key={chip.key} className="h-7 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={t("bids.title")}>
      {chips.map((chip) => {
        const value = summary[chip.field];
        const alert = "danger" in chip && chip.danger && value > 0;
        return (
          <li
            key={chip.key}
            data-testid={`bid-summary-${chip.key}`}
            data-alert={alert || undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground",
              alert && "border-destructive/40 bg-destructive/10 text-destructive"
            )}
          >
            <span className={cn("size-1.5 rounded-full", chip.dot)} aria-hidden="true" />
            <span className={cn("text-sm font-semibold", alert ? "text-destructive" : "text-foreground")}>{value}</span>
            {t(`bids.dashboard.${chip.key}`)}
          </li>
        );
      })}
    </ul>
  );
}
