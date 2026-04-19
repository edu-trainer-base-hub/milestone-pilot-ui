import type { Mode, SessionConfig, SessionEndReason, TargetPlace } from "../../model/trainer.types";
import type { UserAccessLevel } from "../auth/trainer-capabilities";

export type AnalyticsEventName =
  | "rounding_trainer_viewed"
  | "rounding_trainer_setup_changed"
  | "rounding_trainer_session_started"
  | "rounding_trainer_answer_submitted"
  | "rounding_trainer_session_finished"
  | "rounding_trainer_login_suggestion_shown"
  | "rounding_trainer_upgrade_suggestion_shown"
  | "rounding_trainer_feature_locked_viewed";

export interface AnalyticsBasePayload {
  source: "rounding_trainer";
  accessLevel: UserAccessLevel;
  sessionId?: string;
}

export type MiniAppViewedPayload = AnalyticsBasePayload;

export interface SetupChangedPayload extends AnalyticsBasePayload {
  config: SessionConfig;
}

export interface SessionStartedPayload extends AnalyticsBasePayload {
  config: SessionConfig;
}

export interface AnswerSubmittedPayload extends AnalyticsBasePayload {
  isCorrect: boolean;
  target: TargetPlace;
  mode: Mode;
}

export interface SessionFinishedPayload extends AnalyticsBasePayload {
  reason: SessionEndReason;
  durationSeconds: number;
  totalAnswered: number;
  accuracy: number;
}

export interface PromptShownPayload extends AnalyticsBasePayload {
  placement: string;
}

export interface FeatureLockedPayload extends AnalyticsBasePayload {
  featureId: string;
  placement: string;
}
