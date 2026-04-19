import { StatisticsBlock } from "@/components/ui/statistics-block";
import { formatTime } from "../lib/time";
import type { SessionState } from "../model/trainer.types";

export function StatsBar({
  state,
  accuracy,
  elapsedSec,
  tr,
}: {
  state: SessionState;
  accuracy: number;
  elapsedSec: number;
  tr: any;
}) {
  const { correctCount, wrongCount, streak, bestStreak } = state.progress;
  const timerMinutes = state.config.timerMinutes;

  const statsItems = [
    { key: "correct", label: tr("stats.correct")!, value: correctCount },
    { key: "wrong", label: tr("stats.wrong")!, value: wrongCount },
    { key: "accuracy", label: tr("stats.accuracy")!, value: `${accuracy}%` },
    { key: "time", label: tr("stats.time")!, value: formatTime(elapsedSec) },
  ];

  if (timerMinutes > 0) {
    statsItems.push({
      key: "timeLeft",
      label: tr("stats.timeLeft")!,
      value: formatTime(Math.max(0, timerMinutes * 60 - elapsedSec)),
    });
  }

  statsItems.push({
    key: "streak",
    label: tr("stats.streak")!,
    value: `${streak} / ${bestStreak}`,
  });

  return <StatisticsBlock items={statsItems} />;
}
