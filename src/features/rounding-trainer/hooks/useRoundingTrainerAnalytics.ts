import React from "react";
import type { Mode, SessionConfig, SessionEndReason, TargetPlace } from "../model/trainer.types";
import { roundingTrainerAnalyticsService } from "../services/analytics/trainer.analytics.events";
import { useRoundingTrainerCapabilities } from "./useRoundingTrainerCapabilities";

export function useRoundingTrainerAnalytics() {
  const { accessLevel } = useRoundingTrainerCapabilities();

  const buildBasePayload = React.useCallback(
    (sessionId?: string) => ({
      source: "rounding_trainer" as const,
      accessLevel,
      sessionId,
    }),
    [accessLevel]
  );

  const trackMiniAppViewed = React.useCallback(() => {
    roundingTrainerAnalyticsService.trackMiniAppViewed(buildBasePayload());
  }, [buildBasePayload]);

  const trackSetupChanged = React.useCallback(
    (config: SessionConfig) => {
      roundingTrainerAnalyticsService.trackSetupChanged({
        ...buildBasePayload(),
        config,
      });
    },
    [buildBasePayload]
  );

  const trackSessionStarted = React.useCallback(
    (sessionId: string, config: SessionConfig) => {
      roundingTrainerAnalyticsService.trackSessionStarted({
        ...buildBasePayload(sessionId),
        config,
      });
    },
    [buildBasePayload]
  );

  const trackAnswerSubmitted = React.useCallback(
    (sessionId: string, isCorrect: boolean, target: TargetPlace, mode: Mode) => {
      roundingTrainerAnalyticsService.trackAnswerSubmitted({
        ...buildBasePayload(sessionId),
        isCorrect,
        target,
        mode,
      });
    },
    [buildBasePayload]
  );

  const trackSessionFinished = React.useCallback(
    (sessionId: string, reason: SessionEndReason, durationSeconds: number, totalAnswered: number, accuracy: number) => {
      roundingTrainerAnalyticsService.trackSessionFinished({
        ...buildBasePayload(sessionId),
        reason,
        durationSeconds,
        totalAnswered,
        accuracy,
      });
    },
    [buildBasePayload]
  );

  const trackLoginSuggestionShown = React.useCallback(
    (placement: string, sessionId?: string) => {
      roundingTrainerAnalyticsService.trackLoginSuggestionShown({
        ...buildBasePayload(sessionId),
        placement,
      });
    },
    [buildBasePayload]
  );

  const trackUpgradeSuggestionShown = React.useCallback(
    (placement: string, sessionId?: string) => {
      roundingTrainerAnalyticsService.trackUpgradeSuggestionShown({
        ...buildBasePayload(sessionId),
        placement,
      });
    },
    [buildBasePayload]
  );

  const trackFeatureLockedViewed = React.useCallback(
    (featureId: string, placement: string, sessionId?: string) => {
      roundingTrainerAnalyticsService.trackFeatureLockedViewed({
        ...buildBasePayload(sessionId),
        featureId,
        placement,
      });
    },
    [buildBasePayload]
  );

  return {
    trackMiniAppViewed,
    trackSetupChanged,
    trackSessionStarted,
    trackAnswerSubmitted,
    trackSessionFinished,
    trackLoginSuggestionShown,
    trackUpgradeSuggestionShown,
    trackFeatureLockedViewed,
  };
}
