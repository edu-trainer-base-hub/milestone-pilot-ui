import type { CompareRelation } from "@/lib/compare-numbers/generator";
import type { CompareNumbersSetupState, SessionEndReason } from "../../model/trainer.types";
import type { UserAccessLevel } from "../auth/trainer-capabilities";

export type AnalyticsEventName =
  | "compare_numbers_viewed"
  | "compare_numbers_setup_changed"
  | "compare_numbers_session_started"
  | "compare_numbers_answer_submitted"
  | "compare_numbers_session_finished"
  | "compare_numbers_login_suggestion_shown"
  | "compare_numbers_upgrade_suggestion_shown"
  | "compare_numbers_feature_locked_viewed";

export interface AnalyticsBasePayload {
  source: "compare_numbers_trainer";
  accessLevel: UserAccessLevel;
  sessionId?: string;
}

export type MiniAppViewedPayload = AnalyticsBasePayload;

export interface SetupChangedPayload extends AnalyticsBasePayload {
  setup: CompareNumbersSetupState;
}

export interface SessionStartedPayload extends AnalyticsBasePayload {
  setup: CompareNumbersSetupState;
}

export interface AnswerSubmittedPayload extends AnalyticsBasePayload {
  isCorrect: boolean;
  userRelation: CompareRelation;
  correctRelation: CompareRelation;
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
