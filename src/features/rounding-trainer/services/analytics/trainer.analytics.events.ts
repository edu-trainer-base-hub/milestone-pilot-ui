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
 * Kept as a no-op until real analytics transport is connected.
 */
export const roundingTrainerAnalyticsService = {
  trackEvent(eventName: AnalyticsEventName, payload?: unknown): void {
    void eventName;
    void payload;
  },

  trackMiniAppViewed(payload: MiniAppViewedPayload): void {
    this.trackEvent("rounding_trainer_viewed", payload);
  },

  trackSetupChanged(payload: SetupChangedPayload): void {
    this.trackEvent("rounding_trainer_setup_changed", payload);
  },

  trackSessionStarted(payload: SessionStartedPayload): void {
    this.trackEvent("rounding_trainer_session_started", payload);
  },

  trackAnswerSubmitted(payload: AnswerSubmittedPayload): void {
    this.trackEvent("rounding_trainer_answer_submitted", payload);
  },

  trackSessionFinished(payload: SessionFinishedPayload): void {
    this.trackEvent("rounding_trainer_session_finished", payload);
  },

  trackLoginSuggestionShown(payload: PromptShownPayload): void {
    this.trackEvent("rounding_trainer_login_suggestion_shown", payload);
  },

  trackUpgradeSuggestionShown(payload: PromptShownPayload): void {
    this.trackEvent("rounding_trainer_upgrade_suggestion_shown", payload);
  },

  trackFeatureLockedViewed(payload: FeatureLockedPayload): void {
    this.trackEvent("rounding_trainer_feature_locked_viewed", payload);
  },
};
