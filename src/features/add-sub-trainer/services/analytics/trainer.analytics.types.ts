import type { Op, SessionConfig } from "../../model/trainer.types";

export type AnalyticsEvent =
  | { name: "add_sub_trainer_setup_changed"; payload: Partial<SessionConfig> }
  | { name: "add_sub_trainer_session_started"; payload: { config: SessionConfig } }
  | {
      name: "add_sub_trainer_answer_submitted";
      payload: {
        isCorrect: boolean;
        streak: number;
        op: Op;
        timeTakenSec: number;
        prompt: string;
      };
    }
  | {
      name: "add_sub_trainer_session_finished";
      payload: {
        reason: "time" | "limit";
        correctCount: number;
        wrongCount: number;
        bestStreak: number;
        durationSec: number;
      };
    };
