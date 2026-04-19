import type { TargetPlace } from "../model/trainer.types";

export function roundHalfUpInteger(value: number): number {
  if (!Number.isFinite(value)) return value;
  return value >= 0 ? Math.floor(value + 0.5) : -Math.floor(-value + 0.5);
}

export function roundHalfUpTo(value: number, place: TargetPlace): number {
  const normalized = value / place;
  return roundHalfUpInteger(normalized) * place;
}

export function floorToPlace(value: number, place: TargetPlace): number {
  const sign = Math.sign(value) || 1;
  const abs = Math.abs(value);
  const floored = Math.floor(abs / place) * place;
  return sign * floored;
}

export function ceilToPlace(value: number, place: TargetPlace): number {
  const sign = Math.sign(value) || 1;
  const abs = Math.abs(value);
  const ceiled = Math.ceil(abs / place) * place;
  return sign * ceiled;
}

export function getCheckDigitForPlace(value: number, place: TargetPlace): number {
  const absInteger = Math.abs(Math.trunc(value));
  const lowerPlace = place / 10;
  if (lowerPlace < 1) return 0;
  return Math.floor((absInteger % place) / lowerPlace);
}
