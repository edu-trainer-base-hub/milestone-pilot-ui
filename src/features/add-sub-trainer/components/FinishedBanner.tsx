import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SessionState } from "../model/trainer.types";

export function FinishedBanner({ state, tr }: { state: SessionState; tr: any }) {
  if (!state.gameOver) return null;

  return (
    <Alert>
      <AlertDescription>
        {state.endReason === "time"
          ? tr("play.finished.time")
          : tr("play.finished.limit", { count: state.config.maxExercises || 0 })}
      </AlertDescription>
    </Alert>
  );
}
