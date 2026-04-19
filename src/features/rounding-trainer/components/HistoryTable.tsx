import { useTranslation } from "react-i18next";
import { ResultHistoryTable } from "@/components/ui/result-history-table";
import type { HistoryItem, TargetPlace } from "../model/trainer.types";

interface HistoryTableProps {
  history: HistoryItem[];
  formatNumber: (value: number) => string;
}

function targetLabel(place: TargetPlace, t: (key: string, options?: Record<string, unknown>) => string): string {
  const key = place === 10 ? "tens" : place === 100 ? "hundreds" : "thousands";
  return t(`roundT.expl.target.${key}`);
}

export function HistoryTable({ history, formatNumber }: HistoryTableProps) {
  const { t } = useTranslation();

  return (
    <ResultHistoryTable
      rows={history}
      emptyText={t("roundT.table.empty")}
      getRowKey={(_, index) => index}
      columns={[
        {
          id: "example",
          role: "example",
          header: t("roundT.table.example"),
          headerClassName: "px-2 sm:px-4 text-center",
          cellClassName: "px-2 sm:px-4 py-2 text-center whitespace-normal",
          renderCell: (item) => (
            <>
              <span className="hidden sm:inline whitespace-nowrap">
                {formatNumber(item.original)} → {targetLabel(item.target, t)}
              </span>
              <span className="inline sm:hidden leading-tight whitespace-normal">
                <span className="block">{formatNumber(item.original)}</span>
                <span className="block">→ {targetLabel(item.target, t)}</span>
              </span>
            </>
          ),
        },
        {
          id: "answer",
          role: "answer",
          header: t("roundT.table.answer"),
          renderCell: (item) => formatNumber(item.user),
        },
        {
          id: "result",
          role: "result",
          header: t("roundT.table.result"),
          renderCell: (item) =>
            item.correct ? (
              <span className="trainer-history-result-ok inline-flex items-center gap-1 text-green-700">
                <span role="img" aria-label={t("roundT.aria.correct")}>
                  ✅
                </span>
                {t("roundT.table.correct")}
              </span>
            ) : (
              <div className="trainer-history-result-bad text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                <span className="inline-flex items-center gap-1">
                  <span role="img" aria-label={t("roundT.aria.wrong")}>
                    ❌
                  </span>
                  {t("roundT.table.incorrect", {
                    explanation: item.explanation,
                    correct: formatNumber(item.correctRounded),
                  })}
                </span>
              </div>
            ),
        },
      ]}
    />
  );
}
