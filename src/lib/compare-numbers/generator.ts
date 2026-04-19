export type CompareRelation = ">" | "<" | "=";

export type CompareNumberTypeKey = "nonNegativeInt" | "signedInt" | "decimal" | "fraction";

export interface GapSettings {
  min: number;
  max: number | null;
}

export interface IntegerTypeConfig {
  enabled: boolean;
  weight: number;
  min: number;
  max: number;
  gap: GapSettings;
}

export type DecimalPrecisionMode = "exact" | "upTo";

export interface DecimalTypeConfig {
  enabled: boolean;
  weight: number;
  min: number;
  max: number;
  precisionMode: DecimalPrecisionMode;
  precision: number;
  maxPrecision: number;
  gap: GapSettings;
}

export type FractionPreset = "preset12" | "preset20" | "custom";

export interface FractionTypeConfig {
  enabled: boolean;
  weight: number;
  preset: FractionPreset;
  numeratorMin: number;
  numeratorMax: number;
  denominatorMin: number;
  denominatorMax: number;
  gap: GapSettings;
}

export interface GeneratorConfig {
  nonNegativeInt: IntegerTypeConfig;
  signedInt: IntegerTypeConfig;
  decimal: DecimalTypeConfig;
  fraction: FractionTypeConfig;
  equalRatio: number; // 0 - 0.5
}

export interface GeneratedValue {
  type: CompareNumberTypeKey;
  value: number;
  display: string;
  meta?: {
    numerator?: number;
    denominator?: number;
    precision?: number;
  };
}

export interface GeneratedExercise {
  left: GeneratedValue;
  right: GeneratedValue;
  correctRelation: CompareRelation;
}

interface PreparedBase {
  key: CompareNumberTypeKey;
  weight: number;
  gap: GapSettings;
}

interface PreparedInteger extends PreparedBase {
  kind: "integer";
  min: number;
  max: number;
}

interface PreparedDecimal extends PreparedBase {
  kind: "decimal";
  min: number;
  max: number;
  precisions: number[];
}

interface PreparedFraction extends PreparedBase {
  kind: "fraction";
  numeratorMin: number;
  numeratorMax: number;
  denominatorMin: number;
  denominatorMax: number;
}

type PreparedType = PreparedInteger | PreparedDecimal | PreparedFraction;

export interface PreparedGenerator {
  types: PreparedType[];
  equalRatio: number;
}

const EPS = 1e-9;

function clampNumber(value: number, minValue: number, maxValue: number): number {
  if (!Number.isFinite(value)) return minValue;
  return Math.min(Math.max(value, minValue), maxValue);
}

function sanitizeGap(gap: GapSettings): GapSettings {
  const min = Math.max(0, Number.isFinite(gap.min) ? gap.min : 0);
  const maxValue = gap.max == null || !Number.isFinite(gap.max) ? null : Math.max(min, gap.max);
  return { min, max: maxValue };
}

function sanitizeRange(minInput: number, maxInput: number, lowerBound?: number): { min: number; max: number } {
  const min = Number.isFinite(minInput) ? minInput : 0;
  const max = Number.isFinite(maxInput) ? maxInput : min;
  const normalizedMin = lowerBound != null ? Math.max(lowerBound, Math.min(min, max)) : Math.min(min, max);
  const normalizedMax = Math.max(normalizedMin, max);
  return { min: normalizedMin, max: normalizedMax };
}

function validNonNegativeConfig(config: IntegerTypeConfig): PreparedInteger | null {
  if (!config.enabled) return null;
  const gap = sanitizeGap(config.gap);
  const { min, max } = sanitizeRange(Math.max(0, config.min), Math.max(0, config.max), 0);
  if (min > max) return null;
  return {
    key: "nonNegativeInt",
    weight: Math.max(0, config.weight),
    kind: "integer",
    min,
    max,
    gap,
  };
}

