import type { SessionConfig } from "./trainer.types";

export const DEFAULT_CONFIG: SessionConfig = {
  minVal: 4,
  maxVal: 9,
  includeMul: true,
  includeDiv: true,
  timerMinutes: 0,
  maxExercises: 0,
  mode: "quiz",
};

export const MAX_HISTORY_ITEMS = 100;
