import { describe, expect, it } from "vitest";
import { initialTrainerState, trainerReducer } from "../model/trainer.reducer";

describe("rounding trainer reducer", () => {
  it("starts a session and resets progress", () => {
    const state = trainerReducer(initialTrainerState, { type: "sessionStarted" });

    expect(state.screen).toBe("play");
    expect(state.gameOver).toBe(false);
    expect(state.progress.correctCount).toBe(0);
    expect(state.progress.wrongCount).toBe(0);
    expect(state.progress.history).toHaveLength(0);
    expect(state.progress.lastLine).toBe("");
    expect(state.progress.lastCorrect).toBeNull();
  });

  it("applies answerSubmitted and prepends history entries", () => {
    const started = trainerReducer(initialTrainerState, { type: "sessionStarted" });
    const withTask = trainerReducer(started, {
      type: "taskPrepared",
      payload: {
        original: 149,
        target: 10,
        options: [140, 150, 160, 170],
        taskId: 1,
      },
    });

    const answered = trainerReducer(withTask, {
      type: "answerSubmitted",
      payload: {
        item: {
          original: 149,
          target: 10,
          user: 150,
          correctRounded: 150,
          correct: true,
          explanation: "Round to tens.",
        },
        lastLine: "149 → tens = 150",
      },
    });

    expect(answered.progress.correctCount).toBe(1);
    expect(answered.progress.wrongCount).toBe(0);
    expect(answered.progress.history).toHaveLength(1);
    expect(answered.progress.history[0].user).toBe(150);
    expect(answered.progress.lastLine).toBe("149 → tens = 150");
    expect(answered.progress.lastCorrect).toBe(true);
  });

  it("marks session as finished with a provided reason", () => {
    const started = trainerReducer(initialTrainerState, { type: "sessionStarted" });
    const finished = trainerReducer(started, { type: "sessionFinished", payload: { reason: "time" } });

    expect(finished.gameOver).toBe(true);
    expect(finished.endReason).toBe("time");
  });

  it("returns to setup and clears active play state", () => {
    const started = trainerReducer(initialTrainerState, { type: "sessionStarted" });
    const returned = trainerReducer(started, { type: "returnedToSetup" });

    expect(returned.screen).toBe("setup");
    expect(returned.gameOver).toBe(false);
    expect(returned.currentTask).toBeNull();
    expect(returned.progress.history).toHaveLength(0);
    expect(returned.endReason).toBeNull();
  });
});
