import { useCallback } from "react";
import { trackEvent } from "../services/analytics/trainer.analytics.events";
import type { AnalyticsEvent } from "../services/analytics/trainer.analytics.types";

export function useTrainerAnalytics() {
  const track = useCallback((event: AnalyticsEvent) => {
    trackEvent(event);
  }, []);

  return { track };
}
