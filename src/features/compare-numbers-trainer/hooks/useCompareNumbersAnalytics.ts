import React from "react";
import type { CompareRelation } from "@/lib/compare-numbers/generator";
import type { CompareNumbersSetupState, SessionEndReason } from "../model/trainer.types";
import { useCompareNumbersCapabilities } from "./useCompareNumbersCapabilities";
import { compareNumbersAnalyticsService } from "../services/analytics/trainer.analytics.events";

export function useCompareNumbersAnalytics() {
  const { accessLevel } = useCompareNumbersCapabilities();

  const buildBasePayload = React.useCallback(
    (sessionId?: string) => ({
      source: "compare_numbers_trainer" as const,
      accessLevel,
      sessionId,
    }),
    [accessLevel]
  );

  const trackMiniAppViewed = React.useCallback(() => {
    compareNumbersAnalyticsService.trackMiniAppViewed(buildBasePayload());
  }, [buildBasePayload]);

  const trackSetupChanged = React.useCallback(
    (setup: CompareNumbersSetupState) => {
      compareNumbersAnalyticsService.trackSetupChanged({
        ...buildBasePayload(),
        setup,
      });
    },
    [buildBasePayload]
  );

  const trackSessionStarted = React.useCallback(
    (sessionId: string, setup: CompareNumbersSetupState) => {
      compareNumbersAnalyticsService.trackSessionStarted({
        ...buildBasePayload(sessionId),
        setup,
      });
    },
    [buildBasePayload]
  );

  const trackAnswerSubmitted = React.useCallback(
    (sessionId: string, isCorrect: boolean, userRelation: CompareRelation, correctRelation: CompareRelation) => {
      compareNumbersAnalyticsService.trackAnswerSubmitted({
        ...buildBasePayload(sessionId),
        isCorrect,
        userRelation,
        correctRelation,
      });
    },
    [buildBasePayload]
  );

  const trackSessionFinished = React.useCallback(
    (sessionId: string, reason: SessionEndReason, durationSeconds: number, totalAnswered: number, accuracy: number) => {
      compareNumbersAnalyticsService.trackSessionFinished({
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
      compareNumbersAnalyticsService.trackLoginSuggestionShown({
        ...buildBasePayload(sessionId),
        placement,
      });
    },
    [buildBasePayload]
  );

  const trackUpgradeSuggestionShown = React.useCallback(
    (placement: string, sessionId?: string) => {
      compareNumbersAnalyticsService.trackUpgradeSuggestionShown({
        ...buildBasePayload(sessionId),
        placement,
      });
    },
    [buildBasePayload]
  );

  const trackFeatureLockedViewed = React.useCallback(
    (featureId: string, placement: string, sessionId?: string) => {
      compareNumbersAnalyticsService.trackFeatureLockedViewed({
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
