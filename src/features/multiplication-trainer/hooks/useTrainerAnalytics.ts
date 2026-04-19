import React from "react";
import { trainerAnalyticsService } from "../services/analytics/trainer.analytics.events";
import { useCapabilityAccess } from "./useCapabilityAccess";
import type { SessionConfig } from "../model/trainer.types";

export function useTrainerAnalytics() {
  const { tier } = useCapabilityAccess();

  const trackSetupChanged = React.useCallback(
    (config: SessionConfig) => {
      trainerAnalyticsService.trackSetupChanged({
        source: "multiplication_trainer",
        capabilityTier: tier,
        config,
      });
    },
    [tier]
  );

  const trackSessionStarted = React.useCallback(
    (config: SessionConfig) => {
      trainerAnalyticsService.trackSessionStarted({
        source: "multiplication_trainer",
        capabilityTier: tier,
        config,
      });
    },
    [tier]
  );

  const trackAnswerSubmitted = React.useCallback(
    (isCorrect: boolean, op: "mul" | "div") => {
      trainerAnalyticsService.trackAnswerSubmitted({
        source: "multiplication_trainer",
        capabilityTier: tier,
        isCorrect,
        op,
      });
    },
    [tier]
  );

  const trackSessionFinished = React.useCallback(
    (reason: "time" | "ex", durationSeconds: number, totalAnswered: number, accuracy: number) => {
      trainerAnalyticsService.trackSessionFinished({
        source: "multiplication_trainer",
        capabilityTier: tier,
        reason,
        durationSeconds,
        totalAnswered,
        accuracy,
      });
    },
    [tier]
  );

  return {
    trackSetupChanged,
    trackSessionStarted,
    trackAnswerSubmitted,
    trackSessionFinished,
  };
}
