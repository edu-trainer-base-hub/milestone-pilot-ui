import type {
  AnalyticsEventName,
  SetupChangedPayload,
  SessionStartedPayload,
  AnswerSubmittedPayload,
  SessionFinishedPayload,
} from "./trainer.analytics.types";

/**
 * No-op analytics adapter.
 * Could hook into Google Analytics, Segment, DataDog, etc.
 */
export const trainerAnalyticsService = {
  trackEvent(_eventName: AnalyticsEventName, _payload?: unknown): void {
    // In a real app this would send to an event bus or analytics provider.
    // For now, it satisfies the extensibility requirement as a no-op safe adapter.
  },

  trackSetupChanged(payload: SetupChangedPayload) {
    this.trackEvent("multiplication_trainer_setup_changed", payload);
  },

  trackSessionStarted(payload: SessionStartedPayload) {
    this.trackEvent("multiplication_trainer_session_started", payload);
  },

  trackAnswerSubmitted(payload: AnswerSubmittedPayload) {
    this.trackEvent("multiplication_trainer_answer_submitted", payload);
  },

  trackSessionFinished(payload: SessionFinishedPayload) {
    this.trackEvent("multiplication_trainer_session_finished", payload);
  },
};
