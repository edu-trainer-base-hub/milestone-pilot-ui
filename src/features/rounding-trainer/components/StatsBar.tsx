import { useTranslation } from "react-i18next";
import { StatisticsBlock } from "@/components/ui/statistics-block";
import { formatTime } from "../lib/time";

interface StatsBarProps {
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  elapsedSec: number;
  timerMinutes: number;
  timeLeft: number | null;
}

export function StatsBar({ correctCount, wrongCount, accuracy, elapsedSec, timerMinutes, timeLeft }: StatsBarProps) {
  const { t } = useTranslation();

  const statsItems = [
    { key: "correct", label: t("roundT.stats.correct"), value: correctCount },
    { key: "wrong", label: t("roundT.stats.wrong"), value: wrongCount },
    { key: "accuracy", label: t("roundT.stats.accuracy"), value: `${accuracy}%` },
    { key: "time", label: t("roundT.stats.time"), value: formatTime(elapsedSec) },
  ];

  if (timerMinutes > 0) {
    statsItems.push({
      key: "timeLeft",
      label: t("roundT.stats.timeLeft"),
      value: formatTime(timeLeft ?? 0),
    });
  }

  return <StatisticsBlock items={statsItems} />;
}
