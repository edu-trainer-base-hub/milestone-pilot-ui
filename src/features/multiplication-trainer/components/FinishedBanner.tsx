import { Alert, AlertDescription } from "@/components/ui/alert";

interface FinishedBannerProps {
  endReason: "time" | "ex" | null;
  totalAnswered: number;
  timeUpLabel: string;
  exLimitLabel: (count: number) => string;
}

export function FinishedBanner({ endReason, totalAnswered, timeUpLabel, exLimitLabel }: FinishedBannerProps) {
  if (!endReason) return null;

  return (
    <Alert>
      <AlertDescription>{endReason === "time" ? timeUpLabel : exLimitLabel(totalAnswered)}</AlertDescription>
    </Alert>
  );
}
