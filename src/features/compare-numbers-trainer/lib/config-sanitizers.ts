import type { DecimalTypeConfig, FractionTypeConfig, IntegerTypeConfig } from "@/lib/compare-numbers/generator";
import type { ModeKey } from "../model/trainer.types";

export function sanitizeAccordionMode(value: string | undefined): ModeKey | undefined {
  if (!value) return undefined;
  if (value === "nonNegative" || value === "signed" || value === "decimal" || value === "fraction") {
    return value;
  }
  return undefined;
}

export function sanitizeNonNegativeConfig(
  previous: IntegerTypeConfig,
  update: Partial<IntegerTypeConfig>
): IntegerTypeConfig {
  const next = { ...previous, ...update };
  const min = Math.max(0, next.min);
  const max = Math.max(min, next.max);
  return { ...next, min, max };
}

export function sanitizeSignedConfig(
  previous: IntegerTypeConfig,
  update: Partial<IntegerTypeConfig>
): IntegerTypeConfig {
  const next = { ...previous, ...update };
  if (next.min > next.max) {
    return { ...next, max: next.min };
  }
  return next;
}

export function sanitizeDecimalConfig(
  previous: DecimalTypeConfig,
  update: Partial<DecimalTypeConfig>
): DecimalTypeConfig {
  const next = { ...previous, ...update };
  if (next.min > next.max) {
    return { ...next, max: next.min };
  }
  return next;
}

export function sanitizeFractionConfig(
  previous: FractionTypeConfig,
  update: Partial<FractionTypeConfig>
): FractionTypeConfig {
  const next = { ...previous, ...update };
  if (next.preset !== "custom") {
    return next;
  }
  const numeratorMin = Math.max(1, Math.min(next.numeratorMin, next.numeratorMax));
  const numeratorMax = Math.max(numeratorMin, next.numeratorMax);
  const denominatorMin = Math.max(1, Math.min(next.denominatorMin, next.denominatorMax));
  const denominatorMax = Math.max(denominatorMin, next.denominatorMax);

  return {
    ...next,
    numeratorMin,
    numeratorMax,
    denominatorMin,
    denominatorMax,
  };
}

export function parseOptionalLimitFromInput(rawValue: string): number | null {
  if (rawValue === "") return null;
  const value = parseInt(rawValue, 10);
  return Number.isFinite(value) ? Math.max(0, value) : null;
}

export function normalizeOptionalLimit(value: number | null): number | null {
  if (value === null) return null;
  return value > 0 ? value : null;
}
