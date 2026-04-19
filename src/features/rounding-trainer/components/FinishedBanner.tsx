import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SessionEndReason } from "../model/trainer.types";

interface FinishedBannerProps {
  endReason: SessionEndReason | null;
  totalAnswered: number;
}

export function FinishedBanner({ endReason, totalAnswered }: FinishedBannerProps) {
  const { t } = useTranslation();
  if (!endReason) return null;

  return (
    <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300">
      <AlertDescription>
        {endReason === "time"
          ? t("roundT.finished.timeUp")
          : t("roundT.finished.exLimit", {
              count: totalAnswered,
            })}
      </AlertDescription>
    </Alert>
  );
}