function validSignedConfig(config: IntegerTypeConfig): PreparedInteger | null {
  if (!config.enabled) return null;
  const gap = sanitizeGap(config.gap);
  const { min, max } = sanitizeRange(config.min, config.max);
  if (min > max) return null;
  return {
    key: "signedInt",
    weight: Math.max(0, config.weight),
    kind: "integer",
    min,
    max,
    gap,
  };
}

function buildDecimal(config: DecimalTypeConfig): PreparedDecimal | null {
  if (!config.enabled) return null;
  const gap = sanitizeGap(config.gap);
  const { min, max } = sanitizeRange(config.min, config.max);
  const precisionUpper = clampNumber(Math.round(config.maxPrecision), 0, 6);
  const exactPrecision = clampNumber(Math.round(config.precision), 0, 6);
  const precisionPool: number[] = [];
  if (config.precisionMode === "exact") {
    precisionPool.push(exactPrecision);
  } else {
    for (let i = 0; i <= precisionUpper; i++) {
      precisionPool.push(i);
    }
  }
  const validPrecisions = precisionPool.filter((prec) => {
    const factor = 10 ** prec;
    const minInt = Math.ceil(min * factor - EPS);
    const maxInt = Math.floor(max * factor + EPS);
    return minInt <= maxInt;
  });
  if (validPrecisions.length === 0) {
    return null;
  }
  return {
    key: "decimal",
    kind: "decimal",
    weight: Math.max(0, config.weight),
    min,
    max,
    precisions: validPrecisions,
    gap,
  };
}

function buildFraction(config: FractionTypeConfig): PreparedFraction | null {
  if (!config.enabled) return null;
  const gap = sanitizeGap(config.gap);
  let numeratorMin: number;
  let numeratorMax: number;
  let denominatorMin: number;
  let denominatorMax: number;

  switch (config.preset) {
    case "preset12":
      numeratorMin = 1;
      numeratorMax = 12;
      denominatorMin = 2;
      denominatorMax = 12;
      break;
    case "preset20":
      numeratorMin = 1;
      numeratorMax = 20;
      denominatorMin = 2;
      denominatorMax = 20;
      break;
    case "custom":
    default:
      ({ min: numeratorMin, max: numeratorMax } = sanitizeRange(
        Math.max(1, config.numeratorMin),
        Math.max(1, config.numeratorMax),
        1
      ));
      ({ min: denominatorMin, max: denominatorMax } = sanitizeRange(
        Math.max(1, config.denominatorMin),
        Math.max(1, config.denominatorMax),
        1
      ));
      break;
  }

  denominatorMin = Math.max(1, denominatorMin);
  if (denominatorMin > denominatorMax || numeratorMin > numeratorMax) {
    return null;
  }

  return {
    key: "fraction",
    kind: "fraction",
    weight: Math.max(0, config.weight),
    numeratorMin,
    numeratorMax,
    denominatorMin,
    denominatorMax,
    gap,
  };
}

export function prepareGenerator(config: GeneratorConfig): PreparedGenerator {
  const prepared: PreparedType[] = [];

  const nonNegative = validNonNegativeConfig(config.nonNegativeInt);
  if (nonNegative) prepared.push(nonNegative);

  const signed = validSignedConfig(config.signedInt);
  if (signed) prepared.push(signed);

  const decimal = buildDecimal(config.decimal);
  if (decimal) prepared.push(decimal);

  const fraction = buildFraction(config.fraction);
  if (fraction) prepared.push(fraction);

  const equalRatio = clampNumber(config.equalRatio, 0, 0.5);

  return {
    types: prepared,
    equalRatio,
  };
}

