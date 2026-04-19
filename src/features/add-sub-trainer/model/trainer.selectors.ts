import type { Op, SessionState } from "./trainer.types";

export function selectAccuracy(state: SessionState): number {
  const { correctCount, wrongCount } = state.progress;
  const total = correctCount + wrongCount;
  return total === 0 ? 0 : Math.round((correctCount / total) * 100);
}

export function selectTotalAnswered(state: SessionState): number {
  return state.progress.correctCount + state.progress.wrongCount;
}

export function selectIsActive(state: SessionState): boolean {
  return state.screen === "play" && !state.gameOver;
}

export function selectShouldEndByExerciseCount(state: SessionState): boolean {
  const { maxExercises } = state.config;
  const totalAnswered = selectTotalAnswered(state);
  return maxExercises > 0 && totalAnswered >= maxExercises;
}

export function selectIsInteractable(state: SessionState): boolean {
  return !state.readOnly;
}

export function selectIsPlayInteractable(state: SessionState): boolean {
  return !state.readOnly && !state.gameOver && state.screen === "play";
}

export function selectAvailableOps(state: SessionState): Op[] {
  const ops: Op[] = [];
  if (state.config.includeAdd) ops.push("add");
  if (state.config.includeSub) ops.push("sub");
  return ops;
}

export function selectCanStart(state: SessionState): boolean {
  return state.config.includeAdd || state.config.includeSub;
}
