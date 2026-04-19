import { ResultHistoryTable } from "@/components/ui/result-history-table";
import type { HistoryEntry, HistoryOrder } from "../model/trainer.types";
import { relationLabel } from "../lib/format";

type Translator = (key: string, options?: Record<string, unknown>) => string | null;

interface CompareNumbersHistoryTableProps {
  history: HistoryEntry[];
  historyDisplay: HistoryEntry[];
  historyOrder: HistoryOrder;
  tr: Translator;
}

export function CompareNumbersHistoryTable({
  history,
  historyDisplay,
  historyOrder,
  tr,
}: CompareNumbersHistoryTableProps) {
  return (
    <ResultHistoryTable
      rows={historyDisplay}
      emptyText={tr("history.empty") ?? ""}
      getRowKey={(entry) => entry.id}
      getRowClassName={(entry) => (entry.isCorrect ? undefined : "compare-history-row-incorrect bg-destructive/5")}
      header={{
        title: tr("history.title") ?? "",
        summary: tr("history.total", { count: history.length }) ?? "",
      }}
      columns={[
        {
          id: "index",
          role: "aux",
          header: "#",
          headerClassName: "w-10 px-2 text-center",
          cellClassName: "px-2 py-2 text-center text-xs text-muted-foreground",
          renderCell: (_, index) => (historyOrder === "asc" ? index + 1 : history.length - index),
        },
        {
          id: "example",
          role: "example",
          header: tr("history.example") ?? "",
          headerClassName: "w-[24%] px-4 text-center",
          cellClassName: "px-4 py-2 whitespace-normal",
          renderCell: (entry) => (
            <>
              <div className="text-sm font-medium leading-tight">
                {entry.left.display} ? {entry.right.display}
              </div>
              <div className="text-xs text-muted-foreground">
                {tr("history.correct", {
                  relation: relationLabel(entry.correctRelation, tr),
                  left: entry.left.display,
                  right: entry.right.display,
                })}
              </div>
            </>
          ),
        },
        {
          id: "result",
          role: "result",
          header: tr("history.answer") ?? "",
          headerClassName: "w-[66%] px-4 text-center",
          renderCell: (entry) =>
            entry.isCorrect ? (
              <span className="trainer-history-result-ok inline-flex items-center gap-1 text-green-700">
                <span role="img" aria-hidden>
                  ✅
                </span>
                {tr("history.result.correct", {
                  relation: relationLabel(entry.userRelation, tr),
                })}
              </span>
            ) : (
              <div className="trainer-history-result-bad grid gap-1 text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                <span className="inline-flex items-start gap-1">
                  <span role="img" aria-hidden>
                    ❌
                  </span>
                  {tr("history.result.user", {
                    relation: relationLabel(entry.userRelation, tr),
                  })}
                </span>
                <span className="pl-5">
                  {tr("history.result.expected", {
                    relation: relationLabel(entry.correctRelation, tr),
                  })}
                </span>
              </div>
            ),
        },
      ]}
    />
  );
}
