import type { CompareRelation, GeneratedExercise } from "@/lib/compare-numbers/generator";
import type { TypeAvailabilityMap } from "../model/trainer.types";

type Translator = (key: string, options?: Record<string, unknown>) => string | null;

export function formatTime(totalSec: number): string {
  const seconds = Math.max(0, Math.floor(totalSec));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(minutes)}:${pad(remaining)}`;
}

export function relationLabel(relation: CompareRelation, tr: Translator): string {
  switch (relation) {
    case "<":
      return tr("symbols.less") ?? "<";
    case ">":
      return tr("symbols.greater") ?? ">";
    case "=":
      return tr("symbols.equal") ?? "=";
  }
}

export function summarizeEnabledTypes(map: TypeAvailabilityMap, tr: Translator): string {
  const names: string[] = [];
  if (map.nonNegativeInt) names.push(tr("types.labels.nonNegative") ?? "");
  if (map.signedInt) names.push(tr("types.labels.signed") ?? "");
  if (map.decimal) names.push(tr("types.labels.decimal") ?? "");
  if (map.fraction) names.push(tr("types.labels.fraction") ?? "");
  if (names.length === 0) {
    return tr("types.labels.none") ?? "-";
  }
  return names.filter(Boolean).join(", ");
}

export function resolveDisplaySizeClass(exercise: GeneratedExercise | null): string {
  const leftLength = exercise?.left.display.length ?? 0;
  const rightLength = exercise?.right.display.length ?? 0;
  const maxLength = Math.max(leftLength, rightLength);
  if (maxLength > 26) {
    return "text-lg sm:text-2xl";
  }
  if (maxLength > 20) {
    return "text-xl sm:text-3xl";
  }
  if (maxLength > 14) {
    return "text-2xl sm:text-4xl";
  }
  return "text-3xl sm:text-5xl";
}
