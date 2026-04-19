import type { PreparedGenerator } from "@/lib/compare-numbers/generator";
import type {
  CompareNumbersSessionState,
  CompareNumbersSetupState,
  HistoryEntry,
  HistoryOrder,
  TypeAvailabilityMap,
} from "./trainer.types";

export function selectEqualRatioFraction(setup: CompareNumbersSetupState): number {
  return Math.min(setup.equalRatio, 50) / 100;
}

export function selectExercisesLimit(setup: CompareNumbersSetupState): number | null {
  return setup.maxExercises !== null && setup.maxExercises > 0 ? setup.maxExercises : null;
}

export function selectTimerLimitMinutes(setup: CompareNumbersSetupState): number | null {
  return setup.timerMinutes !== null && setup.timerMinutes > 0 ? setup.timerMinutes : null;
}

export function selectTotalExercises(session: CompareNumbersSessionState): number {
  return session.history.length;
}

export function selectAccuracy(session: CompareNumbersSessionState): number {
  const total = selectTotalExercises(session);
  if (total === 0) return 0;
  return Math.round((session.correctCount / total) * 100);
}

export function selectTimeLeft(elapsedSec: number, timerLimitMinutes: number | null): number | null {
  if (timerLimitMinutes == null) return null;
  return Math.max(0, timerLimitMinutes * 60 - elapsedSec);
}

export function selectHistoryDisplay(history: HistoryEntry[], historyOrder: HistoryOrder): HistoryEntry[] {
  return historyOrder === "asc" ? history : [...history].reverse();
}

export function selectTypeAvailabilityMap(generatorPreview: PreparedGenerator): TypeAvailabilityMap {
  const map: TypeAvailabilityMap = {
    nonNegativeInt: false,
    signedInt: false,
    decimal: false,
    fraction: false,
  };

  for (const type of generatorPreview.types) {
    map[type.key] = true;
  }

  return map;
}
