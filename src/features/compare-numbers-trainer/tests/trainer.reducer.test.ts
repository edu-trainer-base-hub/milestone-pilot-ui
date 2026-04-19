import { describe, expect, it } from "vitest";
import { compareNumbersSessionReducer, initialCompareNumbersSessionState } from "../model/trainer.reducer";
import type { GeneratedExercise } from "@/lib/compare-numbers/generator";

const SAMPLE_EXERCISE: GeneratedExercise = {
  left: { type: "nonNegativeInt", value: 2, display: "2" },
  right: { type: "nonNegativeInt", value: 5, display: "5" },
  correctRelation: "<",
};

describe("compareNumbersSessionReducer", () => {
  it("starts a new play session and resets progress", () => {
    const state = compareNumbersSessionReducer(initialCompareNumbersSessionState, {
      type: "sessionStarted",
      payload: { exercise: SAMPLE_EXERCISE },
    });

    expect(state.screen).toBe("play");
    expect(state.gameOver).toBe(false);
    expect(state.correctCount).toBe(0);
    expect(state.wrongCount).toBe(0);
    expect(state.history).toHaveLength(0);
    expect(state.exercise).toEqual(SAMPLE_EXERCISE);
    expect(state.taskId).toBe(1);
    expect(state.sessionAnchor).toBe(1);
  });

  it("registers answer feedback and history entry", () => {
    const started = compareNumbersSessionReducer(initialCompareNumbersSessionState, {
      type: "sessionStarted",
      payload: { exercise: SAMPLE_EXERCISE },
    });

    const answered = compareNumbersSessionReducer(started, {
      type: "answerRegistered",
      payload: {
        isCorrect: true,
        feedback: {
          type: "correct",
          userRelation: "<",
          correctRelation: "<",
        },
        entry: {
          id: 1,
          left: SAMPLE_EXERCISE.left,
          right: SAMPLE_EXERCISE.right,
          correctRelation: "<",
          userRelation: "<",
          isCorrect: true,
          timestamp: Date.now(),
        },
      },
    });

    expect(answered.correctCount).toBe(1);
    expect(answered.wrongCount).toBe(0);
    expect(answered.history).toHaveLength(1);
    expect(answered.feedback?.type).toBe("correct");
  });

  it("marks session as finished if next exercise is unavailable", () => {
    const started = compareNumbersSessionReducer(initialCompareNumbersSessionState, {
      type: "sessionStarted",
      payload: { exercise: SAMPLE_EXERCISE },
    });

    const finished = compareNumbersSessionReducer(started, {
      type: "exerciseAdvanced",
      payload: { exercise: null },
    });

    expect(finished.gameOver).toBe(true);
    expect(finished.endReason).toBe("generator");
    expect(finished.exercise).toBeNull();
  });
});
