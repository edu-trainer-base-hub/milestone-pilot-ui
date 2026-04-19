import type { CompareNumbersSessionState, CompareNumbersSetupState } from "./trainer.types";

export const PRECISION_OPTIONS = [0, 1, 2, 3, 4];

export const DEFAULT_SETUP_STATE: CompareNumbersSetupState = {
  nonNegativeConfig: {
    enabled: true,
    weight: 25,
    min: 0,
    max: 99,
    gap: { min: 0, max: null },
  },
  signedConfig: {
    enabled: false,
    weight: 25,
    min: -50,
    max: 50,
    gap: { min: 0, max: null },
  },
  decimalConfig: {
    enabled: false,
    weight: 25,
    min: 0,
    max: 100,
    precisionMode: "exact",
    precision: 1,
    maxPrecision: 2,
    gap: { min: 0, max: null },
  },
  fractionConfig: {
    enabled: false,
    weight: 25,
    preset: "preset12",
    numeratorMin: 1,
    numeratorMax: 12,
    denominatorMin: 2,
    denominatorMax: 12,
    gap: { min: 0, max: null },
  },
  openMode: undefined,
  equalRatio: 10,
  timerMinutes: null,
  maxExercises: null,
  historyOrder: "asc",
  enableSound: false,
  enableVibration: false,
};

export const INITIAL_SESSION_STATE: CompareNumbersSessionState = {
  screen: "setup",
  correctCount: 0,
  wrongCount: 0,
  history: [],
  exercise: null,
  gameOver: false,
  endReason: null,
  feedback: null,
  taskId: 0,
  sessionAnchor: 0,
};
