import { ceilToPlace, floorToPlace, getCheckDigitForPlace, roundHalfUpTo } from "./rounding";
import { shuffle } from "./random";
import type { TargetPlace } from "../model/trainer.types";

export function generateQuizOptions(original: number, target: TargetPlace): number[] {
  const correct = roundHalfUpTo(original, target);
  const down = floorToPlace(original, target);
  const up = ceilToPlace(original, target);

  const checkDigit = getCheckDigitForPlace(original, target);
  const actualDirection = checkDigit >= 5 ? "up" : "down";
  const oppositeDirectionValue = actualDirection === "up" ? down : up;

  const wrongPlace: TargetPlace = target === 10 ? 100 : target === 100 ? 10 : 100;
  const wrongPlaceValue = roundHalfUpTo(original, wrongPlace);

  const optionSet = new Set<number>([correct, oppositeDirectionValue, down, wrongPlaceValue]);
  let attempts = 0;
  while (optionSet.size < 4 && attempts < 10) {
    attempts += 1;
    const bump = Math.round(target / 10) || 1;
    optionSet.add(correct + (Math.random() < 0.5 ? -bump : bump));
  }

  return shuffle(Array.from(optionSet)).slice(0, 4);
}
