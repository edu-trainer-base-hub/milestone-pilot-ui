import { describe, expect, it } from "vitest";
import { trainerReducer, getInitialState } from "../model/trainer.reducer";
import { DEFAULT_CONFIG } from "../model/trainer.constants";

describe("trainerReducer", () => {
  it("should return the initial state", () => {
    const initialState = getInitialState();
    expect(initialState.screen).toBe("setup");
    expect(initialState.config).toEqual(DEFAULT_CONFIG);
  });

  it("should update config", () => {
    const state = trainerReducer(getInitialState(), {
      type: "configUpdated",
      payload: { minVal: -10, maxVal: 10 },
    });
    expect(state.config.minVal).toBe(-10);
    expect(state.config.maxVal).toBe(10);
  });

  it("should handle sessionStarted", () => {
    const state = trainerReducer(getInitialState(), { type: "sessionStarted" });
    expect(state.screen).toBe("play");
    expect(state.progress.streak).toBe(0);
    expect(state.gameOver).toBe(false);
  });

  it("should handle answerSubmitted (correct)", () => {
    let state = trainerReducer(getInitialState(), { type: "sessionStarted" });
    state = trainerReducer(state, {
      type: "answerSubmitted",
      payload: { userAnswer: "5", correctAnswer: 5, prompt: "2 + 3 = ?", isCorrect: true, feedback: "Correct!" },
    });
    expect(state.progress.correctCount).toBe(1);
    expect(state.progress.wrongCount).toBe(0);
    expect(state.progress.streak).toBe(1);
    expect(state.progress.bestStreak).toBe(1);
    expect(state.progress.history.length).toBe(1);
    expect(state.progress.lastWasCorrect).toBe(true);
  });

  it("should handle answerSubmitted (wrong)", () => {
    let state = trainerReducer(getInitialState(), { type: "sessionStarted" });
    // First correct
    state = trainerReducer(state, {
      type: "answerSubmitted",
      payload: { userAnswer: "5", correctAnswer: 5, prompt: "2 + 3 = ?", isCorrect: true, feedback: "Correct!" },
    });
    // Then wrong
    state = trainerReducer(state, {
      type: "answerSubmitted",
      payload: { userAnswer: "4", correctAnswer: 5, prompt: "2 + 3 = ?", isCorrect: false, feedback: "Wrong!" },
    });
    expect(state.progress.correctCount).toBe(1);
    expect(state.progress.wrongCount).toBe(1);
    expect(state.progress.streak).toBe(0);
    expect(state.progress.bestStreak).toBe(1);
    expect(state.progress.history.length).toBe(2);
    expect(state.progress.lastWasCorrect).toBe(false);
  });
});
