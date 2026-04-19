import type { SessionState } from "./trainer.types";

export const selectAccuracy = (state: SessionState): number => {
  const total = state.progress.correctCount + state.progress.wrongCount;
  return total === 0 ? 0 : Math.round((state.progress.correctCount / total) * 100);
};

export const selectTotalAnswered = (state: SessionState): number => {
  return state.progress.correctCount + state.progress.wrongCount;
};

export const selectIsActive = (state: SessionState): boolean => {
  return state.screen === "play" && !state.gameOver;
};

export const selectShouldEndByExerciseCount = (state: SessionState): boolean => {
  if (state.config.maxExercises <= 0) return false;
  return selectTotalAnswered(state) >= state.config.maxExercises;
};

/** True when the user can interact with setup OR play screens (blocks readOnly spectator views). */
export const selectIsInteractable = (state: SessionState): boolean => {
  return !state.readOnly;
};

/** True when the user can actively answer questions (play screen, not game over, not readOnly). */
export const selectIsPlayInteractable = (state: SessionState): boolean => {
  if (state.readOnly) return false;
  if (state.gameOver) return false;
  if (state.screen !== "play") return false;
  return true;
};
