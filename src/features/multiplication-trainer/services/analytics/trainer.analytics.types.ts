import type { SessionConfig } from "../../model/trainer.types";

export type AnalyticsEventName =
  | "multiplication_trainer_opened"
  | "multiplication_trainer_setup_changed"
  | "multiplication_trainer_session_started"
  | "multiplication_trainer_task_generated"
  | "multiplication_trainer_answer_submitted"
  | "multiplication_trainer_session_finished"
  | "multiplication_trainer_suggestion_shown";

export interface AnalyticsBasePayload {
  capabilityTier: string;
  sessionId?: string;
  source: "multiplication_trainer";
}

export interface SetupChangedPayload extends AnalyticsBasePayload {
  config: SessionConfig;
}

export interface SessionStartedPayload extends AnalyticsBasePayload {
  config: SessionConfig;
}

export interface AnswerSubmittedPayload extends AnalyticsBasePayload {
  isCorrect: boolean;
  op: "mul" | "div";
}

export interface SessionFinishedPayload extends AnalyticsBasePayload {
  reason: "time" | "ex";
  durationSeconds: number;
  totalAnswered: number;
  accuracy: number;
}
