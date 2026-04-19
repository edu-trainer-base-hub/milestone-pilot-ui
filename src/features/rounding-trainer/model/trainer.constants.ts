import type { SessionConfig, TargetPlace } from "./trainer.types";

export const DIGITS_CHOICES = [1, 2, 3, 4, 5, 6, 7] as const;

export const ALL_TARGETS: TargetPlace[] = [10, 100, 1000];

export const MAX_HISTORY_ITEMS = 200;

export const DEFAULT_CONFIG: SessionConfig = {
  mode: "quiz",
  includeWhole: true,
  includeDecimals: false,
  decimalPlaces: 1,
  includePositives: true,
  includeNegatives: false,
  magnitudeMode: "digits",
  minDigits: 2,
  maxDigits: 4,
  minValue: 10,
  maxValue: 9999,
  targets: {
    tens: true,
    hundreds: true,
    thousands: false,
  },
  timerMinutes: 0,
  maxExercises: 0,
  soundsEnabled: false,
  includeTieCase: false,
  showHint: false,
};
