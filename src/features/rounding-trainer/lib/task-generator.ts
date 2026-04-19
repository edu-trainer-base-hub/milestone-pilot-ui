import { generateQuizOptions } from "./quiz-options";
import { floorToPlace } from "./rounding";
import { clamp, randInt } from "./random";
import { selectSelectedTargets } from "../model/trainer.selectors";
import type { RoundingTask, SessionConfig, TargetPlace } from "../model/trainer.types";

function typesFilterEmpty(config: SessionConfig): boolean {
  return !config.includeWhole && !config.includeDecimals;
}

function signsFilterEmpty(config: SessionConfig): boolean {
  return !config.includePositives && !config.includeNegatives;
}

function pickMagnitude(config: SessionConfig, minPlace: TargetPlace): number {
  if (config.magnitudeMode === "digits") {
    let minDigits = Math.min(config.minDigits, config.maxDigits);
    let maxDigits = Math.max(config.minDigits, config.maxDigits);
    minDigits = clamp(minDigits, 1, 10);
    maxDigits = clamp(maxDigits, 1, 10);

    const minDigitsFromPlace = Math.max(1, Math.ceil(Math.log10(minPlace + 1)));
    minDigits = Math.max(minDigits, minDigitsFromPlace);

    const digits = randInt(minDigits, maxDigits);
    const min = 10 ** (digits - 1);
    const max = 10 ** digits - 1;
    return randInt(min, Math.max(min, max));
  }

  let minValue = Math.min(config.minValue, config.maxValue);
  let maxValue = Math.max(config.minValue, config.maxValue);
  minValue = Math.max(1, minValue);
  maxValue = Math.max(minValue, maxValue);
  minValue = Math.max(minValue, minPlace);
  return randInt(minValue, maxValue);
}

function applyDecimals(base: number, decimalPlaces: number): number {
  if (decimalPlaces <= 0) return base;
  const factor = 10 ** decimalPlaces;
  const fraction = randInt(0, factor - 1) / factor;
  return base + fraction;
}

function maybeApplyDecimals(base: number, config: SessionConfig): number {
  if (typesFilterEmpty(config) || config.includeDecimals) {
    if (config.includeDecimals && !config.includeWhole) {
      return applyDecimals(base, config.decimalPlaces);
    }
    if (config.includeDecimals && config.includeWhole) {
      return Math.random() < 0.5 ? base : applyDecimals(base, config.decimalPlaces);
    }
  }
  return base;
}

function applySign(magnitude: number, config: SessionConfig): number {
  if (signsFilterEmpty(config)) {
    return Math.random() < 0.5 ? magnitude : -magnitude;
  }
  if (config.includePositives && !config.includeNegatives) return magnitude;
  if (!config.includePositives && config.includeNegatives) return -magnitude;
  return Math.random() < 0.5 ? magnitude : -magnitude;
}

function ensureMagnitudeAtLeastTarget(value: number, target: TargetPlace): number {
  if (Math.abs(value) >= target) return value;
  return (Math.sign(value) || 1) * (target + randInt(0, target - 1));
}

function forceTieCase(value: number, target: TargetPlace): number {
  const sign = Math.sign(value) || 1;
  const base = floorToPlace(Math.abs(value), target);
  const half = base + target / 2;
  return sign * half;
}

export function generateTask(config: SessionConfig, previousTaskId: number, answeredCount: number): RoundingTask {
  const targets = selectSelectedTargets(config);
  const target = targets[randInt(0, targets.length - 1)];

  const magnitude = pickMagnitude(config, target);
  let original = maybeApplyDecimals(magnitude, config);
  original = applySign(original, config);
  original = ensureMagnitudeAtLeastTarget(original, target);

  if (config.includeTieCase && answeredCount === 0) {
    original = forceTieCase(original, target);
  }

  const options = config.mode === "quiz" ? generateQuizOptions(original, target) : [];

  return {
    original,
    target,
    options,
    taskId: previousTaskId + 1,
  };
}
