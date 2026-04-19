import { ResultHistoryTable } from "@/components/ui/result-history-table";
import type { HistoryItem } from "../model/trainer.types";

type Translator = (key: string, vars?: Record<string, unknown>) => string;

export function HistoryTable({ history, tr }: { history: HistoryItem[]; tr: Translator }) {
  return (
    <ResultHistoryTable
      rows={history}
      emptyText={tr("table.empty")}
      getRowKey={(row) => row.id}
      columns={[
        {
          id: "example",
          role: "example",
          header: tr("table.example"),
          renderCell: (row) => row.prompt,
        },
        {
          id: "answer",
          role: "answer",
          header: tr("table.answer"),
          renderCell: (row) => row.userAnswer || "—",
        },
        {
          id: "result",
          role: "result",
          header: tr("table.result"),
          renderCell: (row) =>
            row.isCorrect ? (
              <span className="trainer-history-result-ok inline-flex items-center gap-1 text-green-700">
                <span role="img" aria-hidden>
                  ✅
                </span>
                {tr("table.correct")}
              </span>
            ) : (
              <div className="trainer-history-result-bad text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                <span className="inline-flex items-center gap-1">
                  <span role="img" aria-hidden>
                    ❌
                  </span>
                  {tr("table.incorrect", {
                    correct: row.correctAnswer,
                  })}
                </span>
              </div>
            ),
        },
      ]}
    />
  );
}