function randomInt(min: number, max: number): number {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function pickType(types: PreparedType[]): PreparedType | null {
  if (types.length === 0) return null;
  const positiveWeightTotal = types.reduce((acc, type) => acc + Math.max(0, type.weight), 0);
  const total = positiveWeightTotal > 0 ? positiveWeightTotal : types.length;
  const target = Math.random() * total;
  if (positiveWeightTotal <= 0) {
    const index = Math.floor(Math.random() * types.length);
    return types[index];
  }
  let cumulative = 0;
  for (const type of types) {
    cumulative += Math.max(0, type.weight);
    if (target < cumulative) {
      return type;
    }
  }
  return types[types.length - 1];
}

function generateIntegerValue(type: PreparedInteger): GeneratedValue {
  const value = randomInt(type.min, type.max);
  return {
    type: type.key,
    value,
    display: value.toString(),
  };
}

function generateDecimalValue(type: PreparedDecimal): GeneratedValue | null {
  if (type.precisions.length === 0) return null;
  const precision = type.precisions[Math.floor(Math.random() * type.precisions.length)];
  const factor = 10 ** precision;
  const minInt = Math.ceil(type.min * factor - EPS);
  const maxInt = Math.floor(type.max * factor + EPS);
  if (minInt > maxInt) return null;
  const intValue = randomInt(minInt, maxInt);
  const value = intValue / factor;
  return {
    type: "decimal",
    value,
    display: value.toFixed(precision),
    meta: { precision },
  };
}

type DecimalBias = "random" | "low" | "high" | "near";

function intersection<T>(left: readonly T[], right: readonly T[]): T[] {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function pickPrecision(type: PreparedDecimal, preferred?: readonly number[]): number {
  const source =
    preferred && preferred.length > 0 ? preferred.filter((value) => type.precisions.includes(value)) : null;
  const pool = source && source.length > 0 ? source : type.precisions;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function integerPartRange(type: PreparedDecimal): { min: number; max: number } {
  const minValue = Math.min(type.min, type.max);
  const maxValue = Math.max(type.min, type.max);
  return { min: Math.trunc(minValue), max: Math.trunc(maxValue) };
}

function selectBiasedInt(start: number, end: number, bias: DecimalBias, anchor?: number): number {
  if (start >= end) {
    return start;
  }
  const span = end - start;
  switch (bias) {
    case "low": {
      const window = Math.max(1, Math.floor(span * 0.2));
      return randomInt(start, Math.min(end, start + window));
    }
    case "high": {
      const window = Math.max(1, Math.floor(span * 0.2));
      return randomInt(Math.max(start, end - window), end);
    }
    case "near": {
      if (anchor == null) {
        break;
      }
      const window = Math.max(1, Math.floor(span * 0.1));
      const centered = Math.max(start, Math.min(end, anchor));
      const windowStart = Math.max(start, centered - window);
      const windowEnd = Math.min(end, centered + window);
      return randomInt(windowStart, windowEnd);
    }
    default:
      break;
  }
  return randomInt(start, end);
}

function decimalBoundsForInteger(
  type: PreparedDecimal,
  targetInt: number,
  precision: number
): { start: number; end: number } | null {
  const factor = 10 ** precision;
  let start = targetInt >= 0 ? targetInt * factor : (targetInt - 1) * factor + 1;
  let end = targetInt >= 0 ? (targetInt + 1) * factor - 1 : targetInt * factor;
  const minInt = Math.ceil(type.min * factor - EPS);
  const maxInt = Math.floor(type.max * factor + EPS);
  start = Math.max(start, minInt);
  end = Math.min(end, maxInt);
  if (start > end) {
    return null;
  }
  return { start, end };
}

function generateDecimalWithIntegerPart(
  type: PreparedDecimal,
  targetInt: number,
  precision: number,
  bias: DecimalBias,
  anchorValue?: number
): GeneratedValue | null {
  const bounds = decimalBoundsForInteger(type, targetInt, precision);
  if (!bounds) {
    return null;
  }
  const factor = 10 ** precision;
  const anchorInt = anchorValue != null ? Math.round(anchorValue * factor) : undefined;
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidateInt = selectBiasedInt(bounds.start, bounds.end, bias, anchorInt);
    const value = candidateInt / factor;
    if (Math.trunc(value) !== targetInt) {
      continue;
    }
    return {
      type: "decimal",
      value,
      display: value.toFixed(precision),
      meta: { precision },
    };
  }
  return null;
}

function tryGenerateSameIntegerDecimals(
  leftType: PreparedDecimal,
  rightType: PreparedDecimal
): { left: GeneratedValue; right: GeneratedValue } | null {
  const leftRange = integerPartRange(leftType);
  const rightRange = integerPartRange(rightType);
  const sharedMin = Math.max(leftRange.min, rightRange.min);
  const sharedMax = Math.min(leftRange.max, rightRange.max);
  if (sharedMin > sharedMax) {
    return null;
  }
  const sharedPrecisions = intersection(leftType.precisions, rightType.precisions);
  const targetInt = randomInt(sharedMin, sharedMax);
  const leftPrecision = pickPrecision(leftType, sharedPrecisions);
  const rightPrecision = pickPrecision(rightType, sharedPrecisions);
  const leftValue = generateDecimalWithIntegerPart(leftType, targetInt, leftPrecision, "random");
  if (!leftValue) {
    return null;
  }
  let rightValue = generateDecimalWithIntegerPart(rightType, targetInt, rightPrecision, "near", leftValue.value);
  if (!rightValue) {
    return null;
  }
  if (Math.abs(leftValue.value - rightValue.value) < EPS) {
    rightValue = generateDecimalWithIntegerPart(rightType, targetInt, rightPrecision, "high", leftValue.value);
    if (!rightValue || Math.abs(leftValue.value - rightValue.value) < EPS) {
      return null;
    }
  }
  return { left: leftValue, right: rightValue };
}

function tryGenerateNeighborIntegerDecimals(
  leftType: PreparedDecimal,
  rightType: PreparedDecimal
): { left: GeneratedValue; right: GeneratedValue } | null {
  const leftRange = integerPartRange(leftType);
  const rightRange = integerPartRange(rightType);
  if (leftRange.min > leftRange.max || rightRange.min > rightRange.max) {
    return null;
  }
  for (let attempt = 0; attempt < 40; attempt++) {
    const leftInt = randomInt(leftRange.min, leftRange.max);
    const candidates: number[] = [];
    if (leftInt - 1 >= rightRange.min && leftInt - 1 <= rightRange.max) {
      candidates.push(leftInt - 1);
    }
    if (leftInt + 1 >= rightRange.min && leftInt + 1 <= rightRange.max) {
      candidates.push(leftInt + 1);
    }
    if (candidates.length === 0) {
      continue;
    }
    const rightInt = candidates[Math.floor(Math.random() * candidates.length)];
    const leftPrecision = pickPrecision(leftType);
    const rightPrecision = pickPrecision(rightType);
    const leftBias: DecimalBias = rightInt > leftInt ? "high" : "low";
    const rightBias: DecimalBias = rightInt > leftInt ? "low" : "high";
    const leftValue = generateDecimalWithIntegerPart(leftType, leftInt, leftPrecision, leftBias);
    const rightValue = generateDecimalWithIntegerPart(rightType, rightInt, rightPrecision, rightBias);
    if (!leftValue || !rightValue) {
      continue;
    }
    if (Math.abs(leftValue.value - rightValue.value) < EPS) {
      continue;
    }
    return { left: leftValue, right: rightValue };
  }
  return null;
}

function generateDecimalPair(
  leftType: PreparedDecimal,
  rightType: PreparedDecimal
): { left: GeneratedValue; right: GeneratedValue } | null {
  for (let attempt = 0; attempt < 120; attempt++) {
    const preferSameInteger = Math.random() < 0.75;
    const pair = preferSameInteger
      ? tryGenerateSameIntegerDecimals(leftType, rightType)
      : tryGenerateNeighborIntegerDecimals(leftType, rightType);
    if (!pair) {
      continue;
    }
    if (Math.abs(pair.left.value - pair.right.value) < EPS) {
      continue;
    }
    return pair;
  }
  return null;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x === 0 ? 1 : x;
}

function generateFractionValue(type: PreparedFraction): GeneratedValue | null {
  for (let attempts = 0; attempts < 20; attempts++) {
    const numerator = randomInt(type.numeratorMin, type.numeratorMax);
    const denominator = randomInt(type.denominatorMin, type.denominatorMax);
    if (denominator === 0) continue;
    const divisor = gcd(numerator, denominator);
    const simplifiedNumerator = numerator / divisor;
    const simplifiedDenominator = denominator / divisor;
    const value = simplifiedNumerator / simplifiedDenominator;
    return {
      type: "fraction",
      value,
      display: `${simplifiedNumerator}/${simplifiedDenominator}`,
      meta: {
        numerator: simplifiedNumerator,
        denominator: simplifiedDenominator,
      },
    };
  }
  return null;
}

function generateValue(type: PreparedType): GeneratedValue | null {
  switch (type.kind) {
    case "integer":
      return generateIntegerValue(type);
    case "decimal":
      return generateDecimalValue(type);
    case "fraction":
      return generateFractionValue(type);
    default:
      return null;
  }
}

function cloneForEquality(value: GeneratedValue): GeneratedValue {
  return {
    type: value.type,
    value: value.value,
    display: value.display,
    meta: value.meta ? { ...value.meta } : undefined,
  };
}

function combinedGap(left: PreparedType, right: PreparedType): GapSettings {
  const min = Math.max(left.gap.min, right.gap.min);
  const maxLeft = left.gap.max;
  const maxRight = right.gap.max;
  let max: number | null = null;
  if (maxLeft != null && maxRight != null) {
    max = Math.min(maxLeft, maxRight);
  } else if (maxLeft != null) {
    max = maxLeft;
  } else if (maxRight != null) {
    max = maxRight;
  }
  if (max != null && max < min) {
    max = min;
  }
  return { min, max };
}

export function canGenerate(prepared: PreparedGenerator): boolean {
  return prepared.types.length > 0;
}

export function generateExercise(prepared: PreparedGenerator): GeneratedExercise | null {
  if (prepared.types.length === 0) return null;
  const equalityCandidates = prepared.types.filter((type) => type.gap.min <= 0);
  const canForceEquality = equalityCandidates.length > 0 && prepared.equalRatio > 0;
  const wantsEquality = canForceEquality && Math.random() < prepared.equalRatio;

  const maxAttempts = 300;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (wantsEquality) {
      const chosenType = pickType(equalityCandidates) ?? equalityCandidates[0];
      if (!chosenType) break;
      const left = generateValue(chosenType);
      if (!left) continue;
      const right = cloneForEquality(left);
      const gap = combinedGap(chosenType, chosenType);
      if (gap.min > EPS) {
        continue;
      }
      return { left, right, correctRelation: "=" };
    }

    const leftType = pickType(prepared.types);
    const rightType = pickType(prepared.types);
    if (!leftType || !rightType) break;
    let left: GeneratedValue | null = null;
    let right: GeneratedValue | null = null;
    if (leftType.kind === "decimal" && rightType.kind === "decimal") {
      const pair = generateDecimalPair(leftType, rightType);
      if (!pair) {
        continue;
      }
      left = pair.left;
      right = pair.right;
    } else {
      left = generateValue(leftType);
      right = generateValue(rightType);
    }
    if (!left || !right) continue;
    const diff = left.value - right.value;
    if (Math.abs(diff) < EPS) {
      continue;
    }
    const gap = combinedGap(leftType, rightType);
    const absDiff = Math.abs(diff);
    if (absDiff + EPS < gap.min) continue;
    if (gap.max != null && absDiff - EPS > gap.max) continue;
    const correctRelation: CompareRelation = diff > 0 ? ">" : "<";
    return { left, right, correctRelation };
  }

  return null;
}
