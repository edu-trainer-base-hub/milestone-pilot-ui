import type {
  AnalyticsEventName,
  AnswerSubmittedPayload,
  FeatureLockedPayload,
  MiniAppViewedPayload,
  PromptShownPayload,
  SessionFinishedPayload,
  SessionStartedPayload,
  SetupChangedPayload,
} from "./trainer.analytics.types";

/**
 * Feature-local analytics adapter.
 * Keep as no-op until real analytics transport is connected.
 */
export const compareNumbersAnalyticsService = {
  trackEvent(eventName: AnalyticsEventName, payload?: unknown): void {
    void eventName;
    void payload;
    // Intentionally no-op for now.
  },

  trackMiniAppViewed(payload: MiniAppViewedPayload): void {
    this.trackEvent("compare_numbers_viewed", payload);
  },

  trackSetupChanged(payload: SetupChangedPayload): void {
    this.trackEvent("compare_numbers_setup_changed", payload);
  },

  trackSessionStarted(payload: SessionStartedPayload): void {
    this.trackEvent("compare_numbers_session_started", payload);
  },

  trackAnswerSubmitted(payload: AnswerSubmittedPayload): void {
    this.trackEvent("compare_numbers_answer_submitted", payload);
  },

  trackSessionFinished(payload: SessionFinishedPayload): void {
    this.trackEvent("compare_numbers_session_finished", payload);
  },

  trackLoginSuggestionShown(payload: PromptShownPayload): void {
    this.trackEvent("compare_numbers_login_suggestion_shown", payload);
  },

  trackUpgradeSuggestionShown(payload: PromptShownPayload): void {
    this.trackEvent("compare_numbers_upgrade_suggestion_shown", payload);
  },

  trackFeatureLockedViewed(payload: FeatureLockedPayload): void {
    this.trackEvent("compare_numbers_feature_locked_viewed", payload);
  },
};
