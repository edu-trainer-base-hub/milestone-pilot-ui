import { ResultHistoryTable } from "@/components/ui/result-history-table";
import type { HistoryItem } from "../model/trainer.types";

interface HistoryTableProps {
  history: HistoryItem[];
  labels: {
    exampleColumn: string;
    answerColumn: string;
    resultColumn: string;
    emptyText: string;
    correctResultText: string;
    incorrectResultText: (correctAnswer: number) => string;
    correctAria: string;
    wrongAria: string;
  };
}

export function HistoryTable({ history, labels }: HistoryTableProps) {
  return (
    <ResultHistoryTable
      rows={history}
      emptyText={labels.emptyText}
      getRowKey={(_, idx) => idx}
      columns={[
        {
          id: "example",
          role: "example",
          header: labels.exampleColumn,
          renderCell: (item) => (
            <>
              {item.a} {item.op === "mul" ? "×" : "÷"} {item.b}
            </>
          ),
        },
        {
          id: "answer",
          role: "answer",
          header: labels.answerColumn,
          renderCell: (item) => item.answer,
        },
        {
          id: "result",
          role: "result",
          header: labels.resultColumn,
          renderCell: (item) => {
            const correctAnswer = item.op === "mul" ? item.a * item.b : Math.floor(item.a / item.b);
            if (item.correct) {
              return (
                <span className="trainer-history-result-ok inline-flex items-center gap-1 text-green-700">
                  <span role="img" aria-label={labels.correctAria}>
                    ✅
                  </span>
                  {labels.correctResultText}
                </span>
              );
            }
            return (
              <div className="trainer-history-result-bad text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                <span className="inline-flex items-center gap-1">
                  <span role="img" aria-label={labels.wrongAria}>
                    ❌
                  </span>
                  {labels.incorrectResultText(correctAnswer)}
                </span>
              </div>
            );
          },
        },
      ]}
    />
  );
}
