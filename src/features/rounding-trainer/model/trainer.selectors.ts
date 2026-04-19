import { ALL_TARGETS } from "./trainer.constants";
import type { SessionConfig, SessionState, TargetPlace } from "./trainer.types";

export function selectIsInteractable(state: SessionState): boolean {
  return !state.readOnly;
}

export function selectIsPlayInteractable(state: SessionState): boolean {
  return selectIsInteractable(state) && state.screen === "play" && !state.gameOver;
}

export function selectTimerActive(state: SessionState): boolean {
  return state.screen === "play" && !state.gameOver;
}

export function selectTotalAnswered(state: SessionState): number {
  return state.progress.correctCount + state.progress.wrongCount;
}

export function selectAccuracy(state: SessionState): number {
  const totalAnswered = selectTotalAnswered(state);
  if (totalAnswered === 0) return 0;
  return Math.round((state.progress.correctCount / totalAnswered) * 100);
}

export function selectTimeLeft(elapsedSec: number, timerMinutes: number): number | null {
  if (timerMinutes <= 0) return null;
  return Math.max(0, timerMinutes * 60 - elapsedSec);
}

export function selectSelectedTargets(config: SessionConfig): TargetPlace[] {
  const selected: TargetPlace[] = [];
  if (config.targets.tens) selected.push(10);
  if (config.targets.hundreds) selected.push(100);
  if (config.targets.thousands) selected.push(1000);
  return selected.length > 0 ? selected : ALL_TARGETS;
}
