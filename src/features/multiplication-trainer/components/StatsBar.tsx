import { StatisticsBlock } from "@/components/ui/statistics-block";
import { formatTime } from "../lib/time";

interface StatsBarProps {
  correctCount: number;
  wrongCount: number;
  accuracy: number | string;
  elapsedSec: number;
  timerLimitSec: number; // 0 if unlimited
  labels: {
    correct: string;
    wrong: string;
    accuracy: string;
    time: string;
    timeLeft: string;
  };
}

export function StatsBar({ correctCount, wrongCount, accuracy, elapsedSec, timerLimitSec, labels }: StatsBarProps) {
  const statsItems = [
    { key: "correct", label: labels.correct, value: correctCount },
    { key: "wrong", label: labels.wrong, value: wrongCount },
    { key: "accuracy", label: labels.accuracy, value: `${accuracy}%` },
    { key: "time", label: labels.time, value: formatTime(elapsedSec) },
  ];

  if (timerLimitSec > 0) {
    statsItems.push({
      key: "timeLeft",
      label: labels.timeLeft,
      value: formatTime(Math.max(0, timerLimitSec - elapsedSec)),
    });
  }

  return <StatisticsBlock items={statsItems} />;
}
